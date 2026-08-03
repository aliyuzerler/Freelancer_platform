/**
 * Scraper adapter interface — the external-job counterpart to the payments /
 * storage adapters. Each public board (RemoteOK, We Work Remotely, Greenhouse,
 * Lever) implements `JobScraper` by fetching its listings and normalizing them
 * into `ScrapedJob`. Ingestion (see `ingest.ts`) is source-agnostic: it only
 * ever sees `ScrapedJob`, so adding a board is a single new file.
 *
 * Adapters do NOT touch the database and do NOT guess or verify emails — they
 * only report what the board actually publishes. Email discovery/verification
 * is a separate, deliberately-gated step.
 */
import type { JobSourceType } from '@prisma/client';

export interface ScrapedJob {
  /** The board's own stable id for this posting. Unique within a source. */
  externalId: string;
  source: JobSourceType;
  /** Canonical, human-viewable posting URL. */
  url: string;
  /** External apply link when the board provides one (often an ATS URL). */
  applyUrl?: string;

  title: string;
  /** Plain-ish text or HTML; ingestion stores it as the Job description. */
  description: string;
  companyName: string;
  /** Resolved company domain when derivable (e.g. from the apply URL host). */
  companyDomain?: string;
  /** Email found *in* the posting (mailto:/body). Highest-trust contact. */
  publishedEmail?: string;

  tags?: string[];
  /** Compensation in integer minor units (cents), when parseable. */
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  postedAt?: Date;
}

export interface JobScraper {
  readonly source: JobSourceType;
  /** Fetch and normalize the current batch of listings for this source. */
  fetch(): Promise<ScrapedJob[]>;
}

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
  mdash: '—', ndash: '–', hellip: '…', middot: '·', bull: '•',
};

/**
 * Repair UTF-8 that was decoded as Latin-1 somewhere upstream — the classic
 * "Â·", "â€™", "Ã©" mojibake. Round-tripping the bytes back through UTF-8
 * restores the original characters. Only applied when the tell-tale markers are
 * present, so correctly-encoded text is never touched.
 */
export function fixMojibake(input: string): string {
  if (!/[ÂÃâ][-¿]/.test(input)) return input;
  try {
    const repaired = Buffer.from(input, 'latin1').toString('utf8');
    // A failed round-trip yields replacement characters; keep the original then.
    return repaired.includes('�') ? input : repaired;
  } catch {
    return input;
  }
}

/**
 * Remove email addresses from posting text. We store the contact address
 * separately (RecruiterContact) and route applications through the platform, so
 * leaving addresses in the public description only feeds scrapers.
 */
export function stripEmails(input: string): string {
  return input
    .replace(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi, '')
    .replace(/\bmailto:\S+/gi, '');
}

/**
 * Strip board-specific tracking boilerplate. RemoteOK appends an anti-spam
 * instruction with a base64 tag; it is meaningless on our site and looks like
 * garbage to applicants.
 */
export function stripBoardBoilerplate(input: string): string {
  return input
    .replace(/\s*Please mention the word[\s\S]*$/i, '')
    .replace(/\s*#[A-Za-z0-9+/=]{16,}\s*/g, ' ')
    .replace(/\bRMT[A-Za-z0-9+/=]{8,}\b/g, '')
    .trim();
}

/**
 * Convert scraped posting HTML into readable plain text.
 *
 * Job boards return descriptions as HTML fragments. We store text (the UI
 * renders descriptions as plain text), so tags must be unwrapped rather than
 * escaped — otherwise the page shows literal `<strong>` markup. Block-level
 * tags become newlines and list items become bullets so structure survives.
 */
export function htmlToText(input: string | null | undefined): string {
  if (!input) return '';
  return (
    input
      // Drop anything whose contents should never be shown.
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
      // List items become bullets before generic tag removal.
      .replace(/<li[^>]*>/gi, '\n• ')
      // Block boundaries become line breaks.
      .replace(/<\/(p|div|h[1-6]|ul|ol|li|tr|section|article)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?(h[1-6]|p|div)[^>]*>/gi, '\n')
      // Everything else goes.
      .replace(/<[^>]+>/g, '')
      // Decode the entities that actually show up in postings.
      .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
      .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
      .replace(/&([a-z]+);/gi, (m, name: string) => ENTITIES[name.toLowerCase()] ?? m)
      // Tidy the whitespace the unwrapping leaves behind.
      .replace(/\r/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

/**
 * The full cleanup applied to every scraped description, in order: repair the
 * encoding first (so entities and tags are recognisable), unwrap the HTML, then
 * remove board boilerplate and any leftover email addresses.
 *
 * Both the scraper and the backfill script call this, so stored text can never
 * drift from what new ingests produce.
 */
export function cleanDescription(input: string | null | undefined): string {
  if (!input) return '';
  const text = htmlToText(fixMojibake(input));
  return stripEmails(stripBoardBoilerplate(text))
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** RFC 5322-ish email matcher — good enough to pull an address out of prose. */
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

/** Pull the first email address out of arbitrary text/HTML, if any. */
export function extractEmail(text: string | null | undefined): string | undefined {
  if (!text) return undefined;
  const mailto = text.match(/mailto:([^"'?\s>]+)/i);
  if (mailto?.[1]) return mailto[1].toLowerCase();
  const inline = text.match(EMAIL_RE);
  return inline ? inline[0].toLowerCase() : undefined;
}

/**
 * Job boards, aggregators and ATS hosts. A posting's apply URL usually points at
 * one of these rather than the employer, so treating it as the company domain
 * would generate addresses like `hr@remoteok.com` — mail aimed at the board
 * instead of the employer. Never guess against these.
 */
const NON_COMPANY_DOMAINS = new Set([
  'remoteok.com',
  'remoteok.io',
  'weworkremotely.com',
  'greenhouse.io',
  'boards.greenhouse.io',
  'lever.co',
  'jobs.lever.co',
  'workable.com',
  'breezy.hr',
  'bamboohr.com',
  'ashbyhq.com',
  'smartrecruiters.com',
  'recruitee.com',
  'teamtailor.com',
  'personio.de',
  'linkedin.com',
  'indeed.com',
  'glassdoor.com',
  'wellfound.com',
  'angel.co',
  'ziprecruiter.com',
  'monster.com',
  'dice.com',
  'google.com',
  'docs.google.com',
  'forms.gle',
  'notion.so',
  'airtable.com',
  'typeform.com',
]);

/** True when a hostname belongs to a board/ATS rather than an employer. */
export function isCompanyDomain(domain: string | null | undefined): boolean {
  if (!domain) return false;
  if (NON_COMPANY_DOMAINS.has(domain)) return false;
  // Also catch subdomains like `acme.breezy.hr` or `boards.greenhouse.io`.
  return ![...NON_COMPANY_DOMAINS].some((d) => domain.endsWith(`.${d}`));
}

/**
 * Best-effort registrable domain from a URL string. Returns undefined for job
 * boards and ATS hosts, so callers never mistake them for the employer.
 */
export function domainFromUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    return isCompanyDomain(host) ? host : undefined;
  } catch {
    return undefined;
  }
}
