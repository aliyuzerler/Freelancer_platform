'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { BadgeCheck, ShieldQuestion, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMessageResolver } from '@/i18n/msg';

type Status = 'UNVERIFIED' | 'PENDING' | 'PROCESSING' | 'VERIFIED' | 'FAILED';

const ICONS: Record<Status, typeof BadgeCheck> = {
  UNVERIFIED: ShieldQuestion,
  PENDING: Clock,
  PROCESSING: Clock,
  VERIFIED: BadgeCheck,
  FAILED: XCircle,
};

export function IdentityCard({ status, enabled }: { status: Status; enabled: boolean }) {
  const t = useTranslations('settings.security.identity');
  const m = useMessageResolver();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const Icon = ICONS[status];

  async function start() {
    setBusy(true);
    setError(null);
    const res = await fetch('/api/account/identity', { method: 'POST' });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(m(body?.error?.message, t('couldNotStart')));
      return;
    }
    const { data } = await res.json();
    // Hosted provider flow — includes the QR hand-off to a phone camera.
    window.location.href = data.url;
  }

  const canStart = enabled && status !== 'VERIFIED' && status !== 'PROCESSING';

  return (
    <div>
      <div className="flex items-start gap-3">
        <Icon
          className={`mt-0.5 size-5 shrink-0 ${
            status === 'VERIFIED'
              ? 'text-primary'
              : status === 'FAILED'
                ? 'text-destructive'
                : 'text-muted-foreground'
          }`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{t('identityLabel')}</span>
            <Badge variant={status === 'VERIFIED' ? 'secondary' : 'outline'}>{t(`status.${status}`)}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t(`desc.${status}`)}</p>
        </div>
      </div>

      {!enabled ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {t.rich('disabledNote', {
            code: (chunks) => <code className="rounded bg-muted px-1">{chunks}</code>,
          })}
        </p>
      ) : null}

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      {canStart ? (
        <Button size="sm" className="mt-3" onClick={start} disabled={busy}>
          {busy ? t('starting') : status === 'FAILED' ? t('tryAgain') : t('start')}
        </Button>
      ) : null}

      <p className="mt-3 text-xs text-muted-foreground">{t('privacyNote')}</p>
    </div>
  );
}
