'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowRight, PartyPopper, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Stepper } from '@/components/stepper';
import { ResendVerificationButton } from '@/components/resend-verification-button';
import { PayoutMethods } from '@/app/settings/payments/payout-methods';
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
  const router = useRouter();
  const { steps, currentIndex, complete } = props;

  // Everything self-serve is done; only the admin review remains (or all done).
  const onlyApprovalLeft = currentIndex === steps.length - 1;
  const current = currentIndex >= 0 ? steps[currentIndex] : null;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">
          {complete ? "You're all set" : 'Finish setting up your account'}
        </CardTitle>
        <Stepper steps={steps} currentIndex={currentIndex} />
      </CardHeader>
      <CardContent>
        {complete ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <PartyPopper className="size-10 text-primary" />
            <p className="text-muted-foreground">
              Your account is fully set up and approved. Time to put it to work.
            </p>
            <Button asChild className="mt-2">
              <Link href="/dashboard">
                Go to dashboard <ArrowRight />
              </Link>
            </Button>
          </div>
        ) : onlyApprovalLeft ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Clock className="size-10 text-amber-600" />
            <p className="font-medium">You&apos;re in the review queue</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              That&apos;s everything on your side. An admin reviews your account next — approval
              usually takes under a day, and we&apos;ll email you the moment it lands.
            </p>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" onClick={() => router.refresh()}>
                Check status
              </Button>
              <Button asChild variant="ghost">
                <Link href="/">Browse the site meanwhile</Link>
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
  const router = useRouter();
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <p className="font-medium">Confirm your email</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        We sent a confirmation link to <span className="font-medium">{email}</span>. Click it, then
        continue here.
      </p>
      <p className="text-sm text-muted-foreground">
        Nothing in your inbox? <ResendVerificationButton />
      </p>
      <Button onClick={() => router.refresh()} className="mt-2">
        I&apos;ve confirmed — continue <ArrowRight />
      </Button>
    </div>
  );
}

function PhotoStep() {
  const router = useRouter();
  const { update } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload() {
    if (!file) {
      setError('Choose a photo first');
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
      setError(body?.error?.message ?? 'Upload failed — try another image');
      return;
    }
    // Re-sync the JWT session so the new photo shows in the navbar immediately.
    await update();
    router.refresh();
  }

  return (
    <div className="grid gap-4 py-2">
      <div>
        <p className="font-medium">Add a profile photo</p>
        <p className="text-sm text-muted-foreground">
          Clients and freelancers see this. PNG or JPG, up to 2 MB.
        </p>
      </div>
      <div className="flex items-center gap-4">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="size-16 rounded-full object-cover" />
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
        {busy ? 'Uploading…' : 'Upload and continue'} <ArrowRight />
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
      setError(first ?? body?.error?.message ?? 'Could not save. Try again.');
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-4 py-2">
      <div>
        <p className="font-medium">Your basics</p>
        <p className="text-sm text-muted-foreground">
          A headline that sells you, and where you work from — clients filter on both.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          value={headlineInput}
          onChange={(e) => setHeadlineInput(e.target.value)}
          placeholder="Senior Full-Stack Engineer"
          maxLength={120}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={locationInput}
          onChange={(e) => setLocationInput(e.target.value)}
          placeholder="Amsterdam, Netherlands"
          maxLength={120}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="rate">Hourly rate (USD, optional)</Label>
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
        {busy ? 'Saving…' : 'Save and continue'} <ArrowRight />
      </Button>
    </div>
  );
}

function PayoutStep({ payout }: { payout: Props['payout'] }) {
  const router = useRouter();
  return (
    <div className="grid gap-4 py-2">
      <div>
        <p className="font-medium">Add a payment method</p>
        <p className="text-sm text-muted-foreground">
          How you&apos;ll pay talent — directly, with zero platform fees.
        </p>
      </div>
      <PayoutMethods
        initialProvider={payout.provider}
        initialDetail={payout.detail}
        initialHolderName={payout.holderName}
        isFreelancer={false}
      />
      <Button onClick={() => router.refresh()} className="w-fit">
        Continue <ArrowRight />
      </Button>
    </div>
  );
}
