'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from '@/i18n/navigation';
import { useMessageResolver } from '@/i18n/msg';

type BudgetType = 'FIXED' | 'HOURLY';
type Experience = 'ENTRY' | 'INTERMEDIATE' | 'EXPERT';

const toMinor = (major: string): number | undefined => {
  const n = parseFloat(major);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : undefined;
};

/** Client-side post-a-job form. Amounts are entered in major units. */
export function JobForm() {
  const t = useTranslations('jobs.new.form');
  const m = useMessageResolver();
  const router = useRouter();
  const [budgetType, setBudgetType] = useState<BudgetType>('FIXED');
  const [experience, setExperience] = useState<Experience>('INTERMEDIATE');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);

    const min = toMinor(String(form.get('budgetMin') ?? ''));
    const max = toMinor(String(form.get('budgetMax') ?? ''));
    const days = parseInt(String(form.get('estimatedDays') ?? ''), 10);

    const payload = {
      title: String(form.get('title') ?? '').trim(),
      description: String(form.get('description') ?? '').trim(),
      budgetType,
      // For fixed price a single amount is fine; mirror it into both bounds.
      budgetMin: budgetType === 'FIXED' ? (max ?? min) : min,
      budgetMax: budgetType === 'FIXED' ? (max ?? min) : max,
      experience,
      estimatedDays: Number.isFinite(days) && days > 0 ? days : undefined,
      skillIds: [] as string[],
    };

    setLoading(true);
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(m(data?.error?.message, t('couldNotPost')));
      return;
    }
    const { data } = await res.json();
    router.push(`/jobs/${data.slug}/proposals`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="title">{t('title')}</Label>
        <Input id="title" name="title" required minLength={8} maxLength={120}
          placeholder={t('titlePlaceholder')} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">{t('description')}</Label>
        <textarea
          id="description" name="description" required minLength={40} rows={8}
          placeholder={t('descriptionPlaceholder')}
          className="w-full rounded-md border bg-background p-3 text-sm"
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="budgetType">{t('budgetType')}</Label>
          <select
            id="budgetType" value={budgetType}
            onChange={(e) => setBudgetType(e.target.value as BudgetType)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="FIXED">{t('budgetFixed')}</option>
            <option value="HOURLY">{t('budgetHourly')}</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="experience">{t('experience')}</Label>
          <select
            id="experience" value={experience}
            onChange={(e) => setExperience(e.target.value as Experience)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="ENTRY">{t('expEntry')}</option>
            <option value="INTERMEDIATE">{t('expIntermediate')}</option>
            <option value="EXPERT">{t('expExpert')}</option>
          </select>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {budgetType === 'FIXED' ? (
          <div className="grid gap-2">
            <Label htmlFor="budgetMax">{t('fixedPrice')}</Label>
            <Input id="budgetMax" name="budgetMax" type="number" min="1" step="1" placeholder="5000" />
          </div>
        ) : (
          <>
            <div className="grid gap-2">
              <Label htmlFor="budgetMin">{t('minRate')}</Label>
              <Input id="budgetMin" name="budgetMin" type="number" min="1" step="1" placeholder="40" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budgetMax">{t('maxRate')}</Label>
              <Input id="budgetMax" name="budgetMax" type="number" min="1" step="1" placeholder="80" />
            </div>
          </>
        )}
        <div className="grid gap-2">
          <Label htmlFor="estimatedDays">{t('estimatedDays')}</Label>
          <Input id="estimatedDays" name="estimatedDays" type="number" min="1" step="1" placeholder="30" />
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div>
        <Button type="submit" disabled={loading}>
          {loading ? t('posting') : t('postJob')}
        </Button>
      </div>
    </form>
  );
}
