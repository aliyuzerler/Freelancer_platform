'use client';

import { useTranslations, useLocale } from 'next-intl';
import { intlTag } from '@/i18n/routing';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { POLL } from '@/lib/adapters/realtime';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

type NotificationsResponse = { items: NotificationItem[]; unread: number };

/** Navbar bell with a dropdown of the user's recent activity. */
export function NotificationsBell() {
  const t = useTranslations('notifications');
  const resolveNotify = (title: string) => {
    try {
      return t(title.replace('notify.', '') as never);
    } catch {
      return title;
    }
  };
  const locale = useLocale();
  const localeTag = intlTag(locale);
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<NotificationsResponse> => {
      const res = await fetch('/api/notifications');
      if (!res.ok) return { items: [], unread: 0 };
      return (await res.json()).data;
    },
    // Polling stands in for push while the realtime driver is `none`.
    // React Query pauses this while the tab is hidden; refetchOnWindowFocus
    // (off globally) is re-enabled here so returning to the tab is instant.
    refetchInterval: POLL.notifications,
    refetchOnWindowFocus: true,
  });

  const unread = data?.unread ?? 0;

  // Opening the panel marks everything read; the badge clears optimistically.
  function handleOpen(open: boolean) {
    if (!open || unread === 0) return;
    queryClient.setQueryData<NotificationsResponse>(['notifications'], (old) =>
      old ? { ...old, unread: 0, items: old.items.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })) } : old,
    );
    void fetch('/api/notifications', { method: 'POST' });
  }

  return (
    <DropdownMenu onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('ariaLabel')} className="relative">
          <Bell />
          {unread > 0 ? (
            <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{t('title')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!data || data.items.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            {t('empty')}
          </p>
        ) : (
          data.items.map((n) => {
            const inner = (
              <div className="flex w-full items-start gap-2">
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${n.readAt ? 'bg-muted-foreground/30' : 'bg-primary'}`}
                />
                <div className="min-w-0">
                  <p className="whitespace-normal text-sm font-medium leading-snug">
                    {n.title.startsWith("notify.") ? resolveNotify(n.title) : n.title}
                  </p>
                  {n.body ? (
                    <p className="truncate text-xs text-muted-foreground">{n.body}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleDateString(localeTag, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            );
            return n.href ? (
              <DropdownMenuItem key={n.id} asChild>
                <Link href={n.href}>{inner}</Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem key={n.id}>{inner}</DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
