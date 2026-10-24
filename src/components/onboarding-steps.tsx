'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Stepper } from '@/components/stepper';
import { ResendVerificationButton } from './resend-verification-button';
import { Link } from '@/i18n/navigation';
import type { OnboardingStep } from '@/lib/onboarding';

/**
 * Dashboard checklist mirroring the /onboarding wizard's progress. Stays
 * visible until the final step (admin approval) is done; steps are defined in
 * lib/onboarding.ts. Step `label`s are message keys, resolved here so the
 * checklist renders in the active locale.
 */
export function OnboardingSteps({
  steps,
  currentIndex,
}: {
  steps: OnboardingStep[];
  currentIndex: number;
}) {
  const t = useTranslations('onboarding');

  if (currentIndex === -1) return null;

  const current = steps[currentIndex];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <Card className="mb-8">
      <CardContent className="py-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="font-medium">{t('checklistTitle')}</p>
          <p className="text-sm text-muted-foreground">
            {t('checklistProgress', { done: doneCount, total: steps.length })}
          </p>
        </div>

        <Stepper
          steps={steps.map((s) => ({ label: t(`steps.${s.id}`), done: s.done }))}
          currentIndex={currentIndex}
        />

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {current?.id === 'email' ? (
            <>
              {t('emailHint')} <ResendVerificationButton />
            </>
          ) : current?.id === 'approval' ? (
            t('approvalHint')
          ) : (
            <>
              {t('nextUp')}{' '}
              <Link href="/onboarding" className="font-medium text-primary hover:underline">
                {t('continueSetup')}
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
