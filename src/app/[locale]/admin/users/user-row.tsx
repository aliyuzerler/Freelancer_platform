'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { useRouter, Link } from '@/i18n/navigation';
import { useMessageResolver } from '@/i18n/msg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  initials: string;
  role: string;
  status: string;
  approved: boolean;
  companyName: string;
  headline: string;
  contactEmail: string;
  profileId: string | null;
  jobs: number;
  proposals: number;
};

export function UserRow({ user }: { user: AdminUser }) {
  const t = useTranslations('admin.users');
  const m = useMessageResolver();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isShell = user.status === 'UNCLAIMED';
  const isFreelancer = ['FREELANCER', 'AGENCY_OWNER', 'AGENCY_MEMBER'].includes(user.role);

  async function patch(payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    setSaved(false);
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, ...payload }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(m(body?.error?.message, t('couldNotSave')));
      return;
    }
    setSaved(true);
    router.refresh();
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await patch({
      name: String(form.get('name') ?? '').trim(),
      ...(isFreelancer
        ? { headline: String(form.get('headline') ?? '').trim() }
        : { companyName: String(form.get('companyName') ?? '').trim() }),
      ...(isShell ? { contactEmail: String(form.get('contactEmail') ?? '').trim() } : {}),
    });
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Avatar>
            {user.image ? <AvatarImage src={user.image} alt="" /> : null}
            <AvatarFallback>{user.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{t(`roles.${user.role}` as never)}</Badge>
              <Badge variant={user.status === 'ACTIVE' ? 'secondary' : 'outline'}>
                {t(`status.${user.status}` as never)}
              </Badge>
              {!user.approved && !isShell ? (
                <Badge variant="outline" className="border-amber-500/50 text-amber-600">
                  {t('unapproved')}
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 truncate font-medium">{user.name || t('noName')}</p>
            <p className="truncate text-sm text-muted-foreground">
              {user.email}
              {user.contactEmail && user.contactEmail !== user.email
                ? ` · ${t('contactPrefix')} ${user.contactEmail}`
                : ''}
              {user.jobs > 0 ? ` · ${t('postingsShort', { count: user.jobs })}` : ''}
              {user.proposals > 0 ? ` · ${t('proposalsShort', { count: user.proposals })}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!user.approved ? (
              <Button size="sm" disabled={busy} onClick={() => patch({ approved: true })}>
                {t('approve')}
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={() => setOpen(!open)}>
              <ChevronDown className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </Button>
          </div>
        </div>

        {open ? (
          <form onSubmit={onSave} className="mt-4 grid gap-3 border-t pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`n-${user.id}`}>{isFreelancer ? t('nameLabel') : t('contactNameLabel')}</Label>
                <Input id={`n-${user.id}`} name="name" defaultValue={user.name} maxLength={120} />
              </div>
              {isFreelancer ? (
                <div className="grid gap-2">
                  <Label htmlFor={`h-${user.id}`}>{t('headlineLabel')}</Label>
                  <Input
                    id={`h-${user.id}`}
                    name="headline"
                    defaultValue={user.headline}
                    maxLength={120}
                  />
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor={`co-${user.id}`}>{t('companyLabel')}</Label>
                  <Input
                    id={`co-${user.id}`}
                    name="companyName"
                    defaultValue={user.companyName}
                    maxLength={120}
                  />
                </div>
              )}
            </div>

            {isShell ? (
              <div className="grid gap-2">
                <Label htmlFor={`ce-${user.id}`}>Recruiter contact email</Label>
                <Input
                  id={`ce-${user.id}`}
                  name="contactEmail"
                  type="email"
                  defaultValue={user.contactEmail}
                  placeholder="jobs@company.com"
                />
                <p className="text-xs text-muted-foreground">
                  Where application notifications are sent. Setting this marks the company
                  contactable.
                </p>
              </div>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" size="sm" disabled={busy}>
                {busy ? t('saving') : t('save')}
              </Button>
              {saved ? <span className="text-sm text-green-600">{t('saved')}</span> : null}
              {user.profileId ? (
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/freelancers/${user.profileId}`}>{t('viewProfile')}</Link>
                </Button>
              ) : null}
              {user.status !== 'SUSPENDED' ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => patch({ status: 'SUSPENDED' })}
                >
                  Suspend
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => patch({ status: 'ACTIVE' })}
                >
                  Reinstate
                </Button>
              )}
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
