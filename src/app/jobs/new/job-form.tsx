'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type BudgetType = 'FIXED' | 'HOURLY';
type Experience = 'ENTRY' | 'INTERMEDIATE' | 'EXPERT';

const toMinor = (major: string): number | undefined => {
  const n = parseFloat(major);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : undefined;
};

/** Client-side post-a-job form. Amounts are entered in major units. */
export function JobForm() {
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
      setError(data?.error?.message ?? 'Could not post the job. Check the fields and try again.');
      return;
    }
    const { data } = await res.json();
    router.push(`/jobs/${data.slug}/proposals`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required minLength={8} maxLength={120}
          placeholder="e.g. Senior React engineer for analytics dashboard" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description" name="description" required minLength={40} rows={8}
          placeholder="What needs doing, the stack, timeline, and what a great applicant looks like."
          className="w-full rounded-md border bg-background p-3 text-sm"
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="budgetType">Budget type</Label>
          <select
            id="budgetType" value={budgetType}
            onChange={(e) => setBudgetType(e.target.value as BudgetType)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="FIXED">Fixed price</option>
            <option value="HOURLY">Hourly</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="experience">Experience level</Label>
          <select
            id="experience" value={experience}
            onChange={(e) => setExperience(e.target.value as Experience)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="ENTRY">Entry</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="EXPERT">Expert</option>
          </select>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {budgetType === 'FIXED' ? (
          <div className="grid gap-2">
            <Label htmlFor="budgetMax">Fixed price (USD)</Label>
            <Input id="budgetMax" name="budgetMax" type="number" min="1" step="1" placeholder="5000" />
          </div>
        ) : (
          <>
            <div className="grid gap-2">
              <Label htmlFor="budgetMin">Min rate (USD/hr)</Label>
              <Input id="budgetMin" name="budgetMin" type="number" min="1" step="1" placeholder="40" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budgetMax">Max rate (USD/hr)</Label>
              <Input id="budgetMax" name="budgetMax" type="number" min="1" step="1" placeholder="80" />
            </div>
          </>
        )}
        <div className="grid gap-2">
          <Label htmlFor="estimatedDays">Estimated days (optional)</Label>
          <Input id="estimatedDays" name="estimatedDays" type="number" min="1" step="1" placeholder="30" />
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Posting…' : 'Post job'}
        </Button>
      </div>
    </form>
  );
}
