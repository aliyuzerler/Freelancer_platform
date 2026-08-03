import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { ok, forbidden, handle } from '@/lib/api';
import { sendMail } from '@/lib/mail/send';

const schema = z.object({ userId: z.string().cuid() });

/**
 * POST /api/admin/approvals — approve an account (the final onboarding gate).
 * The user is notified in-app and by confirmation email.
 */
export function POST(req: Request) {
  return handle(async () => {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return forbidden();

    const { userId } = schema.parse(await req.json());
    const user = await db.user.update({
      where: { id: userId },
      data: { approvedAt: new Date() },
      select: { email: true, name: true, role: true },
    });

    const appliesTo = user.role === 'CLIENT' ? 'post jobs' : 'apply to jobs';
    await db.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title: 'Your account is approved',
        body: `You can now ${appliesTo}. Welcome aboard!`,
        href: '/dashboard',
      },
    });
    if (user.email) {
      await sendMail(
        user.email,
        'Your Freelancezero account is approved',
        `Hi ${user.name ?? 'there'},\n\n` +
          `Good news — your account has been reviewed and approved. You can now ${appliesTo}.\n\n` +
          `[Open your dashboard](${process.env.NEXT_PUBLIC_APP_URL}/dashboard)`,
      );
    }

    await db.auditLog.create({
      data: { userId: session.user.id, action: 'admin.approve', entity: 'User', entityId: userId },
    });

    return ok({ userId });
  });
}
