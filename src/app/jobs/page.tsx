import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Briefcase } from 'lucide-react';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { formatMoney } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { pageMetadata } from '@/lib/seo';

const FREELANCER_ROLES = ['FREELANCER', 'AGENCY_OWNER', 'AGENCY_MEMBER'];

export const metadata = pageMetadata({
  title: 'Find Freelance Work — Zero Fees, Keep 100%',
  description:
    'Browse freelance jobs and keep 100% of what you earn. No commissions, no connects to apply. Find remote freelance work across development, design, writing, and marketing.',
  path: '/jobs',
  keywords: ['freelance jobs', 'remote freelance work', 'find freelance work no fees'],
});
// Always reflect the latest open jobs.
export const dynamic = 'force-dynamic';

/** Public job feed. Finding work is for freelancers — clients hire instead. */
export default async function JobsPage() {
  // The job feed is a members-only surface for freelancers: guests sign in
  // first (which also keeps the full listing out of scrapers' reach), and
  // signed-in clients are sent to their own hub.
  const session = await auth();
  if (!session?.user) redirect('/login?next=/jobs');
  if (!FREELANCER_ROLES.includes(session.user.role)) redirect('/dashboard');

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
        <h1 className="text-3xl font-bold">Find work</h1>
        <Badge variant="secondary">{jobs.length} open</Badge>
      </div>

      {jobs.length === 0 ? (
        <p className="text-muted-foreground">No open jobs yet. Check back soon.</p>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.slug}`} className="block">
              <Card className="transition-colors hover:border-primary">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <span className="whitespace-nowrap text-sm font-semibold text-primary">
                      {formatBudget(job)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{job.experience.toLowerCase()}</Badge>
                    {job.skills.map((s) => (
                      <Badge key={s.skill.id}>{s.skill.name}</Badge>
                    ))}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {job._count.proposals} proposal{job._count.proposals === 1 ? '' : 's'}
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

function formatBudget(job: {
  budgetType: 'HOURLY' | 'FIXED';
  budgetMin: number | null;
  budgetMax: number | null;
  currency: string;
}): string {
  const { budgetMin, budgetMax, currency } = job;
  if (budgetMin == null && budgetMax == null) return 'Budget TBD';
  if (job.budgetType === 'FIXED') return `${formatMoney(budgetMax ?? budgetMin!, currency)} fixed`;
  const lo = budgetMin != null ? formatMoney(budgetMin, currency) : '';
  const hi = budgetMax != null ? formatMoney(budgetMax, currency) : '';
  return `${[lo, hi].filter(Boolean).join(' – ')}/hr`;
}
