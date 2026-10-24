import type { Metadata, Viewport } from 'next';
import { Inter, Sora } from 'next/font/google';
import { getMessages, getTranslations } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import '../globals.css';
import { Providers } from './providers';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PayoutBanner } from '@/components/payout-banner';
import { SITE, organizationJsonLd, websiteJsonLd, jsonLdScript, languagesAlternates } from '@/lib/seo';
import { intlTag } from '@/i18n/routing';

// Body: Inter (workhorse, superb legibility). Display: Sora (geometric, confident).
// latin-ext is required for Turkish glyphs (ğ, ş, İ, ı) — without it those
// characters silently fall back to a system font.
const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-sans', display: 'swap' });
const sora = Sora({ subsets: ['latin', 'latin-ext'], variable: '--font-display', display: 'swap' });

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'site' });

  return {
    metadataBase: new URL(SITE.url),
    title: {
      default: `${SITE.name} — ${t('tagline')}`,
      template: `%s · ${SITE.name}`,
    },
    description: t('description'),
    keywords: t.raw('keywords') as string[],
    applicationName: SITE.name,
    alternates: {
      canonical: `${SITE.url}/${locale}`,
      languages: languagesAlternates('/'),
    },
    openGraph: {
      type: 'website',
      url: `${SITE.url}/${locale}`,
      siteName: SITE.name,
      title: `${SITE.name} — ${t('tagline')}`,
      description: t('description'),
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE.twitter,
      title: `${SITE.name} — ${t('tagline')}`,
      description: t('description'),
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: 'site' });

  return (
    <html lang={intlTag(locale)}>
      <head>
        {/* Site-wide structured data for rich results and sitelinks search box. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(organizationJsonLd(t('description')))}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(websiteJsonLd())} />
      </head>
      <body className={`${inter.variable} ${sora.variable} font-sans`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <PayoutBanner />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
