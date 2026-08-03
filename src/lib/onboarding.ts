import { db } from '@/lib/db';

/**
 * The single definition of the onboarding flow. Both the /onboarding wizard
 * and the dashboard checklist derive from this — adding a step here (plus a
 * step component in the wizard) extends the flow everywhere.
 *
 * Progress is *derived from the database* (no separate wizard state), so the
 * flow is inherently resumable: closing the tab loses nothing.
 */
export type OnboardingStepId = 'account' | 'email' | 'photo' | 'profile' | 'payout' | 'approval';

export type OnboardingStep = {
  id: OnboardingStepId;
  label: string;
  done: boolean;
};

const FREELANCER_ROLES = ['FREELANCER', 'AGENCY_OWNER', 'AGENCY_MEMBER'];

export type OnboardingUser = {
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  approvedAt: Date | null;
  payoutProvider: string | null;
  payoutDetail: string | null;
  payoutHolderName: string | null;
  freelancerProfile: {
    headline: string | null;
    hourlyRate: number | null;
    location: string | null;
  } | null;
};

export async function getOnboarding(userId: string, role: string) {
  const user = (await db.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      emailVerified: true,
      image: true,
      approvedAt: true,
      payoutProvider: true,
      payoutDetail: true,
      payoutHolderName: true,
      freelancerProfile: { select: { headline: true, hourlyRate: true, location: true } },
    },
  })) as OnboardingUser | null;

  const isFreelancer = FREELANCER_ROLES.includes(role);
  const steps: OnboardingStep[] = [
    { id: 'account', label: 'Create account', done: true },
    { id: 'email', label: 'Confirm email', done: !!user?.emailVerified },
    { id: 'photo', label: 'Add profile photo', done: !!user?.image },
    isFreelancer
      ? {
          id: 'profile',
          label: 'Your basics',
          // Location is required: clients filter on it, so an incomplete profile
          // is invisible to exactly the people meant to find it.
          done: !!user?.freelancerProfile?.headline && !!user?.freelancerProfile?.location,
        }
      : { id: 'payout', label: 'Add payment method', done: !!user?.payoutProvider },
    { id: 'approval', label: 'Approval', done: !!user?.approvedAt },
  ];

  // Approval is the terminal gate, not just another checkbox: a human has
  // reviewed and vouched for the account. If it was granted early (an admin can
  // approve straight from the admin panel), the earlier prompts are moot —
  // continuing to block someone an admin already cleared is nonsense, and it is
  // what produced a "complete" approval step sitting after unfinished ones.
  const approved = !!user?.approvedAt;

  const currentIndex = approved ? -1 : steps.findIndex((s) => !s.done);
  return {
    steps,
    user,
    isFreelancer,
    currentIndex,
    /** Every self-serve step done — only the (async) admin review is left. */
    actionableComplete: approved || steps.slice(0, -1).every((s) => s.done),
    complete: approved || currentIndex === -1,
  };
}

export type Onboarding = Awaited<ReturnType<typeof getOnboarding>>;
