'use client';

import { useState } from 'react';
import { BadgeCheck, ShieldQuestion, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Status = 'UNVERIFIED' | 'PENDING' | 'PROCESSING' | 'VERIFIED' | 'FAILED';

const COPY: Record<Status, { label: string; desc: string; Icon: typeof BadgeCheck }> = {
  UNVERIFIED: {
    label: 'Not verified',
    desc: 'Verify your identity to earn a badge on your public profile. Clients hire verified freelancers more readily.',
    Icon: ShieldQuestion,
  },
  PENDING: {
    label: 'In progress',
    desc: 'Finish the checks in the window that opened. You can scan the QR code to continue on your phone.',
    Icon: Clock,
  },
  PROCESSING: {
    label: 'Under review',
    desc: 'Your documents are being reviewed. This usually takes a few minutes — we will email you.',
    Icon: Clock,
  },
  VERIFIED: {
    label: 'Verified',
    desc: 'Your identity is confirmed and a verified badge shows on your public profile.',
    Icon: BadgeCheck,
  },
  FAILED: {
    label: 'Could not verify',
    desc: 'We could not verify your identity from the documents provided. You can try again.',
    Icon: XCircle,
  },
};

export function IdentityCard({ status, enabled }: { status: Status; enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { label, desc, Icon } = COPY[status];

  async function start() {
    setBusy(true);
    setError(null);
    const res = await fetch('/api/account/identity', { method: 'POST' });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? 'Could not start verification');
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
            <span className="font-medium">Identity</span>
            <Badge variant={status === 'VERIFIED' ? 'secondary' : 'outline'}>{label}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>

      {!enabled ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Identity verification is not enabled on this instance. Set{' '}
          <code className="rounded bg-muted px-1">IDENTITY_DRIVER</code> to switch it on.
        </p>
      ) : null}

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      {canStart ? (
        <Button size="sm" className="mt-3" onClick={start} disabled={busy}>
          {busy ? 'Starting…' : status === 'FAILED' ? 'Try again' : 'Verify my identity'}
        </Button>
      ) : null}

      <p className="mt-3 text-xs text-muted-foreground">
        Checks are handled by our verification partner. Freelancezero never receives or stores your
        document images or ID numbers — only the result.
      </p>
    </div>
  );
}
