'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { POLL } from '@/lib/adapters/realtime';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

/** Navbar messages icon with an unread badge. Polls alongside the bell. */
export function MessagesLink() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const { data } = useQuery({
    queryKey: ['messages-unread'],
    queryFn: async (): Promise<{ unread: number }> => {
      const res = await fetch('/api/messages/unread');
      if (!res.ok) return { unread: 0 };
      return (await res.json()).data;
    },
    refetchInterval: POLL.notifications,
    refetchOnWindowFocus: true,
    // Reading a thread marks it read server-side; re-check on navigation so the
    // badge clears without waiting for the next poll.
    refetchOnMount: true,
  });

  // `key` on the query is stable, but the count should re-check as you move
  // between conversations.
  const unread = pathname?.startsWith('/messages/') ? 0 : (data?.unread ?? 0);

  return (
    <Button asChild variant="ghost" size="icon" aria-label={t('messages')} className="relative">
      <Link href="/messages">
        <MessageSquare />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
