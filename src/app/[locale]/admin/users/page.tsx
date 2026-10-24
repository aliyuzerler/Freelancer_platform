import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { Link } from '@/i18n/navigation';
import { initials } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { UserRow, type AdminUser } from './user-row';

export const dynamic = 'force-dynamic';

const FREELANCER_ROLES = ['FREELANCER', 'AGENCY_OWNER', 'AGENCY_MEMBER'] as const;

const FILTERS = ['clients', 'freelancers', 'companies', 'all'] as const;

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.users' });
  const { filter = 'clients' } = await searchParams;

  const where =
    filter === 'freelancers'
      ? { role: { in: [...FREELANCER_ROLES] }, deletedAt: null }
      : filter === 'companies'
        ? { status: 'UNCLAIMED' as const, deletedAt: null }
        : filter === 'all'
          ? { deletedAt: null }
          : { role: { in: ['CLIENT' as const, 'AGENCY_OWNER' as const] }, deletedAt: null };

  const rows = await db.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      status: true,
      approvedAt: true,
      clientProfile: { select: { companyName: true } },
      freelancerProfile: { select: { id: true, headline: true } },
      recruiterContact: { select: { email: true } },
      _count: { select: { jobsPosted: true, proposals: true } },
    },
  });

  const users: AdminUser[] = rows.map((u) => ({
    id: u.id,
    name: u.name ?? '',
    email: u.email,
    image: u.image,
    initials: initials(u.name, u.email),
    role: u.role,
    status: u.status,
    approved: !!u.approvedAt,
    companyName: u.clientProfile?.companyName ?? '',
    headline: u.freelancerProfile?.headline ?? '',
    contactEmail: u.recruiterContact?.email ?? '',
    profileId: u.freelancerProfile?.id ?? null,
    jobs: u._count.jobsPosted,
    proposals: u._count.proposals,
  }));

  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold">{t('title')}</h2>
      <p className="mb-6 text-sm text-muted-foreground">{t('intro')}</p>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`/admin/users?filter=${f}`}
            className={`rounded-full border px-3 py-1 text-sm transition-colors hover:bg-accent ${
              filter === f ? 'border-primary bg-primary/10 text-primary' : ''
            }`}
          >
            {t(`filter.${f}`)}
          </Link>
        ))}
      </div>

      {users.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t('empty')}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {users.map((u) => (
            <UserRow key={u.id} user={u} />
          ))}
        </div>
      )}
    </div>
  );
}
