/**
 * Backfill: completenessScore was never computed (the column sat at its 0
 * default), which also zeroed the proposal quality score and freelancer
 * ranking. Recomputes every profile.
 *
 *   npx tsx scripts/recompute-completeness.ts
 */
import { db } from '@/lib/db';
import { recomputeCompleteness } from '@/lib/profile-completeness';

async function main() {
  const profiles = await db.freelancerProfile.findMany({ select: { userId: true } });
  let updated = 0;
  for (const p of profiles) {
    const score = await recomputeCompleteness(p.userId);
    if (score !== null) updated++;
  }
  console.log(`Recomputed completeness for ${updated} profiles.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
