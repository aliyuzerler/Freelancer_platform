import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PreferencesForm } from './preferences-form';
import { pageMetadata } from '@/lib/seo';
import { Link, redirect } from '@/i18n/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'settings.notifications.meta' });
  return pageMetadata({ title: t('title'), path: '/settings/notifications', locale, noIndex: true });
}

export default async function NotificationsSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'settings.notifications' });

  const session = await auth();
  if (!session?.user) redirect({ href: '/login?next=/settings/notifications', locale });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      showFullName: true,
      indexProfile: true,
      notifyProposals: true,
      notifyMessages: true,
      notifyProductNews: true,
    },
  });
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
        <CardContent className="py-2">
          <PreferencesForm
            initial={{
              showFullName: user.showFullName,
              indexProfile: user.indexProfile,
              notifyProposals: user.notifyProposals,
              notifyMessages: user.notifyMessages,
              notifyProductNews: user.notifyProductNews,
            }}
            exampleName={user.name ?? t('exampleName')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
