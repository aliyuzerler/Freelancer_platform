'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
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
      setError('New passwords do not match');
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
      setError(details ?? body?.error?.message ?? 'Could not update your password');
      return;
    }
    setDone(true);
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {hasPassword ? (
        <div className="grid gap-2">
          <Label htmlFor="currentPassword">Current password</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Your account signs in with a magic link or social login. Set a password to also sign in
          with one.
        </p>
      )}

      <div className="grid gap-2">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
        />
        <p className="text-xs text-muted-foreground">
          At least 8 characters, with an uppercase letter, a lowercase letter, and a number.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {done ? <p className="text-sm text-green-600">Password updated ✓</p> : null}

      <div>
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : hasPassword ? 'Change password' : 'Set password'}
        </Button>
      </div>
    </form>
  );
}
