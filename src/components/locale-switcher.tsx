'use client';

import { Globe } from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { LOCALE_LABELS, routing, type Locale } from '@/i18n/routing';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

/**
 * Language switcher. Swaps the locale while preserving the current path;
 * next-intl persists the choice in the NEXT_LOCALE cookie, so the preference
 * survives reloads and is honored by edge middleware and API responses alike.
 * New languages become available automatically as they are added to routing.
 */
export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: string) {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground outline-none ring-ring transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2"
        aria-label="Dil seçimi / Language"
      >
        <Globe className="size-4" />
        <span>{LOCALE_LABELS[locale as Locale] ?? locale.toUpperCase()}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {routing.locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onSelect={() => switchTo(l)}
            className={l === locale ? 'font-semibold text-primary' : undefined}
          >
            {LOCALE_LABELS[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
