import { getTranslations } from 'next-intl/server';
import { LegalPage, Section, Bullets } from '@/components/legal-page';
import { pageMetadata } from '@/lib/seo';
import { Link as LocaleLink } from '@/i18n/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal.privacy.meta' });
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: '/privacy',
    locale,
    keywords: (t.raw('keywords') as string[]) ?? [],
  });
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal.privacy' });

  return (
    <LegalPage title={t('title')} intro={t('intro')} updated={t('updated')}>
      <Section heading={t('whoWeAre.title')}>
        <p>{t('whoWeAre.body')}</p>
      </Section>

      <Section heading={t('whatWeCollect.title')}>
        <Bullets items={t.raw('whatWeCollect.items') as string[]} />
      </Section>

      <Section heading={t('howWeUse.title')}>
        <Bullets items={t.raw('howWeUse.items') as string[]} />
        <p>{t('howWeUseNote')}</p>
      </Section>

      <Section heading={t('legalBases.title')}>
        <p>{t('legalBases.body')}</p>
      </Section>

      <Section heading={t('sharing.title')}>
        <p>{t('sharing.body')}</p>
      </Section>

      <Section heading={t('retention.title')}>
        <p>{t('retention.body')}</p>
      </Section>

      <Section heading={t('yourRights.title')}>
        <Bullets items={t.raw('yourRights.items') as string[]} />
        <p>{t.rich('yourRightsNote', { mailto: 'privacy@freelancezero.com' })}</p>
      </Section>

      <Section heading={t('cookies.title')}>
        <p>{t('cookies.body')}</p>
      </Section>

      <Section heading={t('changes.title')}>
        <p>
          {t.rich('changes.body', {
            termsLink: (chunks) => (
              <LocaleLink className="text-primary hover:underline" href="/terms">
                {chunks}
              </LocaleLink>
            ),
            securityLink: (chunks) => (
              <LocaleLink className="text-primary hover:underline" href="/security">
                {chunks}
              </LocaleLink>
            ),
          })}
        </p>
      </Section>
    </LegalPage>
  );
}
