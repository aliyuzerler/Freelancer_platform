/**
 * Candidate address generation. We only ever *generate* here; verification and
 * the decision to actually contact happen elsewhere and are gated.
 *
 * Two tiers:
 *   - Role boxes (hr@, jobs@ ...): safe-ish, generic, no personal data.
 *   - Person patterns ({first}.{last}@ ...): only usable when we actually have a
 *     recruiter name AND ideally a known company pattern. Higher intrusiveness,
 *     so lower base confidence and never fired without a name.
 */
import type { RecruiterEmailOrigin } from '@prisma/client';

export interface AddressCandidate {
  email: string;
  origin: RecruiterEmailOrigin;
  patternUsed: string;
  /** Pre-verification base confidence (0..1). */
  baseConfidence: number;
}

/** Generic hiring inboxes, most-likely first. */
const ROLE_LOCALPARTS = ['jobs', 'careers', 'hr', 'recruiting', 'talent', 'hiring'];

export function roleBoxCandidates(domain: string): AddressCandidate[] {
  return ROLE_LOCALPARTS.map((local, i) => ({
    email: `${local}@${domain}`,
    origin: 'ROLE_GUESS' as const,
    patternUsed: `${local}@`,
    // Slight preference ordering; all role boxes are inherently low-signal.
    baseConfidence: 0.55 - i * 0.03,
  }));
}

/** Sanitize a name part into an email-safe localpart token. */
function tok(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z]/g, '');
}

/**
 * Person-pattern candidates. Requires a full name. If a `knownPattern` (learned
 * from a confirmed address at this company) is supplied, only that pattern is
 * produced, at high confidence.
 */
export function personCandidates(
  domain: string,
  fullName: string,
  knownPattern?: string,
): AddressCandidate[] {
  const parts = fullName.trim().split(/\s+/).map(tok).filter(Boolean);
  if (parts.length < 2) return [];
  const first = parts[0]!;
  const last = parts[parts.length - 1]!;

  const build = (pattern: string): string =>
    pattern
      .replace('{first}', first)
      .replace('{last}', last)
      .replace('{f}', first[0]!)
      .replace('{l}', last[0]!) + `@${domain}`;

  if (knownPattern) {
    return [
      {
        email: build(knownPattern),
        origin: 'PATTERN',
        patternUsed: knownPattern,
        baseConfidence: 0.8,
      },
    ];
  }

  const patterns = ['{first}.{last}', '{first}', '{f}{last}', '{first}{last}'];
  return patterns.map((pattern, i) => ({
    email: build(pattern),
    origin: 'PATTERN' as const,
    patternUsed: pattern,
    baseConfidence: 0.55 - i * 0.05,
  }));
}
