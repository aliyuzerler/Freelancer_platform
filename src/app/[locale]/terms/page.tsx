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
  const t = await getTranslations({ locale, namespace: 'legal.terms.meta' });
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: '/terms',
    locale,
    keywords: (t.raw('keywords') as string[]) ?? [],
  });
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal.terms' });

  return (
    <LegalPage title={t('title')} intro={t('intro')} updated={t('updated')}>
      <Section heading={t('agreement.title')}>
        <p>{t('agreement.body')}</p>
      </Section>

      <Section heading={t('whatIs.title')}>
        <p>{t.rich('whatIs.body', { strong: (chunks) => <strong>{chunks}</strong> })}</p>
        <p>{t('whatIs.nonCustodial')}</p>
      </Section>

      <Section heading={t('eligibility.title')}>
        <Bullets items={t.raw('eligibility.items') as string[]} />
      </Section>

      <Section heading={t('acceptableUse.title')}>
        <p>{t('acceptableUse.intro')}</p>
        <Bullets items={t.raw('acceptableUse.items') as string[]} />
        <p>{t('acceptableUse.outro')}</p>
      </Section>

      <Section heading={t('contracts.title')}>
        <p>{t('contracts.body')}</p>
      </Section>

      <Section heading={t('payments.title')}>
        <p>{t('payments.body')}</p>
      </Section>

      <Section heading={t('content.title')}>
        <p>{t('content.body')}</p>
      </Section>

      <Section heading={t('disclaimers.title')}>
        <p>{t('disclaimers.body')}</p>
      </Section>

      <Section heading={t('liability.title')}>
        <p>{t('liability.body')}</p>
      </Section>

      <Section heading={t('termination.title')}>
        <p>{t('termination.body')}</p>
      </Section>

      <Section heading={t('openSource.title')}>
        <p>{t('openSource.body')}</p>
      </Section>

      <Section heading={t('changes.title')}>
        <p>
          {t.rich('changes.body', {
            mailto: 'legal@freelancezero.com',
            privacyLink: (chunks) => (
              <LocaleLink className="text-primary hover:underline" href="/privacy">
                {chunks}
              </LocaleLink>
            ),
          })}
        </p>
      </Section>
    </LegalPage>
  );
}
