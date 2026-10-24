import { getTranslations } from 'next-intl/server';
import { Logo } from '@/components/logo';
import { Link } from '@/i18n/navigation';

// Re-enable alongside the social links block below when the accounts are live.
// import { Github, Twitter, Linkedin } from 'lucide-react';

interface FooterLink {
  key: string;
  href: string;
  external?: boolean;
}

const COLUMNS: { titleKey: string; links: FooterLink[] }[] = [
  {
    titleKey: 'freelancers.title',
    links: [
      { key: 'freelancers.findWork', href: '/jobs' },
      { key: 'freelancers.createProfile', href: '/register?role=freelancer' },
      { key: 'freelancers.howPaid', href: '/#how' },
      { key: 'freelancers.stories', href: '/blog' },
    ],
  },
  {
    titleKey: 'clients.title',
    links: [
      { key: 'clients.postJob', href: '/register?role=client' },
      { key: 'clients.enterprise', href: '/#pricing' },
      { key: 'clients.trust', href: '/#trust' },
    ],
  },
  {
    titleKey: 'company.title',
    links: [
      { key: 'company.about', href: '/blog' },
      { key: 'company.pricing', href: '/#pricing' },
      { key: 'company.blog', href: '/blog' },
      { key: 'company.careers', href: '/careers' },
    ],
  },
  {
    titleKey: 'resources.title',
    links: [
      { key: 'resources.help', href: '/blog' },
      { key: 'resources.community', href: '/blog' },
      { key: 'resources.openSource', href: 'https://github.com/freelancezero/freelancezero', external: true },
      { key: 'resources.status', href: '/status' },
    ],
  },
];

/** Full, professional footer — the kind serious marketplaces ship. */
export async function SiteFooter() {
  const t = await getTranslations('footer');

  return (
    <footer className="border-t border-navy-700/40 bg-navy-950 text-navy-300">
      <div className="container grid gap-12 py-16 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="max-w-xs">
          <Link href="/" aria-label="Freelancezero">
            <Logo className="text-white" />
          </Link>
          <p className="mt-4 text-sm leading-relaxed">{t('description')}</p>
          {/* Social links hidden until the accounts are live. */}
        </div>

        {COLUMNS.map((col) => (
          <div key={col.titleKey}>
            <h3 className="text-sm font-semibold text-white">{t(col.titleKey as never)}</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {col.links.map((link) => (
                <li key={link.key}>
                  {link.external ? (
                    <a href={link.href} className="transition-colors hover:text-white">
                      {t(link.key as never)}
                    </a>
                  ) : (
                    <Link href={link.href} className="transition-colors hover:text-white">
                      {t(link.key as never)}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-navy-800">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 text-xs text-navy-400 sm:flex-row">
          <p>{t('copyright', { year: new Date().getFullYear() })}</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white">{t('privacy')}</Link>
            <Link href="/terms" className="hover:text-white">{t('terms')}</Link>
            <Link href="/security" className="hover:text-white">{t('security')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
