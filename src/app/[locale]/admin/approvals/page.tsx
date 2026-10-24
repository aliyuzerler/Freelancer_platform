import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { initials } from '@/lib/utils';
import { intlTag } from '@/i18n/routing';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ApproveButton } from './approve-button';
import { redirect } from '@/i18n/navigation';

export const dynamic = 'force-dynamic';

/**
 * Admin review queue — accounts that finished every self-serve onboarding
 * step (crucially: confirmed email) and are waiting for manual approval.
 */
export default async function ApprovalsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.approvals' });

  const session = await auth();
  if (!session?.user) redirect({ href: '/login?next=/admin/approvals', locale });
  if (session.user.role !== 'ADMIN') notFound();

  const pending = await db.user.findMany({
    where: { approvedAt: null, emailVerified: { not: null }, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    take: 50,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
      clientProfile: { select: { companyName: true } },
      freelancerProfile: { select: { headline: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">{t('title')}</h2>
        <Badge variant="secondary">{t('pendingCount', { count: pending.length })}</Badge>
      </div>
      <p className="mt-1 text-muted-foreground">{t('intro')}</p>

      {pending.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-8 text-center text-muted-foreground">
            {t('empty')}
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid gap-3">
          {pending.map((u) => (
            <Card key={u.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <Avatar>
                  {u.image ? <AvatarImage src={u.image} alt="" /> : null}
                  <AvatarFallback>{initials(u.name, u.email)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{u.name ?? u.email}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {u.clientProfile?.companyName ?? u.freelancerProfile?.headline ?? u.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('joined', {
                      date: u.createdAt.toLocaleDateString(intlTag(locale), { month: 'short', day: 'numeric' }),
                    })}
                  </p>
                </div>
                <Badge variant="outline">{t(`roles.${u.role}` as never)}</Badge>
                <ApproveButton userId={u.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
