import { db } from '@/lib/db';
import { resolveRecruiterToken } from '@/lib/mail/tokens';

/**
 * Recruiter one-click unsubscribe (List-Unsubscribe target). Suppresses the
 * contact so the fan-out worker will never email it again. Handles both the
 * one-click POST and a plain GET (someone clicking the link).
 */
async function suppress(token: string | null): Promise<boolean> {
  if (!token) return false;
  const resolved = await resolveRecruiterToken(token);
  if (!resolved) return false;
  await db.recruiterContact.updateMany({
    where: { userId: resolved.userId },
    data: { unsubscribedAt: new Date(), status: 'SUPPRESSED', contactable: false },
  });
  return true;
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token');
  const done = await suppress(token);
  const msg = done
    ? "You've been unsubscribed. You won't receive further emails about this posting."
    : 'This unsubscribe link is invalid or has expired.';
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>Unsubscribe</title>
     <div style="font-family:system-ui;max-width:480px;margin:80px auto;text-align:center">
       <p>${msg}</p>
     </div>`,
    { status: done ? 200 : 400, headers: { 'Content-Type': 'text/html' } },
  );
}

// RFC 8058 one-click unsubscribe (List-Unsubscribe-Post).
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get('token');
  const done = await suppress(token);
  return new Response(null, { status: done ? 200 : 400 });
}
