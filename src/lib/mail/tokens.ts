/**
 * Magic-link tokens for account-less recruiters. A token grants scoped access
 * to one job's proposals via the /r/[token] portal; it is also what the
 * unsubscribe link carries.
 *
 * Only the SHA-256 digest of a token is stored (FZ-17): a database leak cannot
 * be replayed as working links, and server access logs — which see the raw
 * token in the URL path — cannot be used against the DB.
 */
import { randomBytes } from 'node:crypto';
import { db } from '@/lib/db';
import { env } from '@/lib/env';
import { hashToken } from '@/lib/auth';

// Sign-in links live in inboxes, so the window is deliberately short. The
// shorter window also bounds how long a multi-use token can circulate (FZ-20).
const TOKEN_TTL_MS = 72 * 60 * 60 * 1000;

/**
 * Mint a portal token for a recruiter + job. Because only digests are stored,
 * an existing token can never be re-derived — so each mint ROTATES: fresh
 * token, previous rows for the same recruiter+job are expired. Old links die
 * when a new notification goes out, which bounds how long any one link can
 * circulate (FZ-20).
 */
export async function mintRecruiterToken(userId: string, jobId: string): Promise<string> {
  await db.recruiterAccessToken.updateMany({
    where: { userId, jobId, expiresAt: { gt: new Date() } },
    data: { expiresAt: new Date() },
  });

  const token = randomBytes(24).toString('base64url');
  await db.recruiterAccessToken.create({
    data: { token: hashToken(token), userId, jobId, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
  });
  return token;
}

export const unsubscribeUrl = (token: string) =>
  `${env.NEXT_PUBLIC_APP_URL}/api/recruiter/unsubscribe?token=${token}`;

export interface ResolvedToken {
  userId: string;
  jobId: string | null;
}

/** Validate an unsubscribe token; returns null when missing/expired. */
export async function resolveRecruiterToken(token: string): Promise<ResolvedToken | null> {
  const row = await db.recruiterAccessToken.findUnique({
    where: { token: hashToken(token) },
    select: { userId: true, jobId: true, expiresAt: true },
  });
  if (!row) return null;
  if (row.expiresAt && row.expiresAt < new Date()) return null;
  return { userId: row.userId, jobId: row.jobId };
}
