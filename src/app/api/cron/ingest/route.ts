import { env } from '@/lib/env';
import { ok, unauthorized, handle } from '@/lib/api';
import { runAllScrapers } from '@/lib/scrapers';
import { discoverPending } from '@/lib/email-discovery/discover';
import { fanOutNotifications } from '@/lib/mail/worker';

/**
 * POST /api/cron/ingest — the cold-start pipeline in one tick:
 *   1. scrape registered boards -> Jobs + UNCLAIMED shells
 *   2. discover + verify recruiter contacts (sets `contactable`)
 *   3. fan out pending notifications over email
 *
 * Guarded by CRON_SECRET (Authorization: Bearer …). Point a scheduler at it.
 */
function run(req: Request) {
  return handle(async () => {
    const auth = req.headers.get('authorization');
    if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) return unauthorized();

    const scraped = await runAllScrapers();
    const discovered = await discoverPending();
    const emailed = await fanOutNotifications();

    return ok({ scraped, discovered, emailed });
  });
}

// Vercel Cron invokes scheduled routes with GET (it attaches
// `Authorization: Bearer $CRON_SECRET` automatically when that env var is set).
// POST is kept so the pipeline can be triggered by hand or by other schedulers.
export const GET = run;
export const POST = run;

// Scraping several boards plus verification can outrun the default budget.
export const maxDuration = 300;
