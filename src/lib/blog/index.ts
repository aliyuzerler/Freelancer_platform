import type { Post } from './types';
import { POSTS_H1 } from './posts-h1';
import { POSTS_H2 } from './posts-h2';

export type { Post } from './types';

/** All posts, newest first. */
export const POSTS: Post[] = [...POSTS_H1, ...POSTS_H2].sort((a, b) =>
  b.date.localeCompare(a.date),
);

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

/** Up to `limit` other posts, preferring the same category. */
export function getRelated(slug: string, limit = 3): Post[] {
  const post = getPost(slug);
  if (!post) return [];
  const others = POSTS.filter((p) => p.slug !== slug);
  const sameCategory = others.filter((p) => p.category === post.category);
  return [...sameCategory, ...others.filter((p) => p.category !== post.category)].slice(0, limit);
}

/** "5 Ocak 2026" / "January 5, 2026" — stable across timezones (date-only). */
export function formatPostDate(iso: string, locale = 'tr'): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
