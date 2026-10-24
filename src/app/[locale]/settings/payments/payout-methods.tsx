'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRouter } from '@/i18n/navigation';
import { useMessageResolver } from '@/i18n/msg';

type Provider = 'STRIPE_CONNECT' | 'PAYPAL' | 'WISE' | 'MANUAL' | 'CRYPTO_USDC';

const METHODS: { provider: Provider; key: string }[] = [
  { provider: 'STRIPE_CONNECT', key: 'stripe' },
  { provider: 'PAYPAL', key: 'paypal' },
  { provider: 'WISE', key: 'wise' },
  { provider: 'MANUAL', key: 'manual' },
];

export function PayoutMethods({
  initialProvider,
  initialDetail,
  initialHolderName,
  isFreelancer,
}: {
  initialProvider: Provider | null;
  initialDetail: string | null;
  initialHolderName: string | null;
  isFreelancer: boolean;
}) {
  const t = useTranslations('settings.payoutMethods');
  const m = useMessageResolver();
  const router = useRouter();
  const [connected, setConnected] = useState<Provider | null>(initialProvider);
  const [detail, setDetail] = useState<string | null>(initialDetail);
  const [holderName, setHolderName] = useState<string | null>(initialHolderName);
  const [openFor, setOpenFor] = useState<Provider | null>(null);
  const [input, setInput] = useState('');
  const [holderInput, setHolderInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function notifyChanged() {
    // Let the global no-payout banner re-check immediately.
    window.dispatchEvent(new Event('payout:changed'));
    router.refresh();
  }

  async function connect(provider: Provider) {
    setBusy(true);
    setError(null);
    const res = await fetch('/api/account/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        detail: input.trim() || undefined,
        holderName: holderInput.trim() || undefined,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(m(body?.error?.message, t('couldNotSave')));
      return;
    }
    setConnected(provider);
    setDetail(input.trim() || null);
    setHolderName(holderInput.trim() || null);
    setOpenFor(null);
    setInput('');
    setHolderInput('');
    notifyChanged();
  }

  async function remove() {
    setBusy(true);
    const res = await fetch('/api/account/payout', { method: 'DELETE' });
    setBusy(false);
    if (res.ok) {
      setConnected(null);
      setDetail(null);
      notifyChanged();
    }
  }

  return (
    <div className="grid gap-3">
      {METHODS.map((method) => {
        const isConnected = connected === method.provider;
        return (
          <div key={method.provider} className="rounded-lg border p-3">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{t(`${method.key}.label`)}</p>
                  {isConnected ? (
                    <Badge variant="secondary" className="gap-1">
                      <Check className="size-3" /> {t('connected')}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {isConnected && detail
                    ? holderName
                      ? `${holderName} · ${detail}`
                      : detail
                    : t(`${method.key}.desc`)}
                </p>
              </div>
              {isConnected ? (
                <Button variant="outline" size="sm" onClick={remove} disabled={busy}>
                  {t('remove')}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    setOpenFor(openFor === method.provider ? null : method.provider);
                    setInput('');
                    setError(null);
                  }}
                  disabled={busy}
                >
                  {openFor === method.provider ? t('cancel') : t('connect')}
                </Button>
              )}
            </div>

            {openFor === method.provider ? (
              <div className="mt-3 grid gap-2">
                {method.provider === 'MANUAL' ? (
                  <Input
                    value={holderInput}
                    onChange={(e) => setHolderInput(e.target.value)}
                    placeholder={t('holderPlaceholder')}
                    autoComplete="name"
                  />
                ) : null}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t(`${method.key}.placeholder`)}
                    className="sm:flex-1"
                  />
                  <Button onClick={() => connect(method.provider)} disabled={busy}>
                    {busy ? t('saving') : t('save')}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <p className="text-sm text-muted-foreground">
        {isFreelancer ? t('freelancerNote') : t('clientNote')}
      </p>
    </div>
  );
}
