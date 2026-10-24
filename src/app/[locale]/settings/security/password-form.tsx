'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMessageResolver } from '@/i18n/msg';

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const t = useTranslations('settings.security.passwordForm');
  const m = useMessageResolver();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDone(false);
    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get('newPassword') ?? '');
    const confirm = String(form.get('confirmPassword') ?? '');

    if (newPassword !== confirm) {
      setError(t('mismatch'));
      return;
    }

    setBusy(true);
    const res = await fetch('/api/account/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(hasPassword ? { currentPassword: String(form.get('currentPassword') ?? '') } : {}),
        newPassword,
      }),
    });
    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const details = body?.error?.details?.fieldErrors?.newPassword?.[0];
      setError(m(details, m(body?.error?.message, t('couldNotUpdate'))));
      return;
    }
    setDone(true);
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {hasPassword ? (
        <div className="grid gap-2">
          <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t('noPasswordNotice')}</p>
      )}

      <div className="grid gap-2">
        <Label htmlFor="newPassword">{t('newPassword')}</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
        />
        <p className="text-xs text-muted-foreground">{t('requirements')}</p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">{t('confirmNewPassword')}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {done ? <p className="text-sm text-green-600">{t('updated')}</p> : null}

      <div>
        <Button type="submit" disabled={busy}>
          {busy ? t('saving') : hasPassword ? t('changePassword') : t('setPassword')}
        </Button>
      </div>
    </form>
  );
}
