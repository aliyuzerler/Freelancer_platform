import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { JobForm } from './job-form';

export const metadata = { title: 'Post a job' };
export const dynamic = 'force-dynamic';

const CLIENT_ROLES = ['CLIENT', 'AGENCY_OWNER', 'ADMIN'];

/** Post-a-job page. Clients only, and only once their account is approved. */
export default async function NewJobPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?next=/jobs/new');

  const canPost = CLIENT_ROLES.includes(session.user.role);

  // Posting requires an approved account — send unapproved clients back through
  // onboarding (where the pending-approval state is shown) rather than letting
  // them fill a form only to be rejected on submit. Admins are exempt.
  if (canPost && session.user.role !== 'ADMIN') {
    const me = await db.user.findUnique({
      where: { id: session.user.id },
      select: { approvedAt: true },
    });
    if (!me?.approvedAt) redirect('/onboarding');
  }

  return (
    <div className="container max-w-2xl py-12">
      <h1 className="text-3xl font-bold">Post a job</h1>
      <p className="mt-1 mb-8 text-muted-foreground">
        Reach freelancers directly. Zero platform fees — always.
      </p>

      {canPost ? (
        <JobForm />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-muted-foreground">
              You’re signed in as a freelancer, so you can’t post jobs from this account.
            </p>
            <Button asChild>
              <Link href="/jobs">Find work instead</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
