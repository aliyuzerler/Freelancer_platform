import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { ok, unauthorized, handle } from '@/lib/api';

/**
 * GET /api/messages/unread — how many messages the user has not seen.
 *
 * "Unread" = sent by someone else, after the last time this user opened that
 * conversation (Participant.lastReadAt). A conversation never opened counts
 * everything from the other side.
 */
export function GET() {
  return handle(async () => {
    const session = await auth();
    if (!session?.user) return unauthorized();
    const me = session.user.id;

    const participants = await db.participant.findMany({
      where: { userId: me },
      select: { conversationId: true, lastReadAt: true },
    });
    if (participants.length === 0) return ok({ unread: 0, conversations: 0 });

    // One query per conversation would be N round-trips; OR them into one.
    const unread = await db.message.count({
      where: {
        senderId: { not: me },
        OR: participants.map((p) => ({
          conversationId: p.conversationId,
          ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
        })),
      },
    });

    return ok({ unread, conversations: participants.length });
  });
}
