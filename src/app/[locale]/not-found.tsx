import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

export default async function NotFound() {
  const t = await getTranslations('notFound');

  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="max-w-md text-muted-foreground">{t('body')}</p>
      <Button asChild>
        <Link href="/">{t('cta')}</Link>
      </Button>
    </div>
  );
}
