import { getTransport, MAIL_FROM } from './transport';

/**
 * Best-effort transactional email. Returns false (and logs the body) when no
 * SMTP transport is configured, so flows never hard-fail on missing mail —
 * crucial links are also logged for local development.
 */
export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  const transport = getTransport();
  if (!transport) {
    console.log(`[mail] (no transport) to=${to} subject="${subject}"\n${text}`);
    return false;
  }
  try {
    await transport.sendMail({
      to,
      from: MAIL_FROM,
      subject,
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
    // approval, registration). Log with the body so links stay recoverable.
    console.error(`[mail] send failed to=${to} subject="${subject}"`, err);
    console.log(`[mail] body:\n${text}`);
    return false;
  }
}
