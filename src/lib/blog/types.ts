/**
 * Blog post model. Posts are plain data (no CMS, no MDX pipeline) so the blog
 * ships with zero new dependencies and stays statically rendered.
 *
 * `body` is a tiny markdown subset rendered by components/blog-body.tsx:
 *   ## Heading      -> section heading
 *   ### Subheading  -> sub heading
 *   - item          -> bullet list
 *   1. item         -> numbered list
 *   > quote         -> callout
 *   | a | b |       -> table (first row is the header, --- separator ignored)
 *   plain line      -> paragraph
 * Inline: **bold**, [text](url), `code`.
 */
export type Post = {
  slug: string;
  title: string;
  /** Meta description + card excerpt. Keep near 155 characters. */
  excerpt: string;
  /** ISO date (YYYY-MM-DD). Drives ordering and the article schema. */
  date: string;
  author: string;
  category: 'Guides' | 'Comparisons' | 'Money' | 'Growth' | 'Product';
  /** Target search terms for this post. */
  keywords: string[];
  readingMinutes: number;
  body: string;
};
