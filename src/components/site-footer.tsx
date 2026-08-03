import Link from 'next/link';
// Re-enable alongside the social links block below when the accounts are live.
// import { Github, Twitter, Linkedin } from 'lucide-react';
import { Logo } from '@/components/logo';

const COLUMNS = [
  {
    title: 'For freelancers',
    links: [
      { label: 'Find work', href: '/jobs' },
      { label: 'Create a profile', href: '/register?role=freelancer' },
      { label: 'How you get paid', href: '/#how' },
      { label: 'Freelancer stories', href: '/blog' },
    ],
  },
  {
    title: 'For clients',
    links: [
      { label: 'Post a job', href: '/register?role=client' },
      { label: 'Enterprise', href: '/#pricing' },
      { label: 'Trust & safety', href: '/#trust' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/blog' },
      { label: 'Pricing', href: '/#pricing' },
      { label: 'Blog & resources', href: '/blog' },
      { label: 'Careers', href: '/careers' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Help center', href: '/blog' },
      { label: 'Community', href: '/blog' },
      { label: 'Open source', href: 'https://github.com/freelancezero/freelancezero' },
      { label: 'Status', href: '/status' },
    ],
  },
];

/** Full, professional footer — the kind serious marketplaces ship. */
export function SiteFooter() {
  return (
    <footer className="border-t border-navy-700/40 bg-navy-950 text-navy-300">
      <div className="container grid gap-12 py-16 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="max-w-xs">
          <Link href="/" aria-label="Freelancezero home">
            <Logo className="text-white" />
          </Link>
          <p className="mt-4 text-sm leading-relaxed">
            The fair freelance marketplace. Keep 100% of what you earn — no commissions, ever.
          </p>
          {/* Social links hidden until the accounts are live.
          <div className="mt-6 flex gap-3">
            {[Twitter, Github, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid size-9 place-items-center rounded-lg border border-navy-700 text-navy-300 transition-colors hover:border-primary hover:text-white"
                aria-label="Social link"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
          */}
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold text-white">{col.title}</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-navy-800">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 text-xs text-navy-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Freelancezero. Built for freelancers, not shareholders.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/security" className="hover:text-white">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
