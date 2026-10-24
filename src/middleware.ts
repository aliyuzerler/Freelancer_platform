import { NextResponse, type NextRequest } from 'next/server';
import { rateLimit, clientIp } from '@/lib/rate-limit';

/**
 * Two edge-level responsibilities:
 *
 * 1. UX redirect — signed-in users land on /dashboard instead of the marketing
 *    home page. Deliberately a lightweight cookie-presence check (not full
 *    token verification) so it stays edge-safe; worst case a stale cookie
 *    forwards to /dashboard, which bounces to /login.
 *
 * 2. Rate limiting (FZ-05) — every sensitive API surface gets a per-IP
 *    sliding-window budget before it reaches the app. POSTs to auth endpoints
 *    (credential stuffing), registration (spam), password changes (brute
 *    force after session theft) and write-heavy user endpoints are the
 *    buckets that matter. Limits are per-instance; multi-replica deployments
 *    should replace `rateLimit` with a shared store.
 */
const SESSION_COOKIE_PREFIXES = ['authjs.session-token', '__Secure-authjs.session-token'];

interface Rule {
  prefix: string;
  /** Match only these methods; undefined = all methods. */
  methods?: string[];
  max: number;
  windowMs: number;
}

const RULES: Rule[] = [
  // NextAuth endpoints: sign-in POSTs are the credential-stuffing surface.
  // GETs (session/csrf polling) get a generous budget so UX never breaks.
  { prefix: '/api/auth', methods: ['POST'], max: 10, windowMs: 60_000 },
  { prefix: '/api/auth', methods: ['GET'], max: 120, windowMs: 60_000 },
  { prefix: '/api/register', max: 5, windowMs: 60_000 },
  // Password change is the highest-value brute-force target after takeover.
  { prefix: '/api/account/password', methods: ['POST'], max: 5, windowMs: 300_000 },
  { prefix: '/api/account', max: 30, windowMs: 60_000 },
  { prefix: '/api/proposals', max: 20, windowMs: 60_000 },
  { prefix: '/api/messages', max: 60, windowMs: 60_000 },
  { prefix: '/api/admin', max: 120, windowMs: 60_000 },
  { prefix: '/api/companies', max: 30, windowMs: 60_000 },
  { prefix: '/api/jobs', methods: ['POST'], max: 10, windowMs: 60_000 },
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  for (const rule of RULES) {
    if (!pathname.startsWith(rule.prefix)) continue;
    if (rule.methods && !rule.methods.includes(req.method)) continue;

    const result = rateLimit(`${clientIp(req)}:${rule.prefix}`, rule.max, rule.windowMs);
    if (!result.allowed) {
      return NextResponse.json(
        { error: { message: 'Too many requests. Please slow down.' } },
        { status: 429, headers: { 'Retry-After': String(result.retryAfterSec) } },
      );
    }
    // First matching rule wins — the most specific prefixes are listed first.
    break;
  }

  if (pathname !== '/') return NextResponse.next();

  const signedIn = req.cookies
    .getAll()
    .some((c) => SESSION_COOKIE_PREFIXES.some((p) => c.name.startsWith(p)));

  if (signedIn) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/', '/api/:path*'] };
