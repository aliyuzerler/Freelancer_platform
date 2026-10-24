import {
  ArrowLeft, KeyRound, ShieldCheck, History, CheckCircle2, XCircle, BadgeCheck,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { intlTag } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordForm } from './password-form';
import { IdentityCard } from './identity-card';
import { getIdentityAdapter } from '@/lib/adapters/identity';
import { pageMetadata } from '@/lib/seo';
import { Link, redirect } from '@/i18n/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'settings.security.meta' });
  return pageMetadata({ title: t('title'), path: '/settings/security', locale, noIndex: true });
}

export default async function SecuritySettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'settings.security' });

  const session = await auth();
  if (!session?.user) redirect({ href: '/login?next=/settings/security', locale });

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
  if (!user) redirect({ href: '/login', locale });

  return (
    <div className="container max-w-2xl py-12">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link href="/settings">
          <ArrowLeft /> {t('backToSettings')}
        </Link>
      </Button>

      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="mt-1 mb-8 text-muted-foreground">{t('subtitle')}</p>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <ShieldCheck className="size-5 text-primary" />
          <CardTitle>{t('overview')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <StatusRow
            label={t('emailConfirmed')}
            ok={!!user.emailVerified}
            okText={user.email ?? t('stateConfirmed')}
            badText={t('stateNotConfirmed')}
          />
          <StatusRow
            label={t('passwordRow')}
            ok={!!user.passwordHash}
            okText={t('stateSet')}
            badText={t('stateNoPassword')}
          />
          <StatusRow
            label={t('identityVerified')}
            ok={user.identityStatus === 'VERIFIED'}
            okText={t('stateVerified')}
            badText={user.identityStatus === 'UNVERIFIED' ? t('stateNotVerified') : user.identityStatus.toLowerCase()}
          />
          <StatusRow
            label={t('twoFactor')}
            ok={user.twoFactorEnabled}
            okText={t('stateEnabled')}
            badText={t('stateNotEnabled')}
          />
          <div className="flex items-center justify-between gap-4 pt-1">
            <span className="text-muted-foreground">{t('connectedMethods')}</span>
            <span className="flex flex-wrap justify-end gap-1">
              {accounts.length === 0 ? (
                <Badge variant="outline">{t('emailOnly')}</Badge>
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
          <CardTitle>{user.passwordHash ? t('changePassword') : t('setAPassword')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordForm hasPassword={!!user.passwordHash} />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <BadgeCheck className="size-5 text-primary" />
          <CardTitle>{t('identityVerification')}</CardTitle>
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
          <CardTitle>{t('twoFactor')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {user.twoFactorEnabled ? t('twofaOn') : t('twofaOff')}
          </p>
          <Button className="mt-3" size="sm" variant="outline" disabled>
            {user.twoFactorEnabled ? t('manage2fa') : t('setup2fa')}
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <History className="size-5 text-primary" />
          <CardTitle>{t('recentActivity')}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noActivity')}</p>
          ) : (
            <ul className="grid gap-2 text-sm">
              {recentActivity.map((a) => {
                const auditKey = a.action.replace('.', '_');
                const known = ['user_password_change', 'user_login', 'job_publish', 'payment_release'].includes(auditKey);
                return (
                  <li key={a.id} className="flex items-center justify-between gap-4 border-b pb-2 last:border-0">
                    <span>{known ? t(`audit.${auditKey}` as never) : a.action}</span>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">
                      {a.createdAt.toLocaleDateString(intlTag(locale), {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </li>
                );
              })}
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
