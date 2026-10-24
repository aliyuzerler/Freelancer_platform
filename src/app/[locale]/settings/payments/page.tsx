import { Wallet, ArrowLeft, Banknote, AlertTriangle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatMoney } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PayoutMethods } from './payout-methods';
import { pageMetadata } from '@/lib/seo';
import { Link, redirect } from '@/i18n/navigation';

export const dynamic = 'force-dynamic';

const FREELANCER_ROLES = ['FREELANCER', 'AGENCY_OWNER', 'AGENCY_MEMBER'];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'settings.payments.meta' });
  return pageMetadata({ title: t('title'), path: '/settings/payments', locale, noIndex: true });
}

export default async function GetPaidPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'settings.payments' });

  const session = await auth();
  if (!session?.user) redirect({ href: '/login?next=/settings/payments', locale });

  const userId = session.user.id;
  const isFreelancer = FREELANCER_ROLES.includes(session.user.role);

  const [me, released, activeContracts] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { payoutProvider: true, payoutDetail: true, payoutHolderName: true },
    }),
    db.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'RELEASED',
        milestone: {
          contract: isFreelancer ? { freelancerId: userId } : { clientId: userId },
        },
      },
    }),
    db.contract.count({
      where: isFreelancer
        ? { freelancerId: userId, status: 'ACTIVE' }
        : { clientId: userId, status: 'ACTIVE' },
    }),
  ]);
  const lifetime = released._sum.amount ?? 0;
  const hasMethod = !!me?.payoutProvider;

  return (
    <div className="container max-w-2xl py-12">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link href="/settings">
          <ArrowLeft /> {t('backToSettings')}
        </Link>
      </Button>

      <div className="flex items-center gap-3">
        <Wallet className="size-6 text-primary" />
        <h1 className="text-3xl font-bold">{isFreelancer ? t('getPaidTitle') : t('billingTitle')}</h1>
      </div>
      <p className="mt-1 text-muted-foreground">
        {isFreelancer ? t('freelancerIntro') : t('clientIntro')}
      </p>

      {!hasMethod ? (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <p>
            <span className="font-medium">
              {isFreelancer ? t('noMethodTitle') : t('noPaymentTitle')}
            </span>{' '}
            {isFreelancer ? t('noMethodBody') : t('noPaymentBody')}
          </p>
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFreelancer ? t('lifetimeEarned') : t('lifetimePaid')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatMoney(lifetime, 'USD', locale)}</div>
            <p className="mt-1 text-xs text-muted-foreground">{t('zeroFeeNote')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('activeContracts')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeContracts}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeContracts === 0 ? t('noContractsYet') : t('inProgress')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Banknote className="size-5 text-primary" />
          <CardTitle>{isFreelancer ? t('payoutMethod') : t('paymentMethod')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PayoutMethods
            initialProvider={me?.payoutProvider ?? null}
            initialDetail={me?.payoutDetail ?? null}
            initialHolderName={me?.payoutHolderName ?? null}
            isFreelancer={isFreelancer}
          />
        </CardContent>
      </Card>
    </div>
  );
}
