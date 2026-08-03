import Link from 'next/link';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { JobRow, type AdminJob } from './job-row';

export const metadata = { title: 'Admin — Postings' };
export const dynamic = 'force-dynamic';

const FILTERS = [
  { key: 'drafts', label: 'Needs curation' },
  { key: 'open', label: 'Published' },
  { key: 'all', label: 'All' },
] as const;

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
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
        <h2 className="text-xl font-semibold">Postings</h2>
        {draftCount > 0 ? (
          <Badge variant="secondary">{draftCount} awaiting curation</Badge>
        ) : null}
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Scraped postings arrive as drafts when no contact address could be found. Add the company
        name and an email, then publish — applicants can only be delivered to a real inbox.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/jobs?filter=${f.key}`}
            className={`rounded-full border px-3 py-1 text-sm transition-colors hover:bg-accent ${
              filter === f.key ? 'border-primary bg-primary/10 text-primary' : ''
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nothing here. Run the ingest to pull in new postings.
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
