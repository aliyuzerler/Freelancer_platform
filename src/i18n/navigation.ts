import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

const nav = createNavigation(routing);

/**
 * Locale-aware navigation APIs. Always import `Link`, `usePathname` and
 * `useRouter` from here inside the app (NOT from next/link or
 * next/navigation) so every internal URL is automatically prefixed with the
 * active locale.
 */
export const { Link, usePathname, useRouter, getPathname } = nav;

/**
 * `redirect` wrapper that is explicitly typed to return `never`.
 *
 * next-intl's own redirect throws at runtime, but depending on which type
 * variant TypeScript resolves, its return type is not always `never` — which
 * defeats control-flow narrowing after auth guards
 * (`if (!session?.user) redirect(...)`). Wrapping it with an explicit `never`
 * return restores narrowing in every server page without touching call sites.
 */
export function redirect(
  args: { href: string; locale: string; forcePrefix?: boolean },
  type?: Parameters<typeof nav.redirect>[1],
): never {
  nav.redirect(args as never, type);
  // Unreachable at runtime — next-intl's redirect always throws.
  throw new Error('redirect: unreachable');
}
