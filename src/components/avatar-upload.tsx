'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useMessageResolver } from '@/i18n/msg';
import { useSession } from 'next-auth/react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { initials } from '@/lib/utils';

/**
 * Profile photo with inline replace. After a successful upload the JWT session
 * is refreshed (`update()`) so the navbar avatar changes without a re-login.
 */
export function AvatarUpload({
  image,
  name,
  email,
}: {
  image: string | null;
  name: string | null;
  email: string | null;
}) {
  const t = useTranslations('settings.avatar');
  const m = useMessageResolver();
  const router = useRouter();
  const { update } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(file: File | null) {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setBusy(true);
    setError(null);

    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/account/avatar', { method: 'POST', body: form });
    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(m(body?.error?.message, t('uploadFailed')));
      setPreview(null);
      return;
    }
    await update();
    router.refresh();
  }

  const src = preview ?? image;

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16">
        {src ? <AvatarImage src={src} alt="" /> : null}
        <AvatarFallback className="text-lg">{initials(name, email)}</AvatarFallback>
      </Avatar>
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <Camera /> {busy ? t('uploading') : image ? t('changePhoto') : t('addPhoto')}
        </Button>
        <p className="mt-1 text-xs text-muted-foreground">{t('formatHint')}</p>
        {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
