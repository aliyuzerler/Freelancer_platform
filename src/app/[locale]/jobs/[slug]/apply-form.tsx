'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from '@/i18n/navigation';
import { useMessageResolver } from '@/i18n/msg';

const toMinor = (major: string): number | undefined => {
  const n = parseFloat(major);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : undefined;
};

/** Inline apply form shown to eligible freelancers on the job page. */
export function ApplyForm({
  jobId,
  defaultBidType,
}: {
  jobId: string;
  defaultBidType: 'FIXED' | 'HOURLY';
}) {
  const t = useTranslations('jobs.apply');
  const m = useMessageResolver();
  const router = useRouter();
  const [bidType, setBidType] = useState<'FIXED' | 'HOURLY'>(defaultBidType);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const bid = toMinor(String(form.get('bidAmount') ?? ''));
    const days = parseInt(String(form.get('estimatedDays') ?? ''), 10);

    if (!bid) {
      setError(t('enterBid'));
      return;
    }

    setLoading(true);
    const res = await fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId,
        coverLetter: String(form.get('coverLetter') ?? '').trim(),
        bidAmount: bid,
        bidType,
        estimatedDays: Number.isFinite(days) && days > 0 ? days : undefined,
        milestones: [],
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(m(data?.error?.message, t('couldNotSubmit')));
      return;
    }
    // The server page re-renders into the "you applied" state.
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="coverLetter">{t('coverLetter')}</Label>
        <textarea
          id="coverLetter" name="coverLetter" required minLength={40} rows={6}
          placeholder={t('coverLetterPlaceholder')}
          className="w-full rounded-md border bg-background p-3 text-sm"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="bidType">{t('bidType')}</Label>
          <select
            id="bidType" value={bidType}
            onChange={(e) => setBidType(e.target.value as 'FIXED' | 'HOURLY')}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="FIXED">{t('bidFixed')}</option>
            <option value="HOURLY">{t('bidHourly')}</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="bidAmount">{bidType === 'HOURLY' ? t('rateUsdHour') : t('bidUsd')}</Label>
          <Input id="bidAmount" name="bidAmount" type="number" min="1" step="1" required placeholder="60" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="estimatedDays">{t('daysOptional')}</Label>
          <Input id="estimatedDays" name="estimatedDays" type="number" min="1" step="1" placeholder="21" />
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div>
        <Button type="submit" disabled={loading}>
          {loading ? t('submitting') : t('submit')}
        </Button>
      </div>
    </form>
  );
}
