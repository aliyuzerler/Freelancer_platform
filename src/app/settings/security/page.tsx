import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowLeft, KeyRound, ShieldCheck, History, CheckCircle2, XCircle, BadgeCheck,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordForm } from './password-form';
import { IdentityCard } from './identity-card';
import { getIdentityAdapter } from '@/lib/adapters/identity';

export const metadata = { title: 'Security' };
export const dynamic = 'force-dynamic';

const ACTION_LABELS: Record<string, string> = {
  'user.password_change': 'Password changed',
  'user.login': 'Signed in',
  'job.publish': 'Published a job',
  'payment.release': 'Released a payment',
};

export default async function SecuritySettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?next=/settings/security');

  const [user, accounts, recentActivity] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        passwordHash: true, twoFactorEnabled: true, emailVerified: true, email: true,
        identityStatus: true,
      },
    }),
    db.account.findMany({
      where: { userId: session.user.id },
      select: { provider: true },
    }),
    db.auditLog.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, action: true, createdAt: true, ip: true },
    }),
  ]);
  if (!user) redirect('/login');

  return (
    <div className="container max-w-2xl py-12">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link href="/settings">
          <ArrowLeft /> Settings
        </Link>
      </Button>

      <h1 className="text-3xl font-bold">Security</h1>
      <p className="mt-1 mb-8 text-muted-foreground">
        Keep your account safe. Changes here trigger a confirmation email.
      </p>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <ShieldCheck className="size-5 text-primary" />
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <StatusRow
            label="Email confirmed"
            ok={!!user.emailVerified}
            okText={user.email ?? 'Confirmed'}
            badText="Not confirmed yet"
          />
          <StatusRow
            label="Password"
            ok={!!user.passwordHash}
            okText="Set"
            badText="Not set — you sign in with a link or social login"
          />
          <StatusRow
            label="Identity verified"
            ok={user.identityStatus === 'VERIFIED'}
            okText="Verified"
            badText={user.identityStatus === 'UNVERIFIED' ? 'Not verified' : user.identityStatus.toLowerCase()}
          />
          <StatusRow
            label="Two-factor authentication"
            ok={user.twoFactorEnabled}
            okText="Enabled"
            badText="Not enabled"
          />
          <div className="flex items-center justify-between gap-4 pt-1">
            <span className="text-muted-foreground">Connected sign-in methods</span>
            <span className="flex flex-wrap justify-end gap-1">
              {accounts.length === 0 ? (
                <Badge variant="outline">Email only</Badge>
              ) : (
                accounts.map((a) => (
                  <Badge key={a.provider} variant="secondary">
                    {a.provider}
                  </Badge>
                ))
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <KeyRound className="size-5 text-primary" />
          <CardTitle>{user.passwordHash ? 'Change password' : 'Set a password'}</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordForm hasPassword={!!user.passwordHash} />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <BadgeCheck className="size-5 text-primary" />
          <CardTitle>Identity verification</CardTitle>
        </CardHeader>
        <CardContent>
          <IdentityCard
            status={user.identityStatus}
            enabled={getIdentityAdapter().configured}
          />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <ShieldCheck className="size-5 text-primary" />
          <CardTitle>Two-factor authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {user.twoFactorEnabled
              ? 'Two-factor authentication is enabled on your account.'
              : 'Add a second step at sign-in using an authenticator app. Setup is coming soon — in the meantime, use a strong unique password.'}
          </p>
          <Button className="mt-3" size="sm" variant="outline" disabled>
            {user.twoFactorEnabled ? 'Manage 2FA' : 'Set up 2FA (coming soon)'}
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <History className="size-5 text-primary" />
          <CardTitle>Recent account activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recorded activity yet.</p>
          ) : (
            <ul className="grid gap-2 text-sm">
              {recentActivity.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-4 border-b pb-2 last:border-0">
                  <span>{ACTION_LABELS[a.action] ?? a.action}</span>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {a.createdAt.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusRow({
  label,
  ok,
  okText,
  badText,
}: {
  label: string;
  ok: boolean;
  okText: string;
  badText: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="inline-flex items-center gap-1.5 text-right font-medium">
        {ok ? (
          <CheckCircle2 className="size-4 text-primary" />
        ) : (
          <XCircle className="size-4 text-amber-600" />
        )}
        {ok ? okText : badText}
      </span>
    </div>
  );
}
