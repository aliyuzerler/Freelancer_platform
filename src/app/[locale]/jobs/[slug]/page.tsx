import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Clock, Star, Users, CheckCircle2, Lock } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { formatMoney, initials, displayName } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ApplyForm } from './apply-form';
import { Link, redirect } from '@/i18n/navigation';

export const dynamic = 'force-dynamic';

const FREELANCER_ROLES = ['FREELANCER', 'AGENCY_OWNER', 'AGENCY_MEMBER'];

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'jobs.detail' });
  const job = await db.job.findUnique({
    where: { slug },
    include: {
      skills: { select: { skill: { select: { id: true, name: true } } } },
      client: {
        select: {
          name: true,
          image: true,
          showFullName: true,
          clientProfile: {
            select: { companyName: true, paymentVerified: true, ratingAvg: true, ratingCount: true },
          },
        },
      },
      _count: { select: { proposals: true } },
    },
  });

  if (!job || job.deletedAt) notFound();

  // Viewer context drives the call-to-action below.
  const session = await auth();
  const viewer = session?.user;
  const isOwner = viewer?.id === job.clientId;

  // Guests get a teaser (see below) rather than the full posting. Signed-in
  // clients have no business browsing other people's postings, so they are sent
  // back to their own hub — but they can always open their own.
  if (viewer && !isOwner && !FREELANCER_ROLES.includes(viewer.role)) {
    redirect({ href: '/dashboard', locale });
  }
  const locked = !viewer;
  const canApply = !!viewer && !isOwner && FREELANCER_ROLES.includes(viewer.role) && job.status === 'OPEN';
  const alreadyApplied =
    canApply &&
    (await db.proposal.findUnique({
      where: { jobId_freelancerId: { jobId: job.id, freelancerId: viewer!.id } },
      select: { id: true },
    })) !== null;

  // Social proof for the "About the client" card.
  const clientPostings = await db.job.count({
    where: { clientId: job.clientId, deletedAt: null },
  });

  // A company name is a business identity and is fine to show in full. An
  // individual's is personal data on a public page, so it is abbreviated the
  // same way freelancer names are ("Dario M.") unless they opted in.
  const clientLabel =
    job.client.clientProfile?.companyName?.trim() ||
    displayName(job.client.name, job.client.showFullName, t('anonymousClient'));

  return (
    <div className="container max-w-3xl py-12">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link href={isOwner ? '/dashboard' : '/jobs'}>
          <ArrowLeft /> {isOwner ? t('backToDashboard') : t('backToJobs')}
        </Link>
      </Button>

      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="outline">{t(`experience.${job.experience}` as never)}</Badge>
        <span className="inline-flex items-center gap-1">
          <Users className="size-4" /> {t('proposalCount', { count: job._count.proposals })}
        </span>
        {job.estimatedDays ? (
          <span className="inline-flex items-center gap-1">
            <Clock className="size-4" /> {t('estimatedDays', { count: job.estimatedDays })}
          </span>
        ) : null}
      </div>

      <h1 className="text-3xl font-bold">{job.title}</h1>
      <p className="mt-1 text-lg font-semibold text-primary">
        {job.budgetType === 'FIXED'
          ? t('fixedPrice', { amount: formatMoney(job.budgetMax ?? job.budgetMin ?? 0, job.currency, locale) })
          : t('hourlyPrice', {
              min: formatMoney(job.budgetMin ?? 0, job.currency, locale),
              max: formatMoney(job.budgetMax ?? 0, job.currency, locale),
            })}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {job.skills.map((s) => (
          <Badge key={s.skill.id}>{s.skill.name}</Badge>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>{t('jobDescription')}</CardTitle>
        </CardHeader>
        <CardContent>
          {locked ? (
            // Teaser: enough for search engines and for a visitor to judge
            // relevance, with the rest behind a sign-in.
            <div className="relative">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {job.description.slice(0, 400)}
              </p>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-card to-transparent" />
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {job.description}
            </p>
          )}

          {locked ? (
            <div className="mt-4 rounded-lg border bg-muted/40 p-5 text-center">
              <Lock className="mx-auto size-5 text-primary" />
              <p className="mt-2 font-medium">{t('lockedTitle')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('lockedBody')}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button asChild>
                  <Link href={`/register?role=freelancer&next=/jobs/${job.slug}`}>
                    {t('signUpFree')}
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/login?next=/jobs/${job.slug}`}>{t('logIn')}</Link>
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('aboutClient')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-medium">{clientLabel}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {job.client.clientProfile && job.client.clientProfile.ratingCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Star className="size-4 fill-primary text-primary" />
                {job.client.clientProfile.ratingAvg.toFixed(1)} ({job.client.clientProfile.ratingCount})
              </span>
            ) : (
              <span>{t('noReviewsYet')}</span>
            )}
            <span>{t('postingCount', { count: clientPostings })}</span>
          </div>
          {job.client.clientProfile?.paymentVerified ? (
            <Badge variant="secondary" className="mt-2">{t('paymentVerified')}</Badge>
          ) : null}
        </CardContent>
      </Card>

      {isOwner ? (
        <OwnerApplicants jobId={job.id} slug={job.slug} total={job._count.proposals} locale={locale} />
      ) : (
        /* Call to action — depends on who's viewing. */
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{alreadyApplied ? t('yourApplication') : t('applyTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {alreadyApplied ? (
              <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-primary" />{' '}
                {t.rich('appliedNote', {
                  dashboard: (chunks) => (
                    <Link href="/dashboard" className="text-primary hover:underline">
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
            ) : canApply ? (
              <ApplyForm jobId={job.id} defaultBidType={job.budgetType} />
            ) : viewer ? (
              <p className="text-sm text-muted-foreground">
                {job.status === 'OPEN' ? t('onlyFreelancers') : t('closedJob')}
              </p>
            ) : (
              <Button asChild>
                <Link href={`/login?next=/jobs/${job.slug}`}>{t('signInToApply')}</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/** Owner-only preview of the most recent applicants, linking to the full view. */
async function OwnerApplicants({
  jobId,
  slug,
  total,
  locale,
}: {
  jobId: string;
  slug: string;
  total: number;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'jobs.detail' });
  const proposals = await db.proposal.findMany({
    where: { jobId },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: {
      id: true,
      bidAmount: true,
      bidType: true,
      freelancer: {
        select: {
          name: true,
          image: true,
          freelancerProfile: { select: { headline: true, currency: true } },
        },
      },
    },
  });

  return (
    <Card className="mt-6">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{t('applicants')}</CardTitle>
        {total > 0 ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/jobs/${slug}/proposals`}>
              {t('viewAll', { count: total })} <ArrowRight />
            </Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {proposals.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noApplicationsYet')}</p>
        ) : (
          <ul>
            {proposals.map((p) => (
              <li key={p.id} className="flex items-center gap-3 border-b border-border py-3 first:pt-0 last:border-0 last:pb-0">
                <Avatar>
                  {p.freelancer.image ? <AvatarImage src={p.freelancer.image} alt="" /> : null}
                  <AvatarFallback>{initials(p.freelancer.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.freelancer.name ?? t('freelancerFallback')}</p>
                  {p.freelancer.freelancerProfile?.headline ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {p.freelancer.freelancerProfile.headline}
                    </p>
                  ) : null}
                </div>
                <Badge variant="outline">
                  {p.bidType === 'HOURLY'
                    ? t('bidPerHour', {
                        amount: formatMoney(p.bidAmount, p.freelancer.freelancerProfile?.currency ?? 'USD', locale),
                      })
                    : formatMoney(p.bidAmount, p.freelancer.freelancerProfile?.currency ?? 'USD', locale)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
