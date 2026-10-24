'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';

/** Authenticated reply box on the job-owner's proposals page. */
export function ProposalReplyForm({ proposalId }: { proposalId: string }) {
  const t = useTranslations('jobs.reply');
  const router = useRouter();
  const [body, setBody] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setState('sending');
    const res = await fetch('/api/proposals/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalId, body }),
    });
    if (res.ok) {
      setBody('');
      setState('sent');
      router.refresh();
    } else {
      setState('error');
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t('placeholder')}
        rows={3}
        className="w-full rounded-md border bg-background p-2 text-sm"
      />
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={state === 'sending' || !body.trim()}>
          {state === 'sending' ? t('sending') : t('send')}
        </Button>
        {state === 'sent' ? <span className="text-sm text-green-600">{t('sent')}</span> : null}
        {state === 'error' ? (
          <span className="text-sm text-red-600">{t('error')}</span>
        ) : null}
      </div>
    </form>
  );
}
