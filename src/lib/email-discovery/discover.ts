/**
 * Discovery orchestrator. For an UNCLAIMED recruiter shell, find the best
 * contact address and decide — via verification + policy — whether we may email
 * it (`contactable`). This is the single authority for the `contactable` gate;
 * nothing else in the codebase sets it to true.
 */
import type {
  RecruiterEmailOrigin,
  RecruiterEmailStatus,
} from '@prisma/client';
import { db } from '@/lib/db';
import { env } from '@/lib/env';
import { domainFromUrl } from '@/lib/scrapers/types';
import { roleBoxCandidates, type AddressCandidate } from './patterns';
import { verifyAddress, type VerifyResult } from './verify';

interface Scored {
  status: RecruiterEmailStatus;
  confidence: number;
  isCatchAll: boolean;
  contactable: boolean;
}

const clamp = (n: number) => Math.max(0, Math.min(1, n));

/** Turn a verification result + origin into stored status/confidence/gate. */
function score(
  origin: RecruiterEmailOrigin,
  base: number,
  v: VerifyResult,
): Scored {
  const published = origin === 'PUBLISHED' || origin === 'ATS_REPLY';

  if (!v.mxOk) {
    return { status: 'UNDELIVERABLE', confidence: 0, isCatchAll: false, contactable: false };
  }

  let status: RecruiterEmailStatus = 'MX_OK';
  let confidence = base;

  if (v.isCatchAll) {
    status = 'CATCH_ALL';
    confidence = Math.min(confidence, 0.55);
  } else if (v.smtpDeliverable === true) {
    status = 'DELIVERABLE';
    confidence += 0.25;
  } else if (v.smtpDeliverable === false) {
    return { status: 'UNDELIVERABLE', confidence: 0, isCatchAll: false, contactable: false };
  }

  // Published addresses are an explicit invitation to apply — floor their trust.
  if (published) confidence = Math.max(confidence, 0.9);
  confidence = clamp(confidence);

  // The gate. Published: contactable unless undeliverable. Guessed: must clear
  // the configured confidence bar, and only when the policy permits guessing.
  const guessingAllowed = env.RECRUITER_OUTREACH_POLICY !== 'published_only';
  const contactable = published
    ? true
    : guessingAllowed && confidence >= env.RECRUITER_MIN_CONFIDENCE;

  return { status, confidence, isCatchAll: v.isCatchAll ?? false, contactable };
}

/**
 * Promote a verified published address to the shell's login email.
 *
 * REMOVED (FZ-02): a scraped "published" address proves nothing about who
 * controls the posting — an attacker can list a fake job under a real
 * company's name with their own contact address, harvest the one-click
 * sign-in, and read every applicant's proposal. Scraped emails therefore
 * never become login identities. Recruiter access is limited to per-job,
 * expiring token links delivered by email, and scraped jobs stay DRAFT until
 * an admin publishes them (see ingest.ts), so nothing is readable before a
 * human curates it.
 */

/** Resolve the company domain from whatever hints we have. */
async function resolveDomain(userId: string): Promise<string | undefined> {
  const contact = await db.recruiterContact.findUnique({
    where: { userId },
    select: { companyDomain: true, email: true },
  });
  if (contact?.companyDomain) return contact.companyDomain;
  if (contact?.email) return contact.email.split('@')[1];

  const profile = await db.clientProfile.findUnique({
    where: { userId },
    select: { companyUrl: true },
  });
  if (profile?.companyUrl) return domainFromUrl(profile.companyUrl);

  const source = await db.jobSource.findFirst({
    where: { job: { clientId: userId } },
    select: { url: true, applyUrl: true },
  });
  return domainFromUrl(source?.applyUrl) ?? domainFromUrl(source?.url);
}

export interface DiscoveryOutcome {
  email: string | null;
  status: RecruiterEmailStatus | null;
  contactable: boolean;
}

/**
 * Discover + verify the best contact for one recruiter shell, and persist it.
 * Never revives a suppressed/unsubscribed contact.
 */
export async function discoverForUser(userId: string): Promise<DiscoveryOutcome> {
  const existing = await db.recruiterContact.findUnique({ where: { userId } });
  if (existing?.suppressedAt || existing?.unsubscribedAt) {
    return { email: existing.email, status: 'SUPPRESSED', contactable: false };
  }

  // 1. A published address always wins — verify and finalize it.
  if (existing && (existing.origin === 'PUBLISHED' || existing.origin === 'ATS_REPLY')) {
    const v = await verifyAddress(existing.email);
    const s = score(existing.origin, existing.confidence || 0.9, v);
    await db.recruiterContact.update({
      where: { userId },
      data: { ...s, verifiedAt: new Date() },
    });
    // FZ-02: no login-email promotion. The scraped address is contact data
    // only — it never becomes the shell's account identity.
    return { email: existing.email, status: s.status, contactable: s.contactable };
  }

  // 2. Otherwise guess role boxes on the resolved domain (if policy allows).
  if (env.RECRUITER_OUTREACH_POLICY === 'published_only') {
    return { email: existing?.email ?? null, status: existing?.status ?? null, contactable: false };
  }

  const domain = await resolveDomain(userId);
  if (!domain) return { email: null, status: null, contactable: false };

  let best: { cand: AddressCandidate; scored: Scored } | null = null;
  for (const cand of roleBoxCandidates(domain)) {
    const v = await verifyAddress(cand.email);
    const scored = score(cand.origin, cand.baseConfidence, v);
    if (!best || scored.confidence > best.scored.confidence) best = { cand, scored };
    // A deliverable, non-catch-all hit is as good as it gets — stop probing.
    if (scored.status === 'DELIVERABLE') break;
  }
  if (!best) return { email: null, status: null, contactable: false };

  const { cand, scored } = best;
  await db.recruiterContact.upsert({
    where: { userId },
    create: {
      userId,
      email: cand.email,
      companyDomain: domain,
      origin: cand.origin,
      patternUsed: cand.patternUsed,
      ...scored,
      verifiedAt: new Date(),
    },
    update: {
      email: cand.email,
      companyDomain: domain,
      origin: cand.origin,
      patternUsed: cand.patternUsed,
      ...scored,
      verifiedAt: new Date(),
    },
  });
  return { email: cand.email, status: scored.status, contactable: scored.contactable };
}

/**
 * Run discovery for UNCLAIMED shells that haven't been resolved yet (no contact,
 * or a contact that was never verified). Batched so a cron tick stays bounded.
 */
export async function discoverPending(limit = 50): Promise<{ processed: number }> {
  const users = await db.user.findMany({
    where: {
      status: 'UNCLAIMED',
      OR: [{ recruiterContact: { is: null } }, { recruiterContact: { verifiedAt: null } }],
    },
    select: { id: true },
    take: limit,
  });
  for (const u of users) await discoverForUser(u.id);
  return { processed: users.length };
}
