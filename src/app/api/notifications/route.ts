import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { ok, unauthorized, handle } from '@/lib/api';

/**
 * GET /api/notifications — the signed-in user's most recent in-app
 * notifications plus the unread count, for the navbar bell panel.
 */
export function GET() {
  return handle(async () => {
    const session = await auth();
    if (!session?.user) return unauthorized();

    const [items, unread] = await Promise.all([
      db.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, title: true, body: true, href: true, readAt: true, createdAt: true },
      }),
      db.notification.count({ where: { userId: session.user.id, readAt: null } }),
    ]);

    return ok({ items, unread });
  });
}

/** POST /api/notifications — mark every notification as read (panel opened). */
export function POST() {
  return handle(async () => {
    const session = await auth();
    if (!session?.user) return unauthorized();

    await db.notification.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    });

    return ok({ read: true });
  });
}
