import { NextResponse, type NextRequest } from 'next/server';

/**
 * Send signed-in users straight to their dashboard instead of the marketing
 * home page. Deliberately a lightweight cookie-presence check (not full token
 * verification) so it stays edge-safe and adds no latency: worst case, a stale
 * cookie forwards to /dashboard, which then bounces to /login.
 *
 * Only `/` is matched, so the static marketing page is untouched for crawlers
 * and logged-out visitors.
 */
const SESSION_COOKIE_PREFIXES = ['authjs.session-token', '__Secure-authjs.session-token'];

export function middleware(req: NextRequest) {
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

export const config = { matcher: '/' };
