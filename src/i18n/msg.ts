'use client';

import { useMessages } from 'next-intl';

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
  const messages = useMessages();

  return (value: string | null | undefined, fallback?: string): string => {
    if (isMessageKey(value)) {
      return (messages as unknown as (key: string) => string)(value as string);
    }
    return value ?? fallback ?? '';
  };
}
