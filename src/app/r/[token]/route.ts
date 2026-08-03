import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth, signIn } from '@/lib/auth';
import { env } from '@/lib/env';

/**
 * GET /r/[token] — recruiter one-click sign-in from the "someone applied" email.
 *
 * This is a Route Handler rather than a page because establishing a session
 * writes a cookie, which Next.js only permits from a Route Handler or Server
 * Action — never during page render.
 *
 * Invalid or expired links fail safely: the visitor is sent to the normal login
 * page instead of being granted anything.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const row = await db.recruiterAccessToken.findUnique({
    where: { token },
    select: { userId: true, jobId: true, expiresAt: true },
  });

  // Where the link should land once signed in.
  let destination = '/dashboard';
  if (row?.jobId) {
    const job = await db.job.findUnique({
      where: { id: row.jobId },
      select: { slug: true },
    });
    if (job) destination = `/jobs/${job.slug}/proposals`;
  }

  const expired = !row || (row.expiresAt ? row.expiresAt < new Date() : false);
  if (expired) {
    const url = new URL('/login', env.NEXT_PUBLIC_APP_URL);
    url.searchParams.set('next', destination);
    url.searchParams.set('error', 'link_expired');
    return NextResponse.redirect(url);
  }

  // Already signed in as the right account — skip the sign-in entirely.
  const session = await auth();
  if (session?.user?.id === row!.userId) {
    return NextResponse.redirect(new URL(destination, env.NEXT_PUBLIC_APP_URL));
  }

  // Sets the session cookie, then throws a redirect that Next turns into the
  // response. Any failure falls through to the login page below.
  await signIn('recruiter-token', { token, redirectTo: destination });

  return NextResponse.redirect(new URL(destination, env.NEXT_PUBLIC_APP_URL));
}
