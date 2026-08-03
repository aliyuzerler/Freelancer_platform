/**
 * Magic-link tokens for account-less recruiters. A token grants scoped access
 * to one job's proposals via the /r/[token] portal; it is also what the
 * unsubscribe link carries.
 */
import { randomBytes } from 'node:crypto';
import { db } from '@/lib/db';
import { env } from '@/lib/env';

// Sign-in links live in inboxes, so the window is deliberately short.
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Mint (or reuse an unexpired) portal token for a recruiter + job. */
export async function mintRecruiterToken(userId: string, jobId: string): Promise<string> {
  const existing = await db.recruiterAccessToken.findFirst({
    where: { userId, jobId, expiresAt: { gt: new Date() } },
    select: { token: true },
  });
  if (existing) return existing.token;

  const token = randomBytes(24).toString('base64url');
  await db.recruiterAccessToken.create({
    data: { token, userId, jobId, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
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
    where: { token },
    select: { userId: true, jobId: true, expiresAt: true },
  });
  if (!row) return null;
  if (row.expiresAt && row.expiresAt < new Date()) return null;
  return { userId: row.userId, jobId: row.jobId };
}
