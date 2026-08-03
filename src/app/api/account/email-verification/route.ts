import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { ok, unauthorized, handle } from '@/lib/api';
import { sendVerificationEmail } from '@/lib/verification';

/** POST /api/account/email-verification — resend the confirmation email. */
export function POST() {
  return handle(async () => {
    const session = await auth();
    if (!session?.user?.email) return unauthorized();

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true, emailVerified: true },
    });
    if (!user) return unauthorized();
    if (user.emailVerified) return ok({ alreadyVerified: true });

    await sendVerificationEmail(user);
    return ok({ sent: true });
  });
}
