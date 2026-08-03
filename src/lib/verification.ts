import { randomBytes } from 'node:crypto';
import { db } from '@/lib/db';
import { sendMail } from '@/lib/mail/send';

const TTL_MS = 24 * 60 * 60 * 1000; // 24h

/** Create a one-time email-confirmation token and send it to the user. */
export async function sendVerificationEmail(user: { email: string; name: string | null }) {
  const token = randomBytes(32).toString('hex');
  await db.verificationToken.create({
    data: { identifier: user.email, token, expires: new Date(Date.now() + TTL_MS) },
  });

  const link = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${token}&email=${encodeURIComponent(user.email)}`;
  await sendMail(
    user.email,
    'Confirm your email — Freelancezero',
    `Hi ${user.name ?? 'there'},\n\n` +
      `Confirm your email address to finish setting up your account:\n[Confirm email](${link})\n\n` +
      `This link expires in 24 hours. If you didn't create an account, you can ignore this email.`,
  );
}
