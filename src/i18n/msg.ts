'use client';

import { useTranslations } from 'next-intl';

/**
 * Client-side resolver for machine-readable message keys that travel through
 * non-UI channels (API error bodies, zod field errors).
 *
 * The server never hardcodes display language in API responses: it returns
 * stable keys like `errors.authRequired` or `val.emailInvalid`, and the client
 * resolves them through the same message catalogs as the rest of the UI.
 * Anything that is not a known key (e.g. free-form server text) passes
 * through untouched, so nothing can ever render as a broken translation.
 */
const KEY_PATTERN = /^(errors|val)\./;

export function isMessageKey(value?: string | null): boolean {
  return KEY_PATTERN.test(value ?? '');
}

/**
 * Returns a resolver that maps `errors.*` / `val.*` keys to localized strings
 * and passes everything else through. Usage in a client component:
 *
 *   const m = useMessageResolver();
 *   m(body?.error?.message, 'Could not save')  // API error key or fallback
 *   m(errors.firstName?.message)               // zod message key
 */
export function useMessageResolver() {
  // Root-scope translator: `errors.*` / `val.*` are top-level namespaces in
  // the message catalogs. (useMessages() returns an OBJECT, not a callable —
  // calling it as one crashed the whole React tree on the first field error.)
  const t = useTranslations();

  return (value: string | null | undefined, fallback?: string): string => {
    if (isMessageKey(value)) {
      try {
        return t(value as Parameters<typeof t>[0]);
      } catch {
        // Missing catalog entry must never crash a form — degrade to fallback.
        return fallback ?? value ?? '';
      }
    }
    return value ?? fallback ?? '';
  };
}
