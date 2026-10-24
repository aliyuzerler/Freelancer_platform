import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { JobForm } from './job-form';
import { pageMetadata } from '@/lib/seo';
import { Link, redirect } from '@/i18n/navigation';

export const dynamic = 'force-dynamic';

const CLIENT_ROLES = ['CLIENT', 'AGENCY_OWNER', 'ADMIN'];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'jobs.new' });
  return pageMetadata({ title: t('metaTitle'), path: '/jobs/new', locale, noIndex: true });
}

/** Post-a-job page. Clients only, and only once their account is approved. */
export default async function NewJobPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'jobs.new' });

  const session = await auth();
  if (!session?.user) redirect({ href: '/login?next=/jobs/new', locale });

  const canPost = CLIENT_ROLES.includes(session.user.role);

  // Posting requires an approved account — send unapproved clients back through
  // onboarding (where the pending-approval state is shown) rather than letting
  // them fill a form only to be rejected on submit. Admins are exempt.
  if (canPost && session.user.role !== 'ADMIN') {
    const me = await db.user.findUnique({
      where: { id: session.user.id },
      select: { approvedAt: true },
    });
    if (!me?.approvedAt) redirect({ href: '/onboarding', locale });
  }

  return (
    <div className="container max-w-2xl py-12">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="mt-1 mb-8 text-muted-foreground">{t('subtitle')}</p>

      {canPost ? (
        <JobForm />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-muted-foreground">{t('freelancerNotice')}</p>
            <Button asChild>
              <Link href="/jobs">{t('findWorkInstead')}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
