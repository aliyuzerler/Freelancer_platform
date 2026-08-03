import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Stepper } from '@/components/stepper';
import { ResendVerificationButton } from './resend-verification-button';
import type { OnboardingStep } from '@/lib/onboarding';

/**
 * Dashboard checklist mirroring the /onboarding wizard's progress. Stays
 * visible until the final step (admin approval) is done; steps are defined in
 * lib/onboarding.ts.
 */
export function OnboardingSteps({
  steps,
  currentIndex,
}: {
  steps: OnboardingStep[];
  currentIndex: number;
}) {
  if (currentIndex === -1) return null;

  const current = steps[currentIndex];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <Card className="mb-8">
      <CardContent className="py-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="font-medium">Finish setting up your account</p>
          <p className="text-sm text-muted-foreground">
            {doneCount} of {steps.length} complete
          </p>
        </div>

        <Stepper steps={steps} currentIndex={currentIndex} />

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {current?.id === 'email' ? (
            <>
              Check your inbox for the confirmation link. <ResendVerificationButton />
            </>
          ) : current?.id === 'approval' ? (
            'All your steps are done — an admin reviews your account next. Approval usually takes under a day.'
          ) : (
            <>
              Next up:{' '}
              <Link href="/onboarding" className="font-medium text-primary hover:underline">
                continue setup
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
