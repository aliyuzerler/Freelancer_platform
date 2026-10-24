import { MapPin, Clock, Heart, Globe2, Scale, Sparkles } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'careers.meta' });
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: '/careers',
    locale,
    keywords: (t.raw('keywords') as string[]) ?? [],
  });
}

const ROLES = ['seniorSoftwareEngineer', 'hrRecruiter', 'marketing'] as const;
const PERKS = [
  { icon: Globe2, key: 'remoteFirst' },
  { icon: Scale, key: 'fairByDesign' },
  { icon: Heart, key: 'realOwnership' },
  { icon: Sparkles, key: 'openSource' },
] as const;

export default async function CareersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'careers' });

  return (
    <div className="container max-w-4xl py-16">
      <div className="text-center">
        <Badge variant="secondary" className="mb-4">{t('hiringBadge')}</Badge>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t('title')}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{t('intro')}</p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PERKS.map((p) => (
          <Card key={p.key}>
            <CardHeader className="pb-2">
              <p.icon className="size-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{t(`perks.${p.key}.title`)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t(`perks.${p.key}.desc`)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-16">
        <h2 className="text-2xl font-bold">{t('openRoles')}</h2>
        <p className="mt-1 text-muted-foreground">{t('positionsNote', { count: ROLES.length })}</p>

        <div className="mt-6 grid gap-4">
          {ROLES.map((role) => (
            <Card key={role} className="transition-colors hover:border-primary">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">{t(`roles.${role}.title`)}</CardTitle>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <Badge variant="outline">{t(`roles.${role}.team`)}</Badge>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-4" /> {t(`roles.${role}.location`)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-4" /> {t(`roles.${role}.type`)}
                      </span>
                    </div>
                  </div>
                  <Button asChild>
                    <a
                      href={`mailto:careers@freelancezero.com?subject=${encodeURIComponent(
                        t(`roles.${role}.mailSubject`),
                      )}`}
                    >
                      {t('apply')}
                    </a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{t(`roles.${role}.blurb`)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-16 rounded-xl border bg-muted/30 p-8 text-center">
        <h2 className="text-xl font-semibold">{t('noRoleTitle')}</h2>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">{t('noRoleBody')}</p>
        <Button asChild className="mt-4">
          <a href="mailto:careers@freelancezero.com">{t('getInTouch')}</a>
        </Button>
      </div>
    </div>
  );
}
