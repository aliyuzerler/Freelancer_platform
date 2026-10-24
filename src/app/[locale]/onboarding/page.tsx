import { auth } from '@/lib/auth';
import { getOnboarding } from '@/lib/onboarding';
import { getTranslations } from 'next-intl/server';
import { OnboardingWizard } from './wizard';
import { redirect } from '@/i18n/navigation';

// Title follows the actual state — "Finish setting up" on a finished account
// contradicts the page.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'onboarding' });
  const session = await auth();
  if (!session?.user) return { title: t('metaTitle') };
  const state = await getOnboarding(session.user.id, session.user.role);
  return { title: state.complete ? t('metaDone') : t('metaTitle'), robots: { index: false, follow: false } };
}
export const dynamic = 'force-dynamic';

/** Required onboarding wizard — resumable by derivation (see lib/onboarding). */
export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect({ href: '/login?next=/onboarding', locale });

  const state = await getOnboarding(session.user.id, session.user.role);

  return (
    <div className="container flex min-h-[70vh] justify-center py-12">
      <OnboardingWizard
        steps={state.steps}
        currentIndex={state.currentIndex}
        complete={state.complete}
        isFreelancer={state.isFreelancer}
        email={state.user?.email ?? ''}
        initialHeadline={state.user?.freelancerProfile?.headline ?? ''}
        initialHourlyRate={state.user?.freelancerProfile?.hourlyRate ?? null}
        initialLocation={state.user?.freelancerProfile?.location ?? ''}
        payout={{
          provider: (state.user?.payoutProvider ?? null) as
            | 'STRIPE_CONNECT'
            | 'PAYPAL'
            | 'WISE'
            | 'MANUAL'
            | 'CRYPTO_USDC'
            | null,
          detail: state.user?.payoutDetail ?? null,
          holderName: state.user?.payoutHolderName ?? null,
        }}
      />
    </div>
  );
}
