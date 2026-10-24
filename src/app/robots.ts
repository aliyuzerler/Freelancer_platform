import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo';
import { routing } from '@/i18n/routing';

/** Generated at /robots.txt. Public marketplace indexable; private app blocked. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // FZ-23: all private app surfaces, not just the obvious ones.
        // FZ-23: all private app surfaces under every locale prefix.
        disallow: routing.locales.flatMap((locale) => [
          `/${locale}/dashboard`,
          `/${locale}/settings`,
          `/${locale}/admin`,
          `/${locale}/onboarding`,
          `/${locale}/messages`,
          `/${locale}/verify`,
          `/${locale}/login`,
          `/${locale}/register`,
          '/api/',
        ]),
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
