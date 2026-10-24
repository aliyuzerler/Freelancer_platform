import type { MetadataRoute } from 'next';
import { SITE, localeUrl } from '@/lib/seo';
import { routing } from '@/i18n/routing';
import { POSTS } from '@/lib/blog';
import { db } from '@/lib/db';

// Regenerate hourly — fresh job/talent URLs matter for crawl freshness.
export const revalidate = 3600;

/**
 * Dynamic sitemap. Static marketing/SEO routes are always included; open jobs
 * are appended from the DB when reachable (wrapped so a build without a database
 * still succeeds).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE.url, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE.url}/jobs`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE.url}/blog`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE.url}/careers`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE.url}/status`, changeFrequency: 'daily', priority: 0.3 },
    { url: `${SITE.url}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE.url}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE.url}/security`, changeFrequency: 'yearly', priority: 0.4 },
  ];

  // Every article is a static, indexable landing page.
  const postRoutes: MetadataRoute.Sitemap = POSTS.map((p) => ({
    url: `${SITE.url}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  let jobRoutes: MetadataRoute.Sitemap = [];
  try {
    const jobs = await db.job.findMany({
      where: { status: 'OPEN', deletedAt: null, visibility: 'public' },
      select: { slug: true, updatedAt: true },
      take: 5000,
      orderBy: { publishedAt: 'desc' },
    });
    jobRoutes = jobs.flatMap((j) =>
      routing.locales.map((locale) => ({
        url: localeUrl(locale, `/jobs/${j.slug}`),
        lastModified: j.updatedAt,
        changeFrequency: 'daily' as const,
        priority: 0.6,
      })),
    );
  } catch {
    // No DB at build time — ship the static sitemap.
  }

  // Freelancer profiles that opted into public indexing.
  let profileRoutes: MetadataRoute.Sitemap = [];
  try {
    const profiles = await db.freelancerProfile.findMany({
      where: {
        headline: { not: null },
        user: { status: 'ACTIVE', deletedAt: null, indexProfile: true },
      },
      select: { id: true, updatedAt: true },
      take: 5000,
      orderBy: { ratingAvg: 'desc' },
    });
    profileRoutes = profiles.flatMap((prof) =>
      routing.locales.map((locale) => ({
        url: localeUrl(locale, `/freelancers/${prof.id}`),
        lastModified: prof.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })),
    );
  } catch {
    // No DB at build time — ship without profiles.
  }

  return [...staticRoutes, ...postRoutes, ...jobRoutes, ...profileRoutes];
}
