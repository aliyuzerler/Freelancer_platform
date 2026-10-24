import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  Wallet,
  Star,
  Search,
  TrendingUp,
  CheckCircle2,
  Circle,
} from 'lucide-react';

/**
 * High-fidelity product mockups rendered as real markup (not images). They
 * carry the "this is a polished, shipping product" signal on the marketing page
 * and stay crisp on any display. All are static server components.
 */

function BrowserFrame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-float ring-1 ring-black/5">
      <div className="flex items-center gap-2 border-b border-black/5 bg-slate-50 px-4 py-2.5">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
        <div className="mx-auto flex items-center gap-2 rounded-md bg-white px-3 py-1 text-xs text-slate-400 ring-1 ring-black/5">
          <span className="size-2 rounded-full bg-brand-500" />
          {url}
        </div>
      </div>
      {children}
    </div>
  );
}

const SIDEBAR = [
  { icon: LayoutDashboard, key: 'nav.dashboard', active: true },
  { icon: Briefcase, key: 'nav.contracts' },
  { icon: MessageSquare, key: 'nav.messages' },
  { icon: Wallet, key: 'nav.payments' },
];

/** The hero "money shot": a freelancer earnings dashboard. */
export function DashboardMockup() {
  const t = useTranslations('home.mockups');
  return (
    <BrowserFrame url="freelancezero.com/dashboard">
      <div className="flex bg-white text-slate-900">
        {/* Sidebar */}
        <aside className="hidden w-44 shrink-0 flex-col gap-1 border-r border-black/5 bg-slate-50/80 p-3 sm:flex">
          <div className="mb-3 flex items-center gap-2 px-2 py-1 text-sm font-bold">
            <span className="grid size-6 place-items-center rounded-md bg-primary text-white">Fz</span>
            Freelancezero
          </div>
          {SIDEBAR.map((item) => (
            <div
              key={t(item.key as never)}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${
                item.active ? 'bg-primary/10 font-medium text-primary' : 'text-slate-500'
              }`}
            >
              <item.icon className="size-4" />
              {t(item.key as never)}
            </div>
          ))}
        </aside>

        {/* Main */}
        <div className="flex-1 p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">{t('greeting')}</p>
              <h3 className="text-lg font-bold">{t('earnings')}</h3>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-500">
              <Search className="size-3.5" /> {t('search')}
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-black/5 bg-white p-3 shadow-sm">
              <p className="text-[11px] text-slate-400">{t('availableBalance')}</p>
              <p className="mt-1 text-xl font-bold tracking-tight">$12,480</p>
              <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-brand-600">
                <TrendingUp className="size-3" /> {t('hundredYours')}
              </p>
            </div>
            <div className="rounded-xl border border-black/5 bg-white p-3 shadow-sm">
              <p className="text-[11px] text-slate-400">{t('thisMonth')}</p>
              <p className="mt-1 text-xl font-bold tracking-tight">$4,200</p>
              <p className="mt-1 text-[11px] text-slate-400">{t('vsLast')}</p>
            </div>
            <div className="rounded-xl border border-black/5 bg-white p-3 shadow-sm">
              <p className="text-[11px] text-slate-400">{t('feesPaid')}</p>
              <p className="mt-1 text-xl font-bold tracking-tight text-brand-600">$0.00</p>
              <p className="mt-1 text-[11px] text-slate-400">{t('always')}</p>
            </div>
          </div>

          {/* Chart */}
          <div className="mt-4 rounded-xl border border-black/5 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold">{t('income')}</p>
              <span className="text-[11px] text-slate-400">{t('last6Months')}</span>
            </div>
            <AreaChart />
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/** Hand-built smooth area chart — no dependency, always sharp. */
function AreaChart() {
  return (
    <svg viewBox="0 0 320 90" className="h-24 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2e5bf0" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#2e5bf0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,70 C30,60 45,40 70,44 C100,49 115,20 150,26 C185,32 200,12 240,18 C275,23 295,8 320,10 L320,90 L0,90 Z"
        fill="url(#areaFill)"
      />
      <path
        d="M0,70 C30,60 45,40 70,44 C100,49 115,20 150,26 C185,32 200,12 240,18 C275,23 295,8 320,10"
        fill="none"
        stroke="#2e5bf0"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Job feed card used in the feature section. */
export function JobFeedMockup() {
  const t = useTranslations('home.mockups');
  const jobs = ['job1', 'job2', 'job3'] as const;
  return (
    <BrowserFrame url="freelancezero.com/jobs">
      <div className="space-y-2.5 bg-white p-4 text-slate-900">
        {jobs.map((job) => (
          <div key={job} className="rounded-xl border border-black/5 p-3 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold">{t(`${job}.title`)}</p>
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                {t(`${job}.match`)}
              </span>
            </div>
            <p className="mt-0.5 text-xs font-medium text-primary">{t(`${job}.budget`)}</p>
            <div className="mt-2 flex gap-1.5">
              {(t.raw(`${job}.tags`) as string[]).map((tag) => (
                <span key={tag} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

/** Freelancer profile card used in the feature section. */
export function ProfileMockup() {
  const t = useTranslations('home.mockups.profile');
  return (
    <BrowserFrame url="freelancezero.com/jordan-dev">
      <div className="bg-white p-4 text-slate-900">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-lg font-bold text-white">
            JD
          </div>
          <div>
            <p className="text-sm font-bold">Jordan Dev</p>
            <p className="text-xs text-slate-400">{t('headline')}</p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-amber-500">
              <Star className="size-3 fill-amber-400 text-amber-400" /> {t('rating')}
            </p>
          </div>
          <span className="ml-auto rounded-full bg-brand-50 px-2 py-1 text-[10px] font-semibold text-brand-700">
            {t('openToWork')}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['TypeScript', 'React', 'Next.js', 'Node', 'AWS'].map((s) => (
            <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
              {s}
            </span>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            [t('stat1a'), t('stat1b')],
            [t('stat2a'), t('stat2b')],
            [t('stat3a'), t('stat3b')],
          ].map(([a, b]) => (
            <div key={b} className="rounded-lg bg-slate-50 py-2">
              <p className="text-sm font-bold">{a}</p>
              <p className="text-[10px] text-slate-400">{b}</p>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

/** Contract / milestone view used in the feature section. */
export function ProposalMockup() {
  const t = useTranslations('home.mockups.contract');
  const milestones = [
    { label: t('ms1'), amount: t('ms1a'), done: true },
    { label: t('ms2'), amount: t('ms2a'), done: true },
    { label: t('ms3'), amount: t('ms3a'), done: false },
  ];
  return (
    <BrowserFrame url="freelancezero.com/contracts/482">
      <div className="bg-white p-4 text-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold">{t('projectTitle')}</p>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
            {t('active')}
          </span>
        </div>
        <div className="space-y-2">
          {milestones.map((m) => (
            <div key={m.label} className="flex items-center gap-2.5 rounded-lg border border-black/5 p-2.5">
              {m.done ? (
                <CheckCircle2 className="size-4 shrink-0 text-brand-500" />
              ) : (
                <Circle className="size-4 shrink-0 text-slate-300" />
              )}
              <span className="text-xs">{m.label}</span>
              <span className="ml-auto text-xs font-semibold">{m.amount}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-lg bg-brand-50 p-2.5">
          <span className="text-xs font-medium text-brand-700">{t('releasedToYou')}</span>
          <span className="text-sm font-bold text-brand-700">{t('releasedTotal')}</span>
        </div>
      </div>
    </BrowserFrame>
  );
}
