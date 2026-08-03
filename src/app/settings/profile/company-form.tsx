'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
      setError(body?.error?.message ?? 'Could not save. Check the fields and try again.');
      return;
    }
    setSaved(true);
    await update();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" name="name" defaultValue={initial.name} maxLength={120} required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="companyName">Company name</Label>
        <Input
          id="companyName"
          name="companyName"
          defaultValue={initial.companyName}
          placeholder="Northwind Labs"
          maxLength={120}
        />
        <p className="text-xs text-muted-foreground">
          Shown to freelancers on your job postings and messages. Leave empty to use your own name.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="companyUrl">Company website</Label>
        <Input
          id="companyUrl"
          name="companyUrl"
          type="url"
          defaultValue={initial.companyUrl}
          placeholder="https://yourcompany.com"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          defaultValue={initial.location}
          placeholder="Amsterdam, Netherlands"
          maxLength={120}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="about">About</Label>
        <textarea
          id="about"
          name="about"
          rows={5}
          defaultValue={initial.about}
          placeholder="What your company does, and what you typically hire for."
          className="w-full rounded-md border bg-background p-3 text-sm"
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </Button>
        {saved ? <span className="text-sm text-green-600">Saved ✓</span> : null}
      </div>
    </form>
  );
}
