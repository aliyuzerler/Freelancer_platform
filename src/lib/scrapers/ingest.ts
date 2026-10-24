/**
 * Ingestion — turns a source-agnostic `ScrapedJob` into rows in our normal
 * schema. Each scraped job belongs to an UNCLAIMED client `User` (a company
 * shell) so that the rest of the platform (proposals, messaging, notifications)
 * works unchanged.
 *
 * Two identities are kept deliberately separate:
 *   - `User.email`  — the shell's *account* identity. Synthetic and unroutable
 *     (an `.invalid` address) so we can never accidentally email it and so two
 *     scrapes of the same company dedupe to one shell.
 *   - `RecruiterContact.email` — the *deliverable* address we actually send to,
 *     populated/verified by the email-discovery step and gated by `contactable`.
 */
import { createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { slugify } from '@/lib/utils';
import type { JobScraper, ScrapedJob } from './types';

/** Stable dedupe key for a company: its domain, else a slug of its name. */
function companyKey(job: ScrapedJob): string {
  return (job.companyDomain ?? (slugify(job.companyName) || 'unknown')).toLowerCase();
}

/** Synthetic, intentionally-unroutable account identity for a company shell. */
function shellEmail(job: ScrapedJob): string {
  return `company.${companyKey(job)}@unclaimed.freelancezero.invalid`;
}

function contentHash(job: ScrapedJob): string {
  return createHash('sha256')
    .update(`${job.title}\n${job.description}`)
    .digest('hex');
}

/** Find-or-create the UNCLAIMED company shell + its client profile. */
async function upsertShell(job: ScrapedJob): Promise<string> {
  const email = shellEmail(job);
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return existing.id;

  const user = await db.user.create({
    data: {
      email,
      name: job.companyName,
      role: 'CLIENT',
      status: 'UNCLAIMED',
      clientProfile: {
        create: {
          companyName: job.companyName,
          companyUrl: job.companyDomain ? `https://${job.companyDomain}` : null,
        },
      },
    },
    select: { id: true },
  });
  return user.id;
}

/**
 * Seed a RecruiterContact only when the posting itself published an address.
 * We never invent one here — guessing/verification is the discovery step's job.
 * `contactable` stays false until that step verifies MX, so this is inert until
 * then.
 */
async function seedPublishedContact(userId: string, job: ScrapedJob): Promise<void> {
  if (!job.publishedEmail) return;
  const existing = await db.recruiterContact.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (existing) return;
  await db.recruiterContact.create({
    data: {
      userId,
      email: job.publishedEmail,
      companyDomain: job.companyDomain ?? null,
      origin: 'PUBLISHED',
      confidence: 0.9,
      status: 'UNVERIFIED',
      contactable: false,
    },
  });
}

export interface IngestResult {
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
}

/** Fetch a source and upsert everything it returns. Idempotent per posting. */
export async function runIngest(scraper: JobScraper): Promise<IngestResult> {
  const jobs = await scraper.fetch();
  const result: IngestResult = { fetched: jobs.length, created: 0, updated: 0, skipped: 0 };

  for (const job of jobs) {
    const hash = contentHash(job);

    const existingSource = await db.jobSource.findUnique({
      where: { source_externalId: { source: job.source, externalId: job.externalId } },
      select: { id: true, jobId: true, contentHash: true },
    });

    if (existingSource) {
      // Unchanged re-scrape: just record that we still see it.
      if (existingSource.contentHash === hash) {
        await db.jobSource.update({
          where: { id: existingSource.id },
          data: { lastSeenAt: new Date() },
        });
        result.skipped++;
        continue;
      }
      // Content changed: refresh the job body + source metadata.
      await db.job.update({
        where: { id: existingSource.jobId },
        data: { title: job.title, description: job.description },
      });
      await db.jobSource.update({
        where: { id: existingSource.id },
        data: {
          contentHash: hash,
          url: job.url,
          applyUrl: job.applyUrl ?? null,
          publishedEmail: job.publishedEmail ?? null,
          lastSeenAt: new Date(),
        },
      });
      result.updated++;
      continue;
    }

    // New posting → shell + Job + JobSource (+ contact if published).
    const clientId = await upsertShell(job);
    // The board name is an implementation detail — keep it out of the public URL.
    // The external id keeps slugs unique; a suffix resolves the rare cross-source
    // collision.
    let slug = `${slugify(job.title)}-${job.externalId}`.slice(0, 120);
    if (await db.job.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${slug}-${job.source.toLowerCase()}`.slice(0, 120);
    }

    // FZ-02: scraped postings are never published automatically. A board page
    // is attacker-controllable data — auto-publishing would let a fake job
    // harvest applicant PII under a real company's name. Everything lands as a
    // DRAFT for admin curation (approve/attach a real contact, then publish);
    // proposals cannot be submitted to a job that is not visible. Nothing is
    // discarded.
    const status = 'DRAFT';

    await db.job.create({
      data: {
        clientId,
        title: job.title,
        slug,
        description: job.description || job.title,
        budgetType: 'FIXED',
        budgetMin: job.budgetMin ?? null,
        budgetMax: job.budgetMax ?? null,
        currency: job.currency ?? 'USD',
        status,
        publishedAt: job.postedAt ?? new Date(),
        source: {
          create: {
            source: job.source,
            externalId: job.externalId,
            url: job.url,
            applyUrl: job.applyUrl ?? null,
            publishedEmail: job.publishedEmail ?? null,
            contentHash: hash,
          },
        },
      },
    });

    await seedPublishedContact(clientId, job);
    result.created++;
  }

  return result;
}
