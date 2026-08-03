'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BIO_MIN, BIO_MAX } from '@/lib/validations/profile';

type Availability = 'OPEN_TO_WORK' | 'OPEN_TO_OFFERS' | 'NOT_AVAILABLE';

export type ProfileInitial = {
  name: string;
  nameLocked: boolean;
  headline: string;
  bio: string;
  hourlyRate: number | null; // minor units
  location: string;
  timezone: string;
  yearsExperience: number | null;
  availability: Availability;
  hoursPerWeek: number | null;
  websiteUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  dribbbleUrl: string;
  behanceUrl: string;
  stackoverflowUrl: string;
  xUrl: string;
};

const LINKS: { name: keyof ProfileInitial; label: string; placeholder: string }[] = [
  { name: 'websiteUrl', label: 'Website', placeholder: 'https://yoursite.com' },
  { name: 'linkedinUrl', label: 'LinkedIn', placeholder: 'linkedin.com/in/you' },
  { name: 'githubUrl', label: 'GitHub', placeholder: 'github.com/you' },
  { name: 'stackoverflowUrl', label: 'Stack Overflow', placeholder: 'stackoverflow.com/users/…' },
  { name: 'dribbbleUrl', label: 'Dribbble', placeholder: 'dribbble.com/you' },
  { name: 'behanceUrl', label: 'Behance', placeholder: 'behance.net/you' },
  { name: 'xUrl', label: 'X / Twitter', placeholder: 'x.com/you' },
];

export function ProfileForm({ initial }: { initial: ProfileInitial }) {
  const router = useRouter();
  const { update } = useSession();
  const [availability, setAvailability] = useState<Availability>(initial.availability);
  const [bio, setBio] = useState(initial.bio);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const bioTooShort = bio.trim().length > 0 && bio.trim().length < BIO_MIN;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFieldError(null);
    setSaved(false);
    const form = new FormData(e.currentTarget);

    const num = (key: string) => {
      const n = parseInt(String(form.get(key) ?? ''), 10);
      return Number.isFinite(n) && n > 0 ? n : undefined;
    };
    const text = (key: string) => String(form.get(key) ?? '').trim();

    const payload: Record<string, unknown> = {
      headline: text('headline'),
      bio: bio.trim(),
      location: text('location'),
      timezone: text('timezone'),
      availability,
      yearsExperience: num('yearsExperience'),
      hourlyRate: num('hourlyRate'),
      hoursPerWeek: num('hoursPerWeek'),
    };
    for (const link of LINKS) payload[link.name] = text(link.name);

    // Name only travels when it is still editable.
    if (!initial.nameLocked) {
      const name = text('name');
      const prefRes = await fetch('/api/account/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!prefRes.ok) {
        const b = await prefRes.json().catch(() => null);
        setBusy(false);
        setError(b?.error?.message ?? 'Could not save your name');
        return;
      }
    }

    const res = await fetch('/api/account/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setBusy(false);

    if (!res.ok) {
      const b = await res.json().catch(() => null);
      // Zod field errors are far more useful than a generic message.
      const flat = b?.error?.details?.fieldErrors as Record<string, string[]> | undefined;
      const first = flat ? Object.entries(flat)[0] : undefined;
      setFieldError(first ? `${first[0]}: ${first[1]?.[0]}` : null);
      setError(first ? null : (b?.error?.message ?? 'Could not save. Check the fields.'));
      return;
    }
    setSaved(true);
    await update();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <section className="grid gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Basics
        </h3>

        <div className="grid gap-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={initial.name}
            maxLength={120}
            required
            disabled={initial.nameLocked}
            className={initial.nameLocked ? 'cursor-not-allowed opacity-70' : undefined}
          />
          {initial.nameLocked ? (
            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="size-3" /> Locked after approval — contact support to correct it.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              This locks once your account is approved, so get it right now.
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="headline">Headline</Label>
          <Input
            id="headline"
            name="headline"
            defaultValue={initial.headline}
            placeholder="Senior Full-Stack Engineer · React & Node"
            maxLength={120}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            name="bio"
            rows={7}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={BIO_MAX}
            placeholder="What you do, who you do it for, and the results you get. Concrete outcomes beat adjectives."
            className="w-full rounded-md border bg-background p-3 text-sm"
          />
          <p
            className={`text-xs ${bioTooShort ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            {bio.trim().length}/{BIO_MAX}
            {bioTooShort ? ` — at least ${BIO_MIN} characters` : ` (minimum ${BIO_MIN})`}
          </p>
        </div>
      </section>

      <section className="grid gap-4 border-t pt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Availability &amp; rate
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="location">
              Location <span className="text-destructive">*</span>
            </Label>
            <Input
              id="location"
              name="location"
              defaultValue={initial.location}
              placeholder="Amsterdam, Netherlands"
              maxLength={120}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              name="timezone"
              defaultValue={initial.timezone}
              placeholder="CET (UTC+1)"
              maxLength={60}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="hourlyRate">Hourly rate (USD)</Label>
            <Input
              id="hourlyRate"
              name="hourlyRate"
              type="number"
              min="1"
              defaultValue={initial.hourlyRate ? Math.round(initial.hourlyRate / 100) : ''}
              placeholder="85"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hoursPerWeek">Hours / week</Label>
            <Input
              id="hoursPerWeek"
              name="hoursPerWeek"
              type="number"
              min="1"
              max="168"
              defaultValue={initial.hoursPerWeek ?? ''}
              placeholder="30"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="yearsExperience">Years experience</Label>
            <Input
              id="yearsExperience"
              name="yearsExperience"
              type="number"
              min="0"
              max="60"
              defaultValue={initial.yearsExperience ?? ''}
              placeholder="8"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="availability">Availability</Label>
          <select
            id="availability"
            value={availability}
            onChange={(e) => setAvailability(e.target.value as Availability)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="OPEN_TO_WORK">Open to work</option>
            <option value="OPEN_TO_OFFERS">Open to offers</option>
            <option value="NOT_AVAILABLE">Not available</option>
          </select>
        </div>
      </section>

      <section className="grid gap-4 border-t pt-6">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Professional links
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Each field only accepts URLs from that site.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {LINKS.map((link) => (
            <div key={link.name} className="grid gap-2">
              <Label htmlFor={link.name}>{link.label}</Label>
              <Input
                id={link.name}
                name={link.name}
                defaultValue={String(initial[link.name] ?? '')}
                placeholder={link.placeholder}
              />
            </div>
          ))}
        </div>
      </section>

      {fieldError ? <p className="text-sm text-destructive">{fieldError}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex items-center gap-3 border-t pt-6">
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save profile'}
        </Button>
        {saved ? <span className="text-sm text-green-600">Saved ✓</span> : null}
      </div>
    </form>
  );
}
