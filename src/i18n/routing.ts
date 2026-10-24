import { defineRouting } from 'next-intl/routing';

/**
 * Single source of truth for the supported locales.
 *
 * Adding a new language later takes three steps:
 *   1. Add its code here (e.g. `locales: ['tr', 'en', 'de']`).
 *   2. Drop a `messages/de.json` file next to the existing catalogs.
 *   3. Add the human-readable name to `LOCALE_LABELS` below.
 * No component code needs to change — every string is resolved through the
 * message catalogs and the routing prefix is derived from this list.
 */
export const routing = defineRouting({
  locales: ['tr', 'en'],
  defaultLocale: 'tr',
  // Always show the locale in the URL (/tr/jobs, /en/jobs). This keeps every
  // language independently indexable by search engines and makes hreflang
  // alternates unambiguous. The default locale is NOT hidden, so self-hosted
  // deployments never serve two URLs for the same content.
  localePrefix: 'always',
  // Remember the visitor's choice in a cookie; first visit falls back to the
  // Accept-Language header, then to `defaultLocale`.
  localeCookie: { name: 'NEXT_LOCALE', maxAge: 60 * 60 * 24 * 365 },
});

export type Locale = (typeof routing.locales)[number];

/** Human-readable names shown in the language switcher. */
export const LOCALE_LABELS: Record<Locale, string> = {
  tr: 'Türkçe',
  en: 'English',
};

/** BCP-47 tags used for <html lang> and Intl formatting. */
export const LOCALE_TAGS: Record<Locale, string> = {
  tr: 'tr-TR',
  en: 'en-US',
};

export function intlTag(locale: string): string {
  return LOCALE_TAGS[locale as Locale] ?? LOCALE_TAGS[routing.defaultLocale];
}
