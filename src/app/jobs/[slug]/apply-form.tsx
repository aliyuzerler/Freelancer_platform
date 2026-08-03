'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
      setError('Enter your bid amount.');
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
      setError(data?.error?.message ?? 'Could not submit your proposal.');
      return;
    }
    // The server page re-renders into the "you applied" state.
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="coverLetter">Cover letter</Label>
        <textarea
          id="coverLetter" name="coverLetter" required minLength={40} rows={6}
          placeholder="Why you're a fit — relevant work, approach, and availability."
          className="w-full rounded-md border bg-background p-3 text-sm"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="bidType">Bid type</Label>
          <select
            id="bidType" value={bidType}
            onChange={(e) => setBidType(e.target.value as 'FIXED' | 'HOURLY')}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="FIXED">Fixed</option>
            <option value="HOURLY">Hourly</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="bidAmount">{bidType === 'HOURLY' ? 'Rate (USD/hr)' : 'Bid (USD)'}</Label>
          <Input id="bidAmount" name="bidAmount" type="number" min="1" step="1" required placeholder="60" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="estimatedDays">Days (optional)</Label>
          <Input id="estimatedDays" name="estimatedDays" type="number" min="1" step="1" placeholder="21" />
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit proposal'}
        </Button>
      </div>
    </form>
  );
}
