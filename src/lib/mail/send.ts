import { getTransport, MAIL_FROM } from './transport';

/**
 * Best-effort transactional email.
 *
 * Security hardening packed into this module:
 * - FZ-11: subjects are stripped of CR/LF and control characters, so a job
 *   title or company name interpolated into a subject line can never inject
 *   additional SMTP headers.
 * - FZ-12: email bodies contain magic links and one-time tokens; they are
 *   logged only in development. In production a failure logs metadata, never
 *   the body.
 * - FZ-18: a per-recipient sliding-window cap prevents any code path (e.g.
 *   repeated registration attempts, a notification fan-out bug) from
 *   flooding one mailbox.
 */

/** Collapse subject lines to a single safe header line. */
export function sanitizeSubject(subject: string): string {
  // \r\n would split the header; other C0 controls have no business in a
  // subject either. Collapse whitespace runs for a tidy result.
  return subject.replace(/[\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim();
}

const RECIPIENT_MAX = 30;
const RECIPIENT_WINDOW_MS = 60 * 60 * 1000;
const sentTo = new Map<string, number[]>();

/** True when this recipient still has budget in the current hour window. */
function recipientBudgetOk(to: string): boolean {
  const now = Date.now();
  const hits = (sentTo.get(to) ?? []).filter((t) => now - t < RECIPIENT_WINDOW_MS);
  if (hits.length >= RECIPIENT_MAX) {
    sentTo.set(to, hits);
    return false;
  }
  hits.push(now);
  sentTo.set(to, hits);
  if (sentTo.size > 5_000) {
    for (const [k, v] of sentTo) {
      if (!v.some((t) => now - t < RECIPIENT_WINDOW_MS)) sentTo.delete(k);
      if (sentTo.size <= 2_500) break;
    }
  }
  return true;
}

/**
 * Best-effort send. Returns false (and logs) when no transport is configured,
 * so flows never hard-fail on missing mail — crucial links are additionally
 * logged for local development (dev only, never in production logs).
 */
export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  const transport = getTransport();
  if (!transport) {
    // FZ-12: bodies embed one-time links — keep them out of production logs.
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[mail] (no transport) to=${to} subject="${sanitizeSubject(subject)}"\n${text}`);
    } else {
      console.warn(`[mail] (no transport) dropped to=${to} subject="${sanitizeSubject(subject)}"`);
    }
    return false;
  }
  if (!recipientBudgetOk(to)) {
    console.warn(`[mail] recipient rate cap reached, dropped to=${to}`);
    return false;
  }
  try {
    await transport.sendMail({
      to,
      from: MAIL_FROM,
      subject: sanitizeSubject(subject),
      text,
      html: text
        .split('\n')
        .map((line) => {
          const m = line.match(/^(.*)\[(.+)\]\((https?:\/\/[^)]+)\)(.*)$/);
          return m ? `${m[1]}<a href="${m[3]}">${m[2]}</a>${m[4]}` : line;
        })
        .join('<br/>'),
    });
    return true;
  } catch (err) {
    // A mail outage must never fail the underlying action (payout change,
    // approval, registration). Metadata only in production (FZ-12).
    console.error(`[mail] send failed to=${to} subject="${sanitizeSubject(subject)}"`, err);
    return false;
  }
}
