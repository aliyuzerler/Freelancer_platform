/**
 * Scraper registry + orchestrator. Add a board by implementing `JobScraper`
 * (see `remoteok.ts`) and registering it here — nothing else changes.
 */
import type { JobSourceType } from '@prisma/client';
import type { JobScraper } from './types';
import { remoteOkScraper } from './remoteok';
import { runIngest, type IngestResult } from './ingest';

export const scrapers: Partial<Record<JobSourceType, JobScraper>> = {
  REMOTEOK: remoteOkScraper,
  // WEWORKREMOTELY: wwrScraper,
  // GREENHOUSE: greenhouseScraper,
  // LEVER: leverScraper,
};

export type { JobScraper, ScrapedJob } from './types';
export { runIngest, type IngestResult } from './ingest';

/** Run every registered scraper. Failures are isolated per source. */
export async function runAllScrapers(): Promise<Record<string, IngestResult | { error: string }>> {
  const out: Record<string, IngestResult | { error: string }> = {};
  for (const [source, scraper] of Object.entries(scrapers)) {
    if (!scraper) continue;
    try {
      out[source] = await runIngest(scraper);
    } catch (err) {
      out[source] = { error: err instanceof Error ? err.message : String(err) };
    }
  }
  return out;
}
