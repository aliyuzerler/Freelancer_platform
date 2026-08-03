import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const TABS = [
  { href: '/admin/approvals', label: 'Approvals' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/jobs', label: 'Postings' },
];

/** Admin shell. Guards every /admin route in one place. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login?next=/admin/approvals');
  if (session.user.role !== 'ADMIN') notFound();

  return (
    <div className="container max-w-5xl py-10">
      <div className="mb-6 flex items-center gap-3">
        <ShieldCheck className="size-6 text-primary" />
        <h1 className="text-2xl font-bold">Admin</h1>
      </div>
      <nav className="mb-8 flex flex-wrap gap-1 border-b">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-t-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
