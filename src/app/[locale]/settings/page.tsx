import { Wallet, ShieldCheck, User, Bell, ChevronRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { intlTag } from '@/i18n/routing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AvatarUpload } from '@/components/avatar-upload';
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
  const t = await getTranslations({ locale, namespace: 'settings' });
  return pageMetadata({ title: t('metaTitle'), path: '/settings', locale, noIndex: true });
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'settings' });

  const session = await auth();
  if (!session?.user) redirect({ href: '/login?next=/settings', locale });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      twoFactorEnabled: true,
      passwordHash: true,
      showFullName: true,
    },
  });
  if (!user) redirect({ href: '/login', locale });

  const isFreelancer = FREELANCER_ROLES.includes(user.role);
  const memberSince = user.createdAt.toLocaleDateString(intlTag(locale), { month: 'long', year: 'numeric' });

  return (
    <div className="container max-w-2xl py-12">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="mt-1 mb-8 text-muted-foreground">{t('subtitle')}</p>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <User className="size-5 text-primary" />
          <CardTitle>{t('account')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="border-b pb-4">
            <AvatarUpload image={user.image} name={user.name} email={user.email} />
          </div>
          <Row label={t('name')} value={user.name ?? '—'} />
          <Row label={t('email')} value={user.email} />
          <Row
            label={t('accountType')}
            value={<Badge variant="secondary">{t(`roles.${user.role}` as never)}</Badge>}
          />
          <Row label={t('memberSince')} value={memberSince} />
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4">
        <LinkCard
          href="/settings/profile"
          icon={User}
          title={isFreelancer ? t('profileTitle') : t('identityTitle')}
          desc={isFreelancer ? t('profileDesc') : t('identityDesc')}
        />
        <LinkCard
          href="/settings/payments"
          icon={Wallet}
          title={isFreelancer ? t('getPaidTitle') : t('billingTitle')}
          desc={isFreelancer ? t('getPaidDesc') : t('billingDesc')}
        />
        <LinkCard
          href="/settings/notifications"
          icon={Bell}
          title={t('notificationsTitle')}
          desc={t.rich('notificationsDesc', {
            name: user.showFullName ? t('nameDisplay.full') : t('nameDisplay.abbreviated'),
          })}
        />
        <LinkCard
          href="/settings/security"
          icon={ShieldCheck}
          title={t('securityTitle')}
          desc={t.rich('securityDesc', {
            password: user.passwordHash ? t('state.set') : t('state.notSet'),
            twofa: user.twoFactorEnabled ? t('state.enabled') : t('state.off'),
          })}
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function LinkCard({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: React.ReactNode;
}) {
  return (
    <Link href={href} className="block">
      <Card className="transition-colors hover:border-primary">
        <CardContent className="flex items-center gap-4 py-4">
          <Icon className="size-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
