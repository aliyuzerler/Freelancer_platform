import { getTranslations } from 'next-intl/server';
import { LegalPage, Section, Bullets } from '@/components/legal-page';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal.security.meta' });
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: '/security',
    locale,
    keywords: (t.raw('keywords') as string[]) ?? [],
  });
}

export default async function SecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal.security' });

  return (
    <LegalPage title={t('title')} intro={t('intro')} updated={t('updated')}>
      <Section heading={t('account.title')}>
        <Bullets items={t.raw('account.items') as string[]} />
      </Section>

      <Section heading={t('data.title')}>
        <Bullets items={t.raw('data.items') as string[]} />
      </Section>

      <Section heading={t('payments.title')}>
        <p>{t('payments.body')}</p>
      </Section>

      <Section heading={t('safety.title')}>
        <Bullets items={t.raw('safety.items') as string[]} />
      </Section>

      <Section heading={t('disclosure.title')}>
        <p>
          {t.rich('disclosure.body', {
            mailto: 'security@freelancezero.com',
            code: (chunks) => (
              <a className="text-primary hover:underline" href={`mailto:${chunks}`}>
                {chunks}
              </a>
            ),
          })}
        </p>
        <p>{t('disclosure.outro')}</p>
      </Section>

      <Section heading={t('selfHosting.title')}>
        <p>
          {t.rich('selfHosting.body', {
            code: (chunks) => <code className="rounded bg-muted px-1">{chunks}</code>,
          })}
        </p>
      </Section>
    </LegalPage>
  );
}
