'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BIO_MIN, BIO_MAX } from '@/lib/validations/profile';
import { useRouter } from '@/i18n/navigation';
import { useMessageResolver } from '@/i18n/msg';

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

const LINKS: { name: keyof ProfileInitial; labelKey: string; placeholder: string }[] = [
  { name: 'websiteUrl', labelKey: 'website', placeholder: 'https://yoursite.com' },
  { name: 'linkedinUrl', labelKey: 'linkedin', placeholder: 'linkedin.com/in/you' },
  { name: 'githubUrl', labelKey: 'github', placeholder: 'github.com/you' },
  { name: 'stackoverflowUrl', labelKey: 'stackoverflow', placeholder: 'stackoverflow.com/users/…' },
  { name: 'dribbbleUrl', labelKey: 'dribbble', placeholder: 'dribbble.com/you' },
  { name: 'behanceUrl', labelKey: 'behance', placeholder: 'behance.net/you' },
  { name: 'xUrl', labelKey: 'x', placeholder: 'x.com/you' },
];

/** Field names the API's zod schema can report, mapped to label keys. */
const FIELD_KEYS = [
  'headline', 'bio', 'location', 'timezone', 'availability',
  'yearsExperience', 'hourlyRate', 'hoursPerWeek',
] as const;

function fieldLabelKey(field: string): string | null {
  return (FIELD_KEYS as readonly string[]).includes(field) ? `fields.${field}` : null;
}

export function ProfileForm({ initial }: { initial: ProfileInitial }) {
  const t = useTranslations('settings.profile');
  const m = useMessageResolver();
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
        setError(m(b?.error?.message, t('couldNotSaveName')));
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
      setFieldError(
        first
          ? `${first[0] && fieldLabelKey(first[0]) ? t(fieldLabelKey(first[0]) as never) : first[0]}: ${m(first[1]?.[0])}`
          : null,
      );
      setError(first ? null : m(b?.error?.message, t('couldNotSave')));
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
          {t('sectionBasics')}
        </h3>

        <div className="grid gap-2">
          <Label htmlFor="name">{t('fullName')}</Label>
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
              <Lock className="size-3" /> {t('nameLockedHint')}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">{t('nameLockNotice')}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="headline">{t('headline')}</Label>
          <Input
            id="headline"
            name="headline"
            defaultValue={initial.headline}
            placeholder={t('headlinePlaceholder')}
            maxLength={120}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="bio">{t('bio')}</Label>
          <textarea
            id="bio"
            name="bio"
            rows={7}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={BIO_MAX}
            placeholder={t('bioPlaceholder')}
            className="w-full rounded-md border bg-background p-3 text-sm"
          />
          <p
            className={`text-xs ${bioTooShort ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            {bio.trim().length}/{BIO_MAX}
            {bioTooShort ? t('bioTooShort', { min: BIO_MIN }) : t('bioMin', { min: BIO_MIN })}
          </p>
        </div>
      </section>

      <section className="grid gap-4 border-t pt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('sectionAvailability')}
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="location">
              {t('location')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="location"
              name="location"
              defaultValue={initial.location}
              placeholder={t('locationPlaceholder')}
              maxLength={120}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="timezone">{t('timezone')}</Label>
            <Input
              id="timezone"
              name="timezone"
              defaultValue={initial.timezone}
              placeholder={t('timezonePlaceholder')}
              maxLength={60}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="hourlyRate">{t('hourlyRate')}</Label>
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
            <Label htmlFor="hoursPerWeek">{t('hoursPerWeek')}</Label>
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
            <Label htmlFor="yearsExperience">{t('yearsExperience')}</Label>
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
          <Label htmlFor="availability">{t('availability')}</Label>
          <select
            id="availability"
            value={availability}
            onChange={(e) => setAvailability(e.target.value as Availability)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="OPEN_TO_WORK">{t('openToWork')}</option>
            <option value="OPEN_TO_OFFERS">{t('openToOffers')}</option>
            <option value="NOT_AVAILABLE">{t('notAvailable')}</option>
          </select>
        </div>
      </section>

      <section className="grid gap-4 border-t pt-6">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('sectionLinks')}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{t('linksHint')}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {LINKS.map((link) => (
            <div key={link.name} className="grid gap-2">
              <Label htmlFor={link.name}>{t(`link.${link.labelKey}` as never)}</Label>
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
          {busy ? t('saving') : t('saveProfile')}
        </Button>
        {saved ? <span className="text-sm text-green-600">{t('saved')}</span> : null}
      </div>
    </form>
  );
}
