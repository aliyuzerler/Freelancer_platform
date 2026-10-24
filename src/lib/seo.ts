import type { Metadata } from 'next';
import { routing, intlTag } from '@/i18n/routing';

/**
 * Centralized SEO. One place controls titles, descriptions, canonical URLs,
 * Open Graph, Twitter cards, and structured data (JSON-LD). Every page should
 * build its metadata from here so we stay consistent and keyword-disciplined.
 *
 * Localized copy (tagline, description, keywords) lives in the message
 * catalogs under the `site` namespace so each language gets tuned metadata.
 *
 * Primary target keywords (tr): "Upwork alternatifi", "komisyonsuz freelance",
 * "sıfır komisyon freelance platformu", "freelance iş ilanları".
 */

export const SITE = {
  name: 'Freelancezero',
  // FZ-24: the fallback is intentionally localhost, not the hosted site. A
  // self-host operator who forgets NEXT_PUBLIC_APP_URL would otherwise emit
  // canonical/sitemap URLs pointing at someone else's production domain.
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  twitter: '@freelancezero',
} as const;

interface PageMetaInput {
  /** Page title — already localized by the caller. */
  title: string;
  description?: string;
  /** Locale-unprefixed path, e.g. '/jobs'. */
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
  /** Active locale; drives the canonical prefix and hreflang alternates. */
  locale?: string;
}

/** Canonical URL for a locale-prefixed path. */
export function localeUrl(locale: string, path = '/'): string {
  const suffix = path === '/' ? '' : path;
  return new URL(`/${locale}${suffix}`, SITE.url).toString();
}

/** hreflang map (tr-TR/en-US → locale-prefixed URL) for a locale-free path. */
export function languagesAlternates(path = '/'): Record<string, string> {
  const map: Record<string, string> = {};
  for (const locale of routing.locales) {
    map[intlTag(locale)] = localeUrl(locale, path);
  }
  return map;
}

/** Build a full Metadata object for a page with canonical + social tags. */
export function pageMetadata({
  title,
  description,
  path = '/',
  keywords = [],
  noIndex = false,
  locale,
}: PageMetaInput): Metadata {
  const active = locale ?? routing.defaultLocale;
  const url = localeUrl(active, path);
  return {
    title,
    description,
    keywords,
    alternates: { canonical: url, languages: languagesAlternates(path) },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: 'website',
      url,
      siteName: SITE.name,
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE.twitter,
      title,
      description,
    },
  };
}

/* --------------------------------------------------------------------------
 * JSON-LD structured data. Rendered as <script type="application/ld+json">.
 * Rich results (FAQ, org sitelinks, breadcrumbs) are a major organic-CTR lever.
 * -------------------------------------------------------------------------- */

export function organizationJsonLd(description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    description,
    sameAs: [
      'https://twitter.com/freelancezero',
      'https://github.com/freelancezero/freelancezero',
      'https://www.linkedin.com/company/freelancezero',
    ],
  };
}

/** WebSite + Sitelinks Search Box, so Google can surface an in-site search box. */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE.url}/tr/jobs?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

/** Serialize JSON-LD safely for embedding in a <script> tag. */
export function jsonLdScript(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') };
}
