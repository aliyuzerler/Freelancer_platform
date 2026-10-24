/**
 * In-process sliding-window rate limiter (FZ-05).
 *
 * Previously NO endpoint was rate-limited, so credential stuffing, registration
 * spam, and email-flooding were all unmitigated. This module gives every
 * sensitive route a simple per-IP window without adding infrastructure.
 *
 * Scope note: state lives in this process's memory. A single Next.js instance
 * (the documented self-host deployment) is fully covered. Horizontal replicas
 * should swap the Map for a shared store (e.g. Redis) — the call sites only
 * depend on `rateLimit()`'s shape, so the swap stays local to this file.
 */

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

export interface LimitResult {
  allowed: boolean;
  /** Calls still available in the current window (0 when denied). */
  remaining: number;
  /** Seconds until the oldest hit expires and capacity frees up. */
  retryAfterSec: number;
}

/**
 * Record one hit for `key` and decide whether it fits the budget:
 * at most `max` hits inside any sliding `windowMs` window.
 */
export function rateLimit(key: string, max: number, windowMs: number): LimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= max) {
    buckets.set(key, bucket);
    const oldest = bucket.hits[0] ?? now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);

  // Opportunistic sweep so the map cannot grow without bound under spoofed-IP
  // pressure. Runs rarely (amortized) and prunes only fully-expired buckets.
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      if (!v.hits.some((t) => now - t < windowMs)) buckets.delete(k);
      if (buckets.size <= 5_000) break;
    }
  }

  return { allowed: true, remaining: max - bucket.hits.length, retryAfterSec: 0 };
}

/** Best-effort client IP: first hop of X-Forwarded-For, else X-Real-IP. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip') ?? 'unknown';
}
