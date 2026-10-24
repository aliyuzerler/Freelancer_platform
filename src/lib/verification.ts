import { randomBytes } from 'node:crypto';
import { db } from '@/lib/db';
import { sendMail } from '@/lib/mail/send';
import { hashToken } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';

const TTL_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Create a one-time email-confirmation token and send it to the user.
 * Only the SHA-256 digest is stored (FZ-17): a database leak must not yield
 * working confirmation links. The /verify page hashes the incoming token the
 * same way before lookup. Note: this deliberately reuses the VerificationToken
 * table alongside Auth.js's own magic-link rows — our digests and its raw
 * tokens never mix because our code paths are the only ones that hash.
 */
export async function sendVerificationEmail(user: { email: string; name: string | null }) {
  const token = randomBytes(32).toString('hex');
  await db.verificationToken.create({
    data: { identifier: user.email, token: hashToken(token), expires: new Date(Date.now() + TTL_MS) },
  });

  const link = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${token}&email=${encodeURIComponent(user.email)}`;
  const t = await getTranslations({ locale: routing.defaultLocale, namespace: 'emails' });
  await sendMail(
    user.email,
    t('verify.subject'),
    `${t('verify.hi', { name: user.name ?? '' })}\n\n` +
      `${t('verify.body')}\n[${t('verify.button')}](${link})\n\n` +
      t('verify.expiry'),
  );
}
