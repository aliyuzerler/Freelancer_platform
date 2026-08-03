import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { initials, displayName } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PollRefresh } from '@/components/poll-refresh';
import { getRealtime } from '@/lib/adapters/realtime';
import { MessageForm } from './message-form';

export const metadata = { title: 'Messages' };
export const dynamic = 'force-dynamic';

const FREELANCER_ROLES = ['FREELANCER', 'AGENCY_OWNER', 'AGENCY_MEMBER'];

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) redirect(`/login?next=/messages/${id}`);
  const me = session.user.id;

  const conversation = await db.conversation.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      jobId: true,
      participants: {
        select: {
          userId: true,
          user: {
            select: {
              name: true,
              image: true,
              showFullName: true,
              role: true,
              clientProfile: { select: { companyName: true } },
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          body: true,
          createdAt: true,
          senderId: true,
        },
      },
    },
  });

  if (!conversation) notFound();
  // Only participants may read a thread.
  if (!conversation.participants.some((p) => p.userId === me)) notFound();

  // Opening the thread marks it read, which clears the navbar badge. Runs on
  // every poll too, so messages arriving while you watch don't re-flag it.
  await db.participant.updateMany({
    where: { conversationId: conversation.id, userId: me },
    data: { lastReadAt: new Date() },
  });

  /** Label a participant: company name for clients, privacy-aware name otherwise. */
  const labelFor = (userId: string): string => {
    const p = conversation.participants.find((x) => x.userId === userId);
    if (!p) return 'Unknown';
    if (userId === me) return 'You';
    const isFreelancer = FREELANCER_ROLES.includes(p.user.role);
    if (!isFreelancer) {
      return p.user.clientProfile?.companyName?.trim() || p.user.name?.trim() || 'Client';
    }
    return displayName(p.user.name, p.user.showFullName);
  };

  const other = conversation.participants.find((p) => p.userId !== me);
  const otherLabel = other ? labelFor(other.userId) : 'Conversation';
  const job = conversation.jobId
    ? await db.job.findUnique({
        where: { id: conversation.jobId },
        select: { title: true, slug: true },
      })
    : null;

  return (
    <div className="container max-w-3xl py-12">
      {/* Keeps incoming messages arriving without a manual reload. */}
      <PollRefresh intervalMs={getRealtime().poll.thread} />

      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link href="/messages">
          <ArrowLeft /> All messages
        </Link>
      </Button>

      <div className="flex items-center gap-3">
        <Avatar>
          {other?.user.image ? <AvatarImage src={other.user.image} alt="" /> : null}
          <AvatarFallback>{initials(otherLabel)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{otherLabel}</h1>
          {job ? (
            <Link
              href={`/jobs/${job.slug}`}
              className="text-sm text-muted-foreground hover:text-primary hover:underline"
            >
              {job.title}
            </Link>
          ) : conversation.title ? (
            <p className="text-sm text-muted-foreground">{conversation.title}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {conversation.messages.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No messages yet — say hello.
            </CardContent>
          </Card>
        ) : (
          conversation.messages.map((m) => {
            const mine = m.senderId === me;
            return (
              <div key={m.id} className={mine ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 ${
                    mine ? 'bg-primary text-primary-foreground' : 'border bg-card'
                  }`}
                >
                  <p className="mb-1 text-xs opacity-70">
                    {labelFor(m.senderId)} ·{' '}
                    {m.createdAt.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.body}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <MessageForm conversationId={conversation.id} />
    </div>
  );
}
