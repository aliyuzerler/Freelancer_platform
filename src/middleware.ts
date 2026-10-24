import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { routing } from '@/i18n/routing';

/**
 * Three edge-level responsibilities, in order:
 *
 * 1. Rate limiting (FZ-05) — every sensitive API surface gets a per-IP
 *    sliding-window budget before it reaches the app. POSTs to auth endpoints
 *    (credential stuffing), registration (spam), password changes (brute
 *    force after session theft) and write-heavy user endpoints are the
 *    buckets that matter. Limits are per-instance; multi-replica deployments
 *    should replace `rateLimit` with a shared store. API paths are handled
 *    here and skipped by i18n routing — responses are JSON error keys, and
 *    clients localize them.
 *
 * 2. UX redirect — signed-in users landing on the bare marketing root
 *    continue to their dashboard instead. Deliberately a lightweight
 *    cookie-presence check (not full token verification) so it stays
 *    edge-safe; worst case a stale cookie forwards to /dashboard, which
 *    bounces to the login page.
 *
 * 3. i18n routing (next-intl) — locale detection, cookie persistence,
 *    /{locale} prefix redirects and the X-NEXT-INTL-LOCALE header that
 *    server components rely on. Runs for every page route.
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

/** The middleware-observable locale roots, used for the signed-in bounce. */
const LOCALE_ROOTS = ['/', ...routing.locales.map((l) => `/${l}`)];

const intlMiddleware = createMiddleware(routing);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- 1. API rate limiting (no i18n processing on JSON endpoints) ---------
  if (pathname.startsWith('/api/')) {
    for (const rule of RULES) {
      if (!pathname.startsWith(rule.prefix)) continue;
      if (rule.methods && !rule.methods.includes(req.method)) continue;

      const result = rateLimit(`${clientIp(req)}:${rule.prefix}`, rule.max, rule.windowMs);
      if (!result.allowed) {
        return NextResponse.json(
          // Stable key; the client resolves it through the message catalogs.
          { error: { message: 'errors.rateLimited' } },
          { status: 429, headers: { 'Retry-After': String(result.retryAfterSec) } },
        );
      }
      // First matching rule wins — the most specific prefixes are listed first.
      break;
    }
    return NextResponse.next();
  }

  // --- 2. Signed-in visitors skip the marketing root ------------------------
  if (LOCALE_ROOTS.includes(pathname)) {
    const signedIn = req.cookies
      .getAll()
      .some((c) => SESSION_COOKIE_PREFIXES.some((p) => c.name.startsWith(p)));

    if (signedIn) {
      // Keep the visitor's language: explicit cookie, else the routed root
      // itself, else the default locale.
      const cookieLocale = req.cookies.get('NEXT_LOCALE')?.value;
      const locale =
        cookieLocale && routing.locales.includes(cookieLocale as never)
          ? cookieLocale
          : pathname !== '/'
            ? pathname.slice(1)
            : routing.defaultLocale;

      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/dashboard`;
      return NextResponse.redirect(url);
    }
  }

  // --- 3. Locale routing for everything else -------------------------------
  return intlMiddleware(req);
}

export const config = {
  matcher: [
    // API surfaces (rate limiting above).
    '/api/:path*',
    // All page routes, except locale-agnostic route handlers (uploads, the
    // /r email-link resolver), Next.js internals and static files.
    '/((?!api|uploads|r|_next|_vercel|.*\\..*).*)',
  ],
};
