/**
 * Stripe webhook signature verification (FZ-03).
 *
 * The identity webhook previously trusted any JSON body it received, so anyone
 * who could reach the endpoint could flip a user's identityStatus to VERIFIED
 * without ever completing a KYC flow. This module implements Stripe's
 * documented v1 signature scheme with zero new dependencies:
 *
 *   header:  t=<unix-seconds>,v1=<hex hmac>
 *   payload: "<t>.<raw request body>"
 *   secret:  STRIPE_WEBHOOK_SECRET (whsec_…)
 *
 * Verification is constant-time and rejects replays outside the tolerance
 * window. Kept as a pure function so it is trivially unit-testable.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

/** Default replay tolerance: Stripe recommends 5 minutes. */
const DEFAULT_TOLERANCE_SEC = 300;

export function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  toleranceSec: number = DEFAULT_TOLERANCE_SEC,
): boolean {
  if (!signatureHeader) return false;

  const parts: Record<string, string> = {};
  for (const pair of signatureHeader.split(',')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    parts[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
  }

  const timestamp = parts['t'];
  const provided = parts['v1'];
  if (!timestamp || !provided) return false;

  // Reject non-numeric or absurd timestamps instead of letting NaN through.
  const t = Number(timestamp);
  if (!Number.isFinite(t) || t <= 0) return false;
  if (Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;

  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(provided, 'utf8');
  // Length mismatch would throw inside timingSafeEqual — treat it as invalid.
  return a.length === b.length && timingSafeEqual(a, b);
}
