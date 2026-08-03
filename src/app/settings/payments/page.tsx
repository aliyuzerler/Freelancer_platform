import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Wallet, ArrowLeft, Banknote, AlertTriangle } from 'lucide-react';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatMoney } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PayoutMethods } from './payout-methods';

export const metadata = { title: 'Get paid' };
export const dynamic = 'force-dynamic';

const FREELANCER_ROLES = ['FREELANCER', 'AGENCY_OWNER', 'AGENCY_MEMBER'];

export default async function GetPaidPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?next=/settings/payments');

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
          <ArrowLeft /> Settings
        </Link>
      </Button>

      <div className="flex items-center gap-3">
        <Wallet className="size-6 text-primary" />
        <h1 className="text-3xl font-bold">{isFreelancer ? 'Get paid' : 'Billing & payments'}</h1>
      </div>
      <p className="mt-1 text-muted-foreground">
        {isFreelancer
          ? 'You keep 100%. Payments route directly from clients to you — Freelancezero never touches your money.'
          : 'Pay talent directly with zero platform fees. You choose the method; funds go straight to the freelancer.'}
      </p>

      {!hasMethod ? (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <p>
            <span className="font-medium">No {isFreelancer ? 'payout' : 'payment'} method set up.</span>{' '}
            {isFreelancer
              ? 'Add one so clients can pay you when work is accepted.'
              : 'Add one so you can pay freelancers you hire.'}
          </p>
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFreelancer ? 'Lifetime earned' : 'Lifetime paid'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatMoney(lifetime, 'USD')}</div>
            <p className="mt-1 text-xs text-muted-foreground">0% platform fee — always.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeContracts}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeContracts === 0 ? 'No active contracts yet.' : 'In progress.'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Banknote className="size-5 text-primary" />
          <CardTitle>{isFreelancer ? 'Payout method' : 'Payment method'}</CardTitle>
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
