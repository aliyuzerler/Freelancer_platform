import type { Metadata } from 'next';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { hashToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link as LocaleLink } from '@/i18n/navigation';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth.verify' });
  return pageMetadata({
    title: t('metaTitle'),
    locale,
    path: '/verify',
    noIndex: true,
  });
}
export const dynamic = 'force-dynamic';

/** Email-confirmation landing page. Consumes the one-time token. */
export default async function VerifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { locale } = await params;
  const { token, email } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'auth.verify' });

  let state: 'success' | 'expired' | 'invalid' = 'invalid';
  if (token && email) {
    // Tokens are stored as SHA-256 digests (FZ-17) — hash before lookup.
    const record = await db.verificationToken.findUnique({ where: { token: hashToken(token) } });
    if (record && record.identifier === email) {
      if (record.expires > new Date()) {
        await db.user.updateMany({ where: { email }, data: { emailVerified: new Date() } });
        // One-time: burn every outstanding token for this address.
        await db.verificationToken.deleteMany({ where: { identifier: email } });
        state = 'success';
      } else {
        state = 'expired';
      }
    }
  }

  const ctaHref =
    state === 'success' ? '/dashboard' : '/login';

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center gap-3">
          {state === 'success' ? (
            <CheckCircle2 className="size-10 text-primary" />
          ) : state === 'expired' ? (
            <Clock className="size-10 text-amber-600" />
          ) : (
            <XCircle className="size-10 text-destructive" />
          )}
          <CardTitle className="text-2xl">{t(`${state}.title`)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t(`${state}.body`)}</p>
          <Button asChild className="mt-6">
            <LocaleLink href={ctaHref}>{t(`${state}.cta`)}</LocaleLink>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
