import { rateLimit } from '@/lib/rate-limit';
import { sanitizeSubject } from '@/lib/mail/send';
import { verifyStripeSignature } from '@/lib/webhook-signature';
import { createHmac } from 'node:crypto';

describe('rateLimit (FZ-05)', () => {
  it('allows calls under the budget and denies the rest of the window', () => {
    const key = `test:${Math.random()}`;
    expect(rateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(rateLimit(key, 3, 60_000).allowed).toBe(true);
    const third = rateLimit(key, 3, 60_000);
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);
    const denied = rateLimit(key, 3, 60_000);
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSec).toBeGreaterThan(0);
  });

  it('isolates different keys', () => {
    expect(rateLimit('a:1', 1, 60_000).allowed).toBe(true);
    expect(rateLimit('a:2', 1, 60_000).allowed).toBe(true);
  });
});

describe('sanitizeSubject (FZ-11 header injection)', () => {
  it('strips CRLF injection attempts', () => {
    const out = sanitizeSubject('Job: Senior Dev\r\nBcc: victim@example.com');
    expect(out).not.toMatch(/[\r\n]/);
    expect(out).toBe('Job: Senior Dev Bcc: victim@example.com');
  });

  it('strips control characters and collapses whitespace', () => {
    expect(sanitizeSubject('a\u0000b\u0007c   d')).toBe('a b c d');
  });

  it('keeps a clean subject untouched', () => {
    expect(sanitizeSubject('Confirm your email — Freelancezero')).toBe(
      'Confirm your email — Freelancezero',
    );
  });
});

describe('verifyStripeSignature (FZ-03 webhook forgery)', () => {
  const secret = 'whsec_test_secret';
  const body = JSON.stringify({
    type: 'identity.verification_session.verified',
    data: { object: { id: 'vs_123' } },
  });

  function sign(payload: string, tsSeconds: number): string {
    const v1 = createHmac('sha256', secret).update(`${tsSeconds}.${payload}`).digest('hex');
    return `t=${tsSeconds},v1=${v1}`;
  }

  it('accepts a correctly signed, fresh payload', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(verifyStripeSignature(body, sign(body, now), secret)).toBe(true);
  });

  it('rejects a missing header or secret mismatch', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(verifyStripeSignature(body, null, secret)).toBe(false);
    expect(verifyStripeSignature(body, sign(body, now), 'whsec_other')).toBe(false);
  });

  it('rejects a body that was swapped after signing', () => {
    const now = Math.floor(Date.now() / 1000);
    const forged = body.replace('verified', 'requires_input');
    expect(verifyStripeSignature(forged, sign(body, now), secret)).toBe(false);
  });

  it('rejects replays outside the tolerance window', () => {
    const stale = Math.floor(Date.now() / 1000) - 3600;
    expect(verifyStripeSignature(body, sign(body, stale), secret)).toBe(false);
  });

  it('rejects malformed timestamps', () => {
    expect(verifyStripeSignature(body, 't=NaN,v1=deadbeef', secret)).toBe(false);
  });
});
