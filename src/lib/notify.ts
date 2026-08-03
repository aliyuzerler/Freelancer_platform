import type { NotificationType } from '@prisma/client';
import { db } from '@/lib/db';
import { deliverNotification } from '@/lib/mail/worker';
import { getRealtime } from '@/lib/adapters/realtime';

/**
 * Create an in-app notification and email it immediately.
 *
 * The email is awaited but never allowed to fail the caller: a mail outage must
 * not roll back a proposal or a message. Anything that does not send inline is
 * retried by the scheduled fan-out (see mail/worker.ts), because `emailedAt`
 * stays null on failure.
 */
export async function notifyUser(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  href?: string | null;
}): Promise<void> {
  const notification = await db.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body ?? null,
      href: params.href ?? null,
    },
    select: { id: true },
  });

  try {
    await deliverNotification(notification.id);
  } catch (err) {
    console.error('[notify] inline delivery failed', notification.id, err);
  }

  // No-op under the polling driver; a push driver delivers this instantly.
  await getRealtime()
    .publish(`user:${params.userId}`, 'notification')
    .catch((err) => console.error('[notify] publish failed', err));
}
