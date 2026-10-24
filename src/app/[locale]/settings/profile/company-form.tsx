'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from '@/i18n/navigation';
import { useMessageResolver } from '@/i18n/msg';

/** Client-side identity: the name freelancers see on postings and messages. */
export function CompanyForm({
  initial,
}: {
  initial: {
    name: string;
    companyName: string;
    companyUrl: string;
    about: string;
    location: string;
  };
}) {
  const t = useTranslations('settings.company');
  const m = useMessageResolver();
  const router = useRouter();
  const { update } = useSession();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    const form = new FormData(e.currentTarget);

    const prefRes = await fetch('/api/account/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: String(form.get('name') ?? '').trim() }),
    });

    const res = await fetch('/api/account/company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: String(form.get('companyName') ?? '').trim(),
        companyUrl: String(form.get('companyUrl') ?? '').trim(),
        about: String(form.get('about') ?? '').trim(),
        location: String(form.get('location') ?? '').trim(),
      }),
    });
    setBusy(false);

    if (!res.ok || !prefRes.ok) {
      const body = await (res.ok ? prefRes : res).json().catch(() => null);
      setError(m(body?.error?.message, t('couldNotSave')));
      return;
    }
    setSaved(true);
    await update();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="name">{t('yourName')}</Label>
        <Input id="name" name="name" defaultValue={initial.name} maxLength={120} required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="companyName">{t('companyName')}</Label>
        <Input
          id="companyName"
          name="companyName"
          defaultValue={initial.companyName}
          placeholder={t('companyNamePlaceholder')}
          maxLength={120}
        />
        <p className="text-xs text-muted-foreground">{t('companyNameHint')}</p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="companyUrl">{t('companyUrl')}</Label>
        <Input
          id="companyUrl"
          name="companyUrl"
          type="url"
          defaultValue={initial.companyUrl}
          placeholder="https://yourcompany.com"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="location">{t('location')}</Label>
        <Input
          id="location"
          name="location"
          defaultValue={initial.location}
          placeholder={t('locationPlaceholder')}
          maxLength={120}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="about">{t('about')}</Label>
        <textarea
          id="about"
          name="about"
          rows={5}
          defaultValue={initial.about}
          placeholder={t('aboutPlaceholder')}
          className="w-full rounded-md border bg-background p-3 text-sm"
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? t('saving') : t('save')}
        </Button>
        {saved ? <span className="text-sm text-green-600">{t('saved')}</span> : null}
      </div>
    </form>
  );
}
