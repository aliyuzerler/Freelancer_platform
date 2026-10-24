import { BookOpen, Clock, Languages } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { POSTS, formatPostDate } from '@/lib/blog';
import { pageMetadata } from '@/lib/seo';
import { Link } from '@/i18n/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog.meta' });
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: '/blog',
    locale,
    keywords: (t.raw('keywords') as string[]) ?? [],
  });
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });

  const [featured, ...rest] = POSTS;

  return (
    <div className="container max-w-5xl py-16">
      <div className="flex items-center gap-3">
        <BookOpen className="size-6 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
      </div>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{t('intro')}</p>

      {locale !== 'en' ? (
        <p className="mt-4 inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-muted-foreground">
          <Languages className="size-4 shrink-0 text-amber-600" /> {t('translationNote')}
        </p>
      ) : null}

      {featured ? (
        <Link href={`/blog/${featured.slug}`} className="mt-10 block">
          <Card className="transition-colors hover:border-primary">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge>{t(`categories.${featured.category}` as never)}</Badge>
                <span>{formatPostDate(featured.date, locale)}</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" /> {t('minRead', { minutes: featured.readingMinutes })}
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
                  <Badge variant="outline">{t(`categories.${post.category}` as never)}</Badge>
                  <span>{formatPostDate(post.date, locale)}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" /> {t('minShort', { minutes: post.readingMinutes })}
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
