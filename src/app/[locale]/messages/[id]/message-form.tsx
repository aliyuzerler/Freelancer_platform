'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';
import { useMessageResolver } from '@/i18n/msg';

/** Reply box on a conversation thread. */
export function MessageForm({ conversationId }: { conversationId: string }) {
  const t = useTranslations('inbox.form');
  const m = useMessageResolver();
  const router = useRouter();
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError(null);

    const res = await fetch(`/api/messages/${conversationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    setBusy(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(m(data?.error?.message, t('couldNotSend')));
      return;
    }
    setBody('');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder={t('placeholder')}
        className="w-full rounded-md border bg-background p-3 text-sm"
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={busy || !body.trim()}>
        <Send /> {busy ? t('sending') : t('send')}
      </Button>
    </form>
  );
}
