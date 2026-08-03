import Link from 'next/link';
import { BookOpen, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { POSTS, formatPostDate } from '@/lib/blog';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Freelancing Guides, Fee Breakdowns & Platform Comparisons',
  description:
    'Practical guides on freelance rates, platform fees, contracts, and getting paid — written for freelancers who want to keep what they earn.',
  path: '/blog',
  keywords: ['freelance blog', 'freelancing guides', 'freelance advice', 'freelance tips 2026'],
});

export default function BlogPage() {
  const [featured, ...rest] = POSTS;

  return (
    <div className="container max-w-5xl py-16">
      <div className="flex items-center gap-3">
        <BookOpen className="size-6 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight">Resources</h1>
      </div>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Guides on rates, fees, contracts, and getting paid — written for freelancers who want to
        keep 100% of what they earn.
      </p>

      {featured ? (
        <Link href={`/blog/${featured.slug}`} className="mt-10 block">
          <Card className="transition-colors hover:border-primary">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge>{featured.category}</Badge>
                <span>{formatPostDate(featured.date)}</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" /> {featured.readingMinutes} min read
                </span>
              </div>
              <CardTitle className="mt-2 text-2xl">{featured.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{featured.excerpt}</p>
            </CardContent>
          </Card>
        </Link>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {rest.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="block">
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{post.category}</Badge>
                  <span>{formatPostDate(post.date)}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" /> {post.readingMinutes} min
                  </span>
                </div>
                <CardTitle className="mt-2 text-lg leading-snug">{post.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{post.excerpt}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
