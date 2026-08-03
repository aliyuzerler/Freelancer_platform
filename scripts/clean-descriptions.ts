/**
 * Backfill for scraped postings ingested before the cleanup pipeline existed:
 *  - repairs UTF-8-as-Latin-1 mojibake ("Â·", "â€™") in titles and company names
 *  - unwraps stored HTML into readable text
 *  - strips board boilerplate and email addresses from descriptions
 *  - rewrites slugs that still carry the source name (…-remoteok-123)
 *
 *   npx tsx scripts/clean-descriptions.ts
 */
import { db } from '@/lib/db';
import { cleanDescription, fixMojibake } from '@/lib/scrapers/types';
import { slugify } from '@/lib/utils';

async function main() {
  const jobs = await db.job.findMany({
    where: { source: { isNot: null } },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      source: { select: { externalId: true, source: true } },
    },
  });

  let descriptions = 0;
  let titles = 0;
  let slugs = 0;

  for (const job of jobs) {
    const data: { title?: string; description?: string; slug?: string } = {};

    const title = fixMojibake(job.title);
    if (title !== job.title) {
      data.title = title;
      titles++;
    }

    const description = cleanDescription(job.description);
    if (description && description !== job.description) {
      data.description = description;
      descriptions++;
    }

    // Drop the board name from the public URL.
    const source = job.source?.source.toLowerCase();
    if (source && job.slug.includes(`-${source}-`)) {
      let next = `${slugify(title)}-${job.source!.externalId}`.slice(0, 120);
      const clash = await db.job.findUnique({ where: { slug: next }, select: { id: true } });
      if (clash && clash.id !== job.id) next = `${next}-${source}`.slice(0, 120);
      data.slug = next;
      slugs++;
    }

    if (Object.keys(data).length) {
      await db.job.update({ where: { id: job.id }, data });
    }
  }

  // Company shell names carry the same mojibake.
  const shells = await db.user.findMany({
    where: { status: 'UNCLAIMED' },
    select: { id: true, name: true, clientProfile: { select: { companyName: true } } },
  });
  let companies = 0;
  for (const shell of shells) {
    const name = shell.name ? fixMojibake(shell.name) : null;
    const companyName = shell.clientProfile?.companyName
      ? fixMojibake(shell.clientProfile.companyName)
      : null;
    if (name && name !== shell.name) {
      await db.user.update({ where: { id: shell.id }, data: { name } });
      companies++;
    }
    if (companyName && companyName !== shell.clientProfile?.companyName) {
      await db.clientProfile.update({ where: { userId: shell.id }, data: { companyName } });
    }
  }

  console.log(
    `Scanned ${jobs.length} postings — cleaned ${descriptions} descriptions, ` +
      `${titles} titles, ${slugs} slugs, ${companies} company names.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
