import type { ReactNode } from 'react';

/**
 * Root pass-through layout. The real <html> shell lives in
 * app/[locale]/layout.tsx so the `lang` attribute always matches the routed
 * locale. Nothing user-facing is rendered here.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
