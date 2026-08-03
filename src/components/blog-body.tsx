import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Minimal markdown renderer for blog bodies. Deliberately supports only the
 * subset the posts use (see lib/blog/types.ts) — no dependency, no HTML
 * injection, and every element gets the site's own styling.
 */

/** Inline: **bold**, [text](href), `code`. */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|`[^`]+`)/g;
  const parts = text.split(pattern).filter(Boolean);

  parts.forEach((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('**') && part.endsWith('**')) {
      nodes.push(
        <strong key={key} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>,
      );
      return;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      nodes.push(
        <code key={key} className="rounded bg-muted px-1 py-0.5 text-[0.9em]">
          {part.slice(1, -1)}
        </code>,
      );
      return;
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const [, label, href] = link;
      const internal = href!.startsWith('/');
      nodes.push(
        internal ? (
          <Link key={key} href={href!} className="text-primary hover:underline">
            {label}
          </Link>
        ) : (
          <a
            key={key}
            href={href!}
            className="text-primary hover:underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            {label}
          </a>
        ),
      );
      return;
    }
    nodes.push(part);
  });

  return nodes;
}

type Block =
  | { kind: 'h2' | 'h3' | 'p' | 'quote'; text: string }
  | { kind: 'ul' | 'ol'; items: string[] }
  | { kind: 'table'; head: string[]; rows: string[][] };

const cells = (row: string) =>
  row
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim());

/** Group raw lines into renderable blocks. */
function parse(body: string): Block[] {
  const lines = body.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!.trim();

    if (!line) {
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      blocks.push({ kind: 'h3', text: line.slice(4) });
      i++;
    } else if (line.startsWith('## ')) {
      blocks.push({ kind: 'h2', text: line.slice(3) });
      i++;
    } else if (line.startsWith('> ')) {
      const parts: string[] = [];
      while (i < lines.length && lines[i]!.trim().startsWith('> ')) {
        parts.push(lines[i]!.trim().slice(2));
        i++;
      }
      blocks.push({ kind: 'quote', text: parts.join(' ') });
    } else if (line.startsWith('| ')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i]!.trim().startsWith('| ')) {
        const raw = lines[i]!.trim();
        // Skip the |---|---| separator row.
        if (!/^\|[\s|:-]+\|$/.test(raw)) rows.push(cells(raw));
        i++;
      }
      if (rows.length) blocks.push({ kind: 'table', head: rows[0]!, rows: rows.slice(1) });
    } else if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i]!.trim())) {
        items.push(lines[i]!.trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      blocks.push({ kind: 'ol', items });
    } else if (line.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i]!.trim().startsWith('- ')) {
        items.push(lines[i]!.trim().slice(2));
        i++;
      }
      blocks.push({ kind: 'ul', items });
    } else {
      blocks.push({ kind: 'p', text: line });
      i++;
    }
  }

  return blocks;
}

export function BlogBody({ body }: { body: string }) {
  const blocks = parse(body);

  return (
    <div className="space-y-5 leading-relaxed text-muted-foreground">
      {blocks.map((block, i) => {
        const key = `b-${i}`;
        switch (block.kind) {
          case 'h2':
            return (
              <h2 key={key} className="pt-4 text-2xl font-bold text-foreground">
                {inline(block.text, key)}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={key} className="pt-2 text-lg font-semibold text-foreground">
                {inline(block.text, key)}
              </h3>
            );
          case 'quote':
            return (
              <blockquote
                key={key}
                className="border-l-4 border-primary/40 bg-muted/40 py-3 pl-5 pr-4 text-foreground"
              >
                {inline(block.text, key)}
              </blockquote>
            );
          case 'ul':
            return (
              <ul key={key} className="list-disc space-y-2 pl-6">
                {block.items.map((item, j) => (
                  <li key={`${key}-${j}`}>{inline(item, `${key}-${j}`)}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={key} className="list-decimal space-y-2 pl-6">
                {block.items.map((item, j) => (
                  <li key={`${key}-${j}`}>{inline(item, `${key}-${j}`)}</li>
                ))}
              </ol>
            );
          case 'table':
            return (
              <div key={key} className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      {block.head.map((h, j) => (
                        <th key={`${key}-h-${j}`} className="p-2 text-left font-semibold text-foreground">
                          {inline(h, `${key}-h-${j}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, j) => (
                      <tr key={`${key}-r-${j}`} className="border-b border-border/50">
                        {row.map((c, k) => (
                          <td key={`${key}-r-${j}-${k}`} className="p-2 align-top">
                            {inline(c, `${key}-r-${j}-${k}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default:
            return <p key={key}>{inline(block.text, key)}</p>;
        }
      })}
    </div>
  );
}
