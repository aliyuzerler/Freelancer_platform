import type { ReactNode } from 'react';

/** Shared shell for the Privacy / Terms / Security documents. */
export function LegalPage({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="container max-w-3xl py-16">
      <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
      <p className="mt-3 text-lg text-muted-foreground">{intro}</p>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>
      <div className="mt-10 space-y-8">{children}</div>
    </div>
  );
}

/** A titled section of a legal document. */
export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold">{heading}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

/** Bulleted list with consistent styling. */
export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
