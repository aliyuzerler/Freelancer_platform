import type { MetadataRoute } from 'next';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { SITE } from '@/lib/seo';
import { routing } from '@/i18n/routing';

/** PWA manifest — installable, mobile-first (many freelancers work from phones). */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const cookieLocale = (await cookies()).get('NEXT_LOCALE')?.value;
  const locale =
    cookieLocale && routing.locales.includes(cookieLocale as never)
      ? cookieLocale
      : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'site' });
  return {
    name: `${SITE.name} — ${t('tagline')}`,
    short_name: SITE.name,
    description: t('description'),
    start_url: '/',
    display: 'standalone',
    background_color: '#060A14',
    theme_color: '#2e5bf0',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
