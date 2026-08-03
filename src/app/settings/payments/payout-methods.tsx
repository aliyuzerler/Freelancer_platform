'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type Provider = 'STRIPE_CONNECT' | 'PAYPAL' | 'WISE' | 'MANUAL' | 'CRYPTO_USDC';

const METHODS: { provider: Provider; label: string; desc: string; placeholder: string }[] = [
  { provider: 'STRIPE_CONNECT', label: 'Stripe Connect', desc: 'Instant payouts to your bank or debit card.', placeholder: 'Account email' },
  { provider: 'PAYPAL', label: 'PayPal', desc: 'Get paid to your PayPal balance worldwide.', placeholder: 'PayPal email' },
  { provider: 'WISE', label: 'Wise', desc: 'Low-cost multi-currency transfers.', placeholder: 'Wise email' },
  { provider: 'MANUAL', label: 'Bank transfer / invoice', desc: 'Arrange payment directly with the client.', placeholder: 'IBAN or note (optional)' },
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
      setError(body?.error?.message ?? 'Could not save. Try again.');
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
      {METHODS.map((m) => {
        const isConnected = connected === m.provider;
        return (
          <div key={m.provider} className="rounded-lg border p-3">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{m.label}</p>
                  {isConnected ? (
                    <Badge variant="secondary" className="gap-1">
                      <Check className="size-3" /> Connected
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {isConnected && detail
                    ? holderName
                      ? `${holderName} · ${detail}`
                      : detail
                    : m.desc}
                </p>
              </div>
              {isConnected ? (
                <Button variant="outline" size="sm" onClick={remove} disabled={busy}>
                  Remove
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    setOpenFor(openFor === m.provider ? null : m.provider);
                    setInput('');
                    setError(null);
                  }}
                  disabled={busy}
                >
                  {openFor === m.provider ? 'Cancel' : 'Connect'}
                </Button>
              )}
            </div>

            {openFor === m.provider ? (
              <div className="mt-3 grid gap-2">
                {m.provider === 'MANUAL' ? (
                  <Input
                    value={holderInput}
                    onChange={(e) => setHolderInput(e.target.value)}
                    placeholder="Account holder name (required)"
                    autoComplete="name"
                  />
                ) : null}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={m.placeholder}
                    className="sm:flex-1"
                  />
                  <Button onClick={() => connect(m.provider)} disabled={busy}>
                    {busy ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <p className="text-sm text-muted-foreground">
        {isFreelancer
          ? 'Your clients pay you directly through the method you choose. Freelancezero never holds your money or takes a cut.'
          : 'You pay talent directly through the method you choose. Freelancezero never holds funds or charges a platform fee.'}
      </p>
    </div>
  );
}
