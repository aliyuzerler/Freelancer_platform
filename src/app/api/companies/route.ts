import { db } from '@/lib/db';
import { ok, handle } from '@/lib/api';

/**
 * GET /api/companies?q= — company typeahead for the client sign-up form.
 *
 * Searches companies that actually exist on the platform (client profiles,
 * which includes the shells created by job ingestion) rather than a fixture
 * table, so a real employer like "Zicasso" is suggested and seeded placeholders
 * never are.
 *
 * FZ-25: the endpoint stays public because the registration form needs it, so
 * the company list cannot be fully locked behind auth. Bulk enumeration is
 * mitigated instead: a 30 req/min per-IP limit in middleware, a 2-character
 * minimum query, and hard result caps (8 returned). Names of seeded fixture
 * companies are public marketing data anyway.
 */
export function GET(req: Request) {
  return handle(async () => {
    const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';
    if (q.length < 2) return ok({ items: [] });

    const rows = await db.clientProfile.findMany({
      where: {
        companyName: { contains: q, mode: 'insensitive' },
        user: { deletedAt: null },
      },
      select: { companyName: true },
      // Over-fetch: names repeat across shells, so we dedupe below.
      take: 60,
    });

    // Case-insensitive dedupe, keeping the first spelling seen.
    const seen = new Map<string, string>();
    for (const row of rows) {
      const name = row.companyName?.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (!seen.has(key)) seen.set(key, name);
    }

    const lowerQ = q.toLowerCase();
    const items = [...seen.values()]
      // Prefix matches first — "Zic" should surface "Zicasso" above "Bizicasso".
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(lowerQ) ? 0 : 1;
        const bStarts = b.toLowerCase().startsWith(lowerQ) ? 0 : 1;
        return aStarts - bStarts || a.localeCompare(b);
      })
      .slice(0, 8);

    return ok({ items });
  });
}
