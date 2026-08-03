import { notFound, redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { initials } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ApproveButton } from './approve-button';

export const metadata = { title: 'Account approvals' };
export const dynamic = 'force-dynamic';

/**
 * Admin review queue — accounts that finished every self-serve onboarding
 * step (crucially: confirmed email) and are waiting for manual approval.
 */
export default async function ApprovalsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?next=/admin/approvals');
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
        <h2 className="text-xl font-semibold">Account approvals</h2>
        <Badge variant="secondary">{pending.length} pending</Badge>
      </div>
      <p className="mt-1 text-muted-foreground">
        Approving lets the user post or apply to jobs. This is the last line of defense against spam.
      </p>

      {pending.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-8 text-center text-muted-foreground">
            Nobody waiting — the queue is clear.
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
                    Joined {u.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <Badge variant="outline">{u.role.toLowerCase().replace('_', ' ')}</Badge>
                <ApproveButton userId={u.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
