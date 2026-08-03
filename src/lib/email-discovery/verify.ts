/**
 * Deliverability checks. Two levels:
 *   1. MX — does the domain accept mail at all? Cheap, safe, always run.
 *   2. SMTP RCPT probe — does *this* mailbox exist, and is the domain catch-all?
 *      Off by default (EMAIL_VERIFY_SMTP): probing from the app IP hurts sending
 *      reputation, and ~40% of business domains are catch-all so the answer is
 *      often meaningless anyway. Enable only from a dedicated IP.
 */
import { resolveMx } from 'node:dns/promises';
import net from 'node:net';
import { env } from '@/lib/env';

export interface VerifyResult {
  mxOk: boolean;
  /** Only meaningful when an SMTP probe ran. */
  smtpDeliverable?: boolean;
  isCatchAll?: boolean;
}

async function mxHost(domain: string): Promise<string | null> {
  try {
    const records = await resolveMx(domain);
    if (!records.length) return null;
    records.sort((a, b) => a.priority - b.priority);
    return records[0]!.exchange;
  } catch {
    return null;
  }
}

/**
 * Speak just enough SMTP to a mailserver to see whether it accepts RCPT TO for
 * an address, without ever sending DATA (no mail is delivered). Returns null on
 * any inconclusive/greylisted/blocked outcome.
 */
function probeRcpt(host: string, address: string): Promise<boolean | null> {
  return new Promise((resolve) => {
    const socket = net.createConnection(25, host);
    let stage = 0;
    let settled = false;
    const done = (v: boolean | null) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(v);
    };

    socket.setTimeout(8000, () => done(null));
    socket.on('error', () => done(null));
    socket.on('data', (buf) => {
      const code = parseInt(buf.toString().slice(0, 3), 10);
      if (stage === 0) {
        if (code !== 220) return done(null);
        socket.write(`HELO freelancezero.com\r\n`);
        stage = 1;
      } else if (stage === 1) {
        socket.write(`MAIL FROM:<probe@freelancezero.com>\r\n`);
        stage = 2;
      } else if (stage === 2) {
        socket.write(`RCPT TO:<${address}>\r\n`);
        stage = 3;
      } else if (stage === 3) {
        socket.write('QUIT\r\n');
        if (code >= 200 && code < 300) return done(true);
        if (code >= 500 && code < 560) return done(false);
        return done(null); // greylist / rate-limit / ambiguous
      }
    });
  });
}

/** Verify a single address to the depth the environment allows. */
export async function verifyAddress(email: string): Promise<VerifyResult> {
  const domain = email.split('@')[1]!;
  const host = await mxHost(domain);
  if (!host) return { mxOk: false };
  if (!env.EMAIL_VERIFY_SMTP) return { mxOk: true };

  // Catch-all probe: does a random localpart also get accepted?
  const randomLocal = `no-such-user-${Date.now().toString(36)}`;
  const catchAll = await probeRcpt(host, `${randomLocal}@${domain}`);
  const real = await probeRcpt(host, email);

  return {
    mxOk: true,
    isCatchAll: catchAll === true,
    smtpDeliverable: catchAll === true ? undefined : real === true,
  };
}
