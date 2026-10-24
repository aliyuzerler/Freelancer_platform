import { Briefcase } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { getOnboarding } from '@/lib/onboarding';
import { auth } from '@/lib/auth';
import { formatMoney } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { pageMetadata } from '@/lib/seo';
import { Link, redirect } from '@/i18n/navigation';

const FREELANCER_ROLES = ['FREELANCER', 'AGENCY_OWNER', 'AGENCY_MEMBER'];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'jobs.list.meta' });
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: '/jobs',
    locale,
    keywords: (t.raw('keywords') as string[]) ?? [],
  });
}
// Always reflect the latest open jobs.
export const dynamic = 'force-dynamic';

/** Public job feed. Finding work is for freelancers — clients hire instead. */
export default async function JobsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'jobs.list' });

  // The job feed is a members-only surface for freelancers: guests sign in
  // first (which also keeps the full listing out of scrapers' reach), and
  // signed-in clients are sent to their own hub.
  const session = await auth();
  if (!session?.user) redirect({ href: '/login?next=/jobs', locale });
  if (!FREELANCER_ROLES.includes(session.user.role)) redirect({ href: '/dashboard', locale });
  // The feed is a post-onboarding surface: applying requires admin approval
  // (see the proposals API), so users still in the wizard get sent back.
  const onboarding = await getOnboarding(session.user.id, session.user.role);
  if (!onboarding.complete) redirect({ href: '/onboarding', locale });

  const jobs = await db.job.findMany({
    where: { status: 'OPEN', deletedAt: null, visibility: 'public' },
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    take: 30,
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      budgetType: true,
      budgetMin: true,
      budgetMax: true,
      currency: true,
      experience: true,
      skills: { select: { skill: { select: { id: true, name: true } } } },
      _count: { select: { proposals: true } },
    },
  });

  return (
    <div className="container py-12">
      <div className="mb-8 flex items-center gap-3">
        <Briefcase className="text-primary" />
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <Badge variant="secondary">{t('openCount', { count: jobs.length })}</Badge>
      </div>

      {jobs.length === 0 ? (
        <p className="text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.slug}`} className="block">
              <Card className="transition-colors hover:border-primary">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <span className="whitespace-nowrap text-sm font-semibold text-primary">
                      {formatBudget(job, locale, t)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{t(`experience.${job.experience}` as never)}</Badge>
                    {job.skills.map((s) => (
                      <Badge key={s.skill.id}>{s.skill.name}</Badge>
                    ))}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {t('proposalCount', { count: job._count.proposals })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function formatBudget(
  job: {
    budgetType: 'HOURLY' | 'FIXED';
    budgetMin: number | null;
    budgetMax: number | null;
    currency: string;
  },
  locale: string,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  const { budgetMin, budgetMax, currency } = job;
  if (budgetMin == null && budgetMax == null) return t('budgetTbd');
  if (job.budgetType === 'FIXED')
    return t('budgetFixed', { amount: formatMoney(budgetMax ?? budgetMin!, currency, locale) });
  const lo = budgetMin != null ? formatMoney(budgetMin, currency, locale) : '';
  const hi = budgetMax != null ? formatMoney(budgetMax, currency, locale) : '';
  return t('budgetHourlyRange', { range: [lo, hi].filter(Boolean).join(' – ') });
}
