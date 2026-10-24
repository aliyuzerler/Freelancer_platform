'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { ArrowRight, PartyPopper, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Stepper } from '@/components/stepper';
import { ResendVerificationButton } from '@/components/resend-verification-button';
import { PayoutMethods } from '@/app/[locale]/settings/payments/payout-methods';
import { useMessageResolver } from '@/i18n/msg';
import { Link, useRouter } from '@/i18n/navigation';
import type { OnboardingStep } from '@/lib/onboarding';

type Props = {
  steps: OnboardingStep[];
  currentIndex: number;
  complete: boolean;
  isFreelancer: boolean;
  email: string;
  initialHeadline: string;
  initialHourlyRate: number | null;
  initialLocation: string;
  payout: {
    provider: 'STRIPE_CONNECT' | 'PAYPAL' | 'WISE' | 'MANUAL' | 'CRYPTO_USDC' | null;
    detail: string | null;
    holderName: string | null;
  };
};

/**
 * The required onboarding wizard. The current step always derives from
 * server state (router.refresh() re-computes it after every action), so the
 * flow resumes exactly where the user left off — even across sessions.
 */
export function OnboardingWizard(props: Props) {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const { steps, currentIndex, complete } = props;

  // Everything self-serve is done; only the admin review remains (or all done).
  const onlyApprovalLeft = currentIndex === steps.length - 1;
  const current = currentIndex >= 0 ? steps[currentIndex] : null;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">
          {complete ? t('allSet') : t('wizardTitle')}
        </CardTitle>
        <Stepper
          steps={steps.map((s) => ({ label: t(`steps.${s.id}`), done: s.done }))}
          currentIndex={currentIndex}
        />
      </CardHeader>
      <CardContent>
        {complete ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <PartyPopper className="size-10 text-primary" />
            <p className="text-muted-foreground">{t('completeBody')}</p>
            <Button asChild className="mt-2">
              <Link href="/dashboard">
                {t('goToDashboard')} <ArrowRight />
              </Link>
            </Button>
          </div>
        ) : onlyApprovalLeft ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Clock className="size-10 text-amber-600" />
            <p className="font-medium">{t('reviewQueueTitle')}</p>
            <p className="max-w-sm text-sm text-muted-foreground">{t('reviewQueueBody')}</p>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" onClick={() => router.refresh()}>
                {t('checkStatus')}
              </Button>
              <Button asChild variant="ghost">
                <Link href="/">{t('browseMeanwhile')}</Link>
              </Button>
            </div>
          </div>
        ) : current?.id === 'email' ? (
          <EmailStep email={props.email} />
        ) : current?.id === 'photo' ? (
          <PhotoStep />
        ) : current?.id === 'profile' ? (
          <ProfileStep
            headline={props.initialHeadline}
            hourlyRate={props.initialHourlyRate}
            location={props.initialLocation}
          />
        ) : current?.id === 'payout' ? (
          <PayoutStep payout={props.payout} />
        ) : null}
      </CardContent>
    </Card>
  );
}

/* --------------------------------- steps --------------------------------- */

function EmailStep({ email }: { email: string }) {
  const t = useTranslations('onboarding.email');
  const router = useRouter();
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <p className="font-medium">{t('title')}</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        {t.rich('body', { email, strong: (chunks) => <span className="font-medium">{chunks}</span> })}
      </p>
      <p className="text-sm text-muted-foreground">
        {t('notReceived')} <ResendVerificationButton />
      </p>
      <Button onClick={() => router.refresh()} className="mt-2">
        {t('continue')} <ArrowRight />
      </Button>
    </div>
  );
}

function PhotoStep() {
  const t = useTranslations('onboarding.photo');
  const m = useMessageResolver();
  const router = useRouter();
  const { update } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload() {
    if (!file) {
      setError(t('chooseFirst'));
      return;
    }
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/account/avatar', { method: 'POST', body: form });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(m(body?.error?.message, t('uploadFailed')));
      return;
    }
    // Re-sync the JWT session so the new photo shows in the navbar immediately.
    await update();
    router.refresh();
  }

  return (
    <div className="grid gap-4 py-2">
      <div>
        <p className="font-medium">{t('title')}</p>
        <p className="text-sm text-muted-foreground">{t('body')}</p>
      </div>
      <div className="flex items-center gap-4">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={t('previewAlt')} className="size-16 rounded-full object-cover" />
        ) : null}
        <Input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="cursor-pointer"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            setError(null);
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button onClick={upload} disabled={busy} className="w-fit">
        {busy ? t('uploading') : t('uploadAndContinue')} <ArrowRight />
      </Button>
    </div>
  );
}

function ProfileStep({
  headline,
  hourlyRate,
  location,
}: {
  headline: string;
  hourlyRate: number | null;
  location: string;
}) {
  const t = useTranslations('onboarding.profile');
  const m = useMessageResolver();
  const router = useRouter();
  const [headlineInput, setHeadlineInput] = useState(headline);
  const [locationInput, setLocationInput] = useState(location);
  const [rateInput, setRateInput] = useState(hourlyRate != null ? String(hourlyRate / 100) : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    const res = await fetch('/api/account/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        headline: headlineInput.trim(),
        location: locationInput.trim(),
        bio: '',
        hourlyRate: rateInput.trim() ? Math.round(Number(rateInput)) : undefined,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const flat = body?.error?.details?.fieldErrors as Record<string, string[]> | undefined;
      const first = flat ? Object.values(flat)[0]?.[0] : undefined;
      setError(m(first, m(body?.error?.message, t('couldNotSave'))));
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-4 py-2">
      <div>
        <p className="font-medium">{t('title')}</p>
        <p className="text-sm text-muted-foreground">{t('body')}</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="headline">{t('headline')}</Label>
        <Input
          id="headline"
          value={headlineInput}
          onChange={(e) => setHeadlineInput(e.target.value)}
          placeholder={t('headlinePlaceholder')}
          maxLength={120}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="location">{t('location')}</Label>
        <Input
          id="location"
          value={locationInput}
          onChange={(e) => setLocationInput(e.target.value)}
          placeholder={t('locationPlaceholder')}
          maxLength={120}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="rate">{t('rate')}</Label>
        <Input
          id="rate"
          inputMode="numeric"
          value={rateInput}
          onChange={(e) => setRateInput(e.target.value)}
          placeholder="85"
          className="w-32"
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button onClick={save} disabled={busy || headlineInput.trim().length < 10 || locationInput.trim().length < 2} className="w-fit">
        {busy ? t('saving') : t('saveAndContinue')} <ArrowRight />
      </Button>
    </div>
  );
}

function PayoutStep({ payout }: { payout: Props['payout'] }) {
  const t = useTranslations('onboarding.payout');
  const router = useRouter();
  return (
    <div className="grid gap-4 py-2">
      <div>
        <p className="font-medium">{t('title')}</p>
        <p className="text-sm text-muted-foreground">{t('body')}</p>
      </div>
      <PayoutMethods
        initialProvider={payout.provider}
        initialDetail={payout.detail}
        initialHolderName={payout.holderName}
        isFreelancer={false}
      />
      <Button onClick={() => router.refresh()} className="w-fit">
        {t('continue')} <ArrowRight />
      </Button>
    </div>
  );
}
