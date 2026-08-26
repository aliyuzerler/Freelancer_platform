import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getSignedInDestination } from '@/lib/onboarding';

/**
 * The sign-in page is for guests only: an already-authenticated visitor is
 * sent to their app home (or back to onboarding if the flow is unfinished)
 * instead of seeing the form.
 */
export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user) redirect(await getSignedInDestination(session.user.id, session.user.role));
  return children;
}
