import { ShieldCheck } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Link, redirect } from '@/i18n/navigation';

export const dynamic = 'force-dynamic';

const TABS = [
  { href: '/admin/approvals', key: 'tabApprovals' },
  { href: '/admin/users', key: 'tabUsers' },
  { href: '/admin/jobs', key: 'tabJobs' },
] as const;

/** Admin shell. Guards every /admin route in one place. */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });

  const session = await auth();
  if (!session?.user) redirect({ href: '/login?next=/admin/approvals', locale });
  if (session.user.role !== 'ADMIN') notFound();

  return (
    <div className="container max-w-5xl py-10">
      <div className="mb-6 flex items-center gap-3">
        <ShieldCheck className="size-6 text-primary" />
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>
      <nav className="mb-8 flex flex-wrap gap-1 border-b">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="rounded-t-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {t(tab.key)}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
