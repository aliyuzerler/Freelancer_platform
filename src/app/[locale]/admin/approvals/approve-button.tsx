'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';

/** Approves one account, then refreshes the queue. */
export function ApproveButton({ userId }: { userId: string }) {
  const t = useTranslations('admin.approvals');
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <Button
      size="sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch('/api/admin/approvals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        router.refresh();
      }}
    >
      <Check /> {busy ? t('approving') : t('approve')}
    </Button>
  );
}
