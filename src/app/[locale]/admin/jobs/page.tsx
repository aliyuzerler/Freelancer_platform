import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { JobRow, type AdminJob } from './job-row';

export const dynamic = 'force-dynamic';

const FILTERS = ['drafts', 'open', 'all'] as const;

export default async function AdminJobsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.jobs' });
  const { filter = 'drafts' } = await searchParams;

  const where =
    filter === 'open'
      ? { status: 'OPEN' as const, deletedAt: null }
      : filter === 'all'
        ? { deletedAt: null }
        : { status: 'DRAFT' as const, deletedAt: null };

  const [rows, counts] = await Promise.all([
    db.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        createdAt: true,
        client: {
          select: {
            status: true,
            clientProfile: { select: { companyName: true } },
            recruiterContact: { select: { email: true, contactable: true } },
          },
        },
        source: { select: { url: true } },
        _count: { select: { proposals: true } },
      },
    }),
    db.job.groupBy({ by: ['status'], _count: true, where: { deletedAt: null } }),
  ]);

  const draftCount = counts.find((c) => c.status === 'DRAFT')?._count ?? 0;

  const jobs: AdminJob[] = rows.map((j) => ({
    id: j.id,
    title: j.title,
    slug: j.slug,
    status: j.status,
    companyName: j.client.clientProfile?.companyName ?? '',
    contactEmail: j.client.recruiterContact?.email ?? '',
    contactable: j.client.recruiterContact?.contactable ?? j.client.status !== 'UNCLAIMED',
    isScraped: !!j.source,
    sourceUrl: j.source?.url ?? null,
    proposals: j._count.proposals,
    createdAt: j.createdAt.toISOString(),
  }));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold">{t('title')}</h2>
        {draftCount > 0 ? (
          <Badge variant="secondary">{t('awaitingCuration', { count: draftCount })}</Badge>
        ) : null}
      </div>
      <p className="mb-6 text-sm text-muted-foreground">{t('intro')}</p>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`/admin/jobs?filter=${f}`}
            className={`rounded-full border px-3 py-1 text-sm transition-colors hover:bg-accent ${
              filter === f ? 'border-primary bg-primary/10 text-primary' : ''
            }`}
          >
            {t(`filter.${f}`)}
          </Link>
        ))}
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t('empty')}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {jobs.map((j) => (
            <JobRow key={j.id} job={j} />
          ))}
        </div>
      )}
    </div>
  );
}
