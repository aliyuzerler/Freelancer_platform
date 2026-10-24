'use client';

import { useTranslations } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import {
  Zap, LayoutDashboard, Wallet, Settings, LogOut, Plus, ShieldCheck, MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { NotificationsBell } from '@/components/notifications-bell';
import { MessagesLink } from '@/components/messages-link';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { Logo } from '@/components/logo';
import { Link } from '@/i18n/navigation';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

// Marketing nav for signed-out visitors.
const GUEST_NAV = [
  { href: '/jobs', key: 'findWork' },
  { href: '/#how', key: 'howItWorks' },
  { href: '/#pricing', key: 'pricing' },
] as const;

// Freelancer-side (also agency roles): they browse and apply to work.
const FREELANCER_NAV = [
  { href: '/jobs', key: 'findWork' },
  { href: '/dashboard', key: 'dashboard' },
] as const;

// Client-side: they hire and manage their postings.
const CLIENT_NAV = [
  { href: '/jobs/new', key: 'postJob' },
  { href: '/dashboard', key: 'dashboard' },
] as const;

const FREELANCER_ROLES = ['FREELANCER', 'AGENCY_OWNER', 'AGENCY_MEMBER'];

/** Two-letter initials from a name or email, for the avatar fallback. */
function initials(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0]![0]! + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return (email?.[0] ?? 'U').toUpperCase();
}

/** Premium top nav — role-aware, with an avatar account menu when signed in. */
export function SiteHeader() {
  const t = useTranslations('nav');
  const { data: session, status } = useSession();

  const user = session?.user;
  const isAuthed = status === 'authenticated' && !!user;
  const isFreelancer = isAuthed && FREELANCER_ROLES.includes(user!.role);
  const nav = !isAuthed ? GUEST_NAV : isFreelancer ? FREELANCER_NAV : CLIENT_NAV;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" aria-label="Freelancezero home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-foreground">
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <LocaleSwitcher />
          {isAuthed ? <MessagesLink /> : null}
          {isAuthed ? <NotificationsBell /> : null}

          {isAuthed ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="ml-1 rounded-full outline-none ring-ring transition-shadow focus-visible:ring-2 focus-visible:ring-offset-2"
                aria-label="Account menu"
              >
                <Avatar>
                  {user!.image ? <AvatarImage src={user!.image} alt="" /> : null}
                  <AvatarFallback>{initials(user!.name, user!.email)}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="flex flex-col">
                  <span className="truncate">{user!.name ?? t('yourAccount')}</span>
                  <span className="truncate text-xs font-normal text-muted-foreground">
                    {user!.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard /> {t('dashboard')}
                  </Link>
                </DropdownMenuItem>
                {isFreelancer ? (
                  <DropdownMenuItem asChild>
                    <Link href="/jobs">
                      <Zap /> {t('findWork')}
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/jobs/new">
                      <Plus /> {t('postJob')}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/messages">
                    <MessageSquare /> {t('messages')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/payments">
                    <Wallet /> {isFreelancer ? t('getPaid') : t('billing')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings /> {t('settings')}
                  </Link>
                </DropdownMenuItem>
                {user!.role === 'ADMIN' ? (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/approvals">
                      <ShieldCheck /> {t('approvals')}
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => signOut({ callbackUrl: '/' })}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut /> {t('logOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">{t('logIn')}</Link>
              </Button>
              <Button asChild size="sm" className="shadow-sm">
                <Link href="/register">{t('startEarning')}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
