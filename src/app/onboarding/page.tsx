import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getOnboarding } from '@/lib/onboarding';
import { OnboardingWizard } from './wizard';

// Title follows the actual state — "Finish setting up" on a finished account
// contradicts the page.
export async function generateMetadata() {
  const session = await auth();
  if (!session?.user) return { title: 'Finish setting up' };
  const state = await getOnboarding(session.user.id, session.user.role);
  return { title: state.complete ? "You're all set" : 'Finish setting up' };
}
export const dynamic = 'force-dynamic';

/** Required onboarding wizard — resumable by derivation (see lib/onboarding). */
export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?next=/onboarding');

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
