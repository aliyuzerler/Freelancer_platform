import { MessageSquare } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { initials, displayName } from '@/lib/utils';
import { intlTag } from '@/i18n/routing';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PollRefresh } from '@/components/poll-refresh';
import { getRealtime } from '@/lib/adapters/realtime';
import { pageMetadata } from '@/lib/seo';
import { Link, redirect } from '@/i18n/navigation';

export const dynamic = 'force-dynamic';

const FREELANCER_ROLES = ['FREELANCER', 'AGENCY_OWNER', 'AGENCY_MEMBER'];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'inbox.meta' });
  return pageMetadata({ title: t('title'), path: '/messages', locale, noIndex: true });
}

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'inbox' });

  const session = await auth();
  if (!session?.user) redirect({ href: '/login?next=/messages', locale });
  const me = session.user.id;

  const conversations = await db.conversation.findMany({
    where: { participants: { some: { userId: me } } },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    select: {
      id: true,
      title: true,
      updatedAt: true,
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
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { body: true, createdAt: true },
      },
    },
  });

  // Reduce to a render-safe shape (no legal names in the payload).
  const threads = conversations.map((c) => {
    const other = c.participants.find((p) => p.userId !== me);
    const label = !other
      ? t('conversationFallback')
      : FREELANCER_ROLES.includes(other.user.role)
        ? displayName(other.user.name, other.user.showFullName)
        : other.user.clientProfile?.companyName?.trim() || other.user.name?.trim() || t('clientFallback');
    return {
      id: c.id,
      title: c.title,
      label,
      image: other?.user.image ?? null,
      avatarInitials: initials(label),
      preview: c.messages[0]?.body ?? null,
      at: c.messages[0]?.createdAt ?? c.updatedAt,
    };
  });

  return (
    <div className="container max-w-3xl py-12">
      {/* Inbox is glanced at, not stared at — the slower cadence is enough. */}
      <PollRefresh intervalMs={getRealtime().poll.notifications} />

      <div className="mb-8 flex items-center gap-3">
        <MessageSquare className="size-6 text-primary" />
        <h1 className="text-3xl font-bold">{t('title')}</h1>
      </div>

      {threads.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t('empty')}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {threads.map((th) => (
            <Link key={th.id} href={`/messages/${th.id}`} className="block">
              <Card className="transition-colors hover:border-primary">
                <CardContent className="flex items-center gap-3 py-4">
                  <Avatar>
                    {th.image ? <AvatarImage src={th.image} alt="" /> : null}
                    <AvatarFallback>{th.avatarInitials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate font-medium">{th.label}</p>
                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        {th.at.toLocaleDateString(intlTag(locale), { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    {th.title ? (
                      <p className="truncate text-xs text-muted-foreground">{th.title}</p>
                    ) : null}
                    {th.preview ? (
                      <p className="truncate text-sm text-muted-foreground">{th.preview}</p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
