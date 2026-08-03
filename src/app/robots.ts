import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo';

/** Generated at /robots.txt. Public marketplace indexable; private app blocked. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/api/', '/login', '/register'],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
