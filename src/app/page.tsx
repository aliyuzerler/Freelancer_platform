import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
  Users2,
  Star,
  Check,
  X,
  Search,
  FileCheck2,
  BadgeCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogoMark } from '@/components/logo';
import { Testimonials } from '@/components/marketing/testimonials';
import {
  DashboardMockup,
  JobFeedMockup,
  ProfileMockup,
  ProposalMockup,
} from '@/components/marketing/product-mockups';
import { pageMetadata, faqJsonLd, jsonLdScript } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Freelancezero — The Zero-Fee Upwork Alternative',
  description:
    'Looking for an Upwork alternative with no fees? Freelancezero lets freelancers keep 100% of their earnings — no commission, no connects. Clients hire faster and pay directly. Free forever.',
  path: '/',
});

/**
 * Marketing homepage — benefit-first, trust-forward, commercially framed.
 * Statically rendered for instant load and strong Lighthouse/SEO.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBand />
      <FeeComparison />
      <VsUpwork />
      <Benefits />
      <FeatureShowcase />
      <HowItWorks />
      <TestimonialSection />
      <FeaturedTalent />
      <Pricing />
      <Faq />
      <FinalCta />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                        */
/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy-950 text-white">
      {/* Ambient grid + glow */}
      <div className="pointer-events-none absolute inset-0 bg-grid-navy [background-size:44px_44px] [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" />

      <div className="container relative py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex animate-fade-up items-center gap-2 rounded-full border border-navy-700 bg-navy-850/70 px-4 py-1.5 text-sm text-navy-300 backdrop-blur">
            <Sparkles className="size-4 text-brand-400" />
            The fair freelance marketplace
          </div>

          <h1 className="mt-6 animate-fade-up font-display text-5xl font-bold heading-tight sm:text-6xl md:text-7xl [animation-delay:60ms]">
            Keep <span className="text-gradient-brand">100%</span> of
            <br className="hidden sm:block" /> what you earn.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-lg leading-relaxed text-navy-300 [animation-delay:120ms] sm:text-xl">
            The freelance marketplace that finally works for you. Keep{' '}
            <span className="font-semibold text-white">100%</span> of your earnings, get paid faster,
            and find better matches — while Upwork quietly takes up to 10% of every invoice.
          </p>

          <div className="mt-8 flex animate-fade-up flex-col items-center justify-center gap-3 [animation-delay:180ms] sm:flex-row">
            <Button asChild size="lg" className="h-12 px-7 text-base shadow-glow">
              <Link href="/register?role=freelancer">
                Start earning — it&apos;s free <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-navy-600 bg-transparent px-7 text-base text-white hover:bg-navy-800 hover:text-white"
            >
              <Link href="/register?role=client">Hire top talent</Link>
            </Button>
          </div>

          <p className="mt-5 animate-fade-up text-sm text-navy-400 [animation-delay:220ms]">
            Join 12,450+ freelancers and clients · No card required · Set up in 2 minutes
          </p>
        </div>

        {/* Product mockup */}
        <div className="relative mx-auto mt-14 max-w-4xl animate-fade-up [animation-delay:300ms]">
          <div className="absolute -inset-x-10 -top-10 bottom-0 -z-10 bg-hero-glow" />
          <DashboardMockup />
        </div>

        {/* Trust logos */}
        <div className="mt-16">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-navy-400">
            Pay and get paid through the processors you already trust
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-navy-400">
            {['Stripe', 'PayPal', 'Wise', 'Payoneer', 'USDC'].map((name) => (
              <span key={name} className="text-lg font-semibold tracking-tight opacity-70">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Stats                                                                       */
/* -------------------------------------------------------------------------- */

const STATS = [
  { value: '$12M+', label: 'Earned by freelancers' },
  { value: '$0', label: 'Taken in platform fees' },
  { value: '4.9/5', label: 'Average project rating' },
  { value: '12,450', label: 'Active members' },
];

function StatsBand() {
  return (
    <section id="trust" className="border-b bg-background">
      <div className="container grid grid-cols-2 gap-8 py-14 md:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {s.value}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Fee comparison                                                              */
/* -------------------------------------------------------------------------- */

function FeeComparison() {
  return (
    <section className="bg-background py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold heading-tight sm:text-4xl">
            On a $10,000 project, where does your money go?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Traditional marketplaces quietly skim every invoice. We don&apos;t take a cent — the math
            is simple.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
          {/* Them */}
          <div className="rounded-2xl border bg-card p-8">
            <p className="text-sm font-semibold text-muted-foreground">Typical marketplace</p>
            <p className="mt-2 font-display text-4xl font-bold text-foreground">
              $8,685 <span className="text-lg font-medium text-muted-foreground">to you</span>
            </p>
            <div className="mt-6 flex h-4 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[86.85%] bg-slate-400" />
              <div className="h-full w-[10%] bg-destructive" />
              <div className="h-full w-[2.5%] bg-orange-500" />
              <div className="h-full w-[0.4%] bg-amber-400" />
              <div className="h-full w-[0.25%] bg-violet-500" />
            </div>
            <ul className="mt-4 space-y-1.5 text-sm">
              <li className="flex items-center gap-2 text-destructive">
                <span className="size-2 shrink-0 rounded-sm bg-destructive" />
                − $1,000 platform fee (10% of every invoice)
              </li>
              <li className="flex items-center gap-2 text-orange-600">
                <span className="size-2 shrink-0 rounded-sm bg-orange-500" />
                − $250 application credits — ~100 paid bids per win, spent whether or
                not you get the job
              </li>
              <li className="flex items-center gap-2 text-amber-600">
                <span className="size-2 shrink-0 rounded-sm bg-amber-400" />
                − $40 membership and signup fees
              </li>
              <li className="flex items-center gap-2 text-violet-600">
                <span className="size-2 shrink-0 rounded-sm bg-violet-500" />
                − $25 withdrawal fee just to move your own money
              </li>
            </ul>
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              That&apos;s over 13% gone — and the credits are gone even when you don&apos;t win.
            </p>
          </div>

          {/* Us */}
          <div className="relative rounded-2xl border-2 border-primary bg-card p-8 shadow-card-hover">
            <span className="absolute -top-3 left-8 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              Freelancezero
            </span>
            <p className="text-sm font-semibold text-primary">Freelancezero</p>
            <p className="mt-2 font-display text-4xl font-bold text-foreground">
              $10,000 <span className="text-lg font-medium text-muted-foreground">to you</span>
            </p>
            <div className="mt-6 h-4 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-full bg-primary" />
            </div>
            <p className="mt-3 text-sm font-medium text-primary">
              $0 in fees — you keep every dollar
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Benefits                                                                    */
/* -------------------------------------------------------------------------- */

const BENEFITS = [
  {
    icon: Wallet,
    title: 'Keep every dollar',
    body: 'No commissions, no paying to apply, no withdrawal fees. Your rate is your take-home — full stop.',
  },
  {
    icon: Sparkles,
    title: 'Smarter matching',
    body: 'Quality-scored proposals and relevance-ranked talent mean less noise and faster, better hires.',
  },
  {
    icon: Zap,
    title: 'A delightful workflow',
    body: 'Contracts, milestones, chat, and time tracking in one fast, modern workspace you’ll enjoy using.',
  },
  {
    icon: ShieldCheck,
    title: 'Direct, secure payments',
    body: 'Pay and get paid through Stripe, PayPal, Wise, or crypto — you choose. We never hold your money.',
  },
  {
    icon: BadgeCheck,
    title: 'Real trust signals',
    body: 'Verified clients, transparent reviews, and endorsements so both sides know who they’re working with.',
  },
  {
    icon: Users2,
    title: 'Yours to own',
    body: 'Export your data anytime, bring your own clients, and never get locked in. Your reputation travels with you.',
  },
];

function Benefits() {
  return (
    <section className="border-y bg-muted/30 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Why switch</p>
          <h2 className="mt-3 font-display text-3xl font-bold heading-tight sm:text-4xl">
            Everything you need to win work and get paid
          </h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="group rounded-2xl border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-card-hover"
            >
              <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <b.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Feature showcase (alternating mockups)                                      */
/* -------------------------------------------------------------------------- */

const FEATURES = [
  {
    eyebrow: 'Discovery',
    title: 'Find work that actually fits',
    body: 'Every job you see is scored for how well it matches your skills and rate. No more scrolling past a hundred irrelevant posts to find the one worth your time.',
    points: ['Relevance-ranked job feed', 'Saved searches & instant alerts', 'One-click, high-quality proposals'],
    mockup: <JobFeedMockup />,
  },
  {
    eyebrow: 'Reputation',
    title: 'A profile that wins the pitch',
    body: 'Showcase a rich portfolio, endorsed skills, and verified reviews. Clients see exactly why you’re the right hire — before you say a word.',
    points: ['Portfolio, case studies & GitHub', 'Endorsements & verified reviews', 'Live “open to work” status'],
    mockup: <ProfileMockup />,
    reverse: true,
  },
  {
    eyebrow: 'Payments',
    title: 'Milestones, delivered and paid — with zero cut',
    body: 'Fund milestones, approve deliverables, and release payment directly to your freelancer through your own processor. Transparent, safe, and 100% fee-free.',
    points: ['Milestone-based contracts', 'Deliverable approval workflow', 'Direct payouts, $0 platform fee'],
    mockup: <ProposalMockup />,
  },
];

function FeatureShowcase() {
  return (
    <section id="how" className="bg-background py-24">
      <div className="container space-y-24">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
          >
            <div className={f.reverse ? 'lg:order-2' : ''}>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                {f.eyebrow}
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold heading-tight sm:text-4xl">
                {f.title}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{f.body}</p>
              <ul className="mt-6 space-y-3">
                {f.points.map((p) => (
                  <li key={p} className="flex items-center gap-3 text-sm font-medium">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <Check className="size-3" />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className={f.reverse ? 'lg:order-1' : ''}>{f.mockup}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* How it works                                                                */
/* -------------------------------------------------------------------------- */

const STEPS = [
  { icon: Search, title: 'Post or find work', body: 'Clients post a job in minutes; freelancers get matched to roles that fit.' },
  { icon: FileCheck2, title: 'Agree on milestones', body: 'Set scope, timeline, and payment terms in a clear, shared contract.' },
  { icon: Wallet, title: 'Deliver & get paid in full', body: 'Approve work and release payment directly — with zero fees taken out.' },
];

function HowItWorks() {
  return (
    <section className="border-y bg-muted/30 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold heading-tight sm:text-4xl">
            From “hello” to “paid” in three steps
          </h2>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <s.icon className="size-6" />
              </div>
              <div className="mt-2 text-sm font-semibold text-primary">Step {i + 1}</div>
              <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Testimonials                                                                */
/* -------------------------------------------------------------------------- */

function TestimonialSection() {
  return (
    <section className="bg-navy-950 py-24 text-white">
      <div className="container">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
            Loved by both sides
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold heading-tight sm:text-4xl">
            People are moving their work — and their income — here
          </h2>
        </div>
        <Testimonials />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Featured talent                                                             */
/* -------------------------------------------------------------------------- */

const TALENT = [
  { name: 'Amara Nwosu', role: 'Brand & Web Designer', rate: '$75/hr', rating: '5.0', initials: 'AN', skills: ['Figma', 'Webflow'] },
  { name: 'Leo Martins', role: 'Full-Stack Developer', rate: '$90/hr', rating: '4.9', initials: 'LM', skills: ['React', 'Go'] },
  { name: 'Priya Nair', role: 'Growth Marketer', rate: '$65/hr', rating: '4.9', initials: 'PN', skills: ['SEO', 'Ads'] },
  { name: 'Hugo Weber', role: 'Motion & Video', rate: '$80/hr', rating: '5.0', initials: 'HW', skills: ['After Effects'] },
];

function FeaturedTalent() {
  return (
    <section className="bg-background py-24">
      <div className="container">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Featured talent
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold heading-tight sm:text-4xl">
              Top-rated professionals, ready to start
            </h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/register?role=client">
              Hire talent <ArrowRight />
            </Link>
          </Button>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TALENT.map((t) => (
            <div key={t.name} className="rounded-2xl border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-card-hover">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 font-bold text-white">
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold leading-tight">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-semibold text-primary">{t.rate}</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Star className="size-4 fill-amber-400 text-amber-400" /> {t.rating}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.skills.map((s) => (
                  <span key={s} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Pricing                                                                     */
/* -------------------------------------------------------------------------- */

function Pricing() {
  return (
    <section id="pricing" className="border-y bg-muted/30 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Pricing</p>
          <h2 className="mt-3 font-display text-3xl font-bold heading-tight sm:text-4xl">
            The whole platform is free. Really.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            We don&apos;t make money by taking yours. No fees for freelancers, no fees for clients — now
            or ever.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-md rounded-3xl border-2 border-primary bg-card p-8 text-center shadow-card-hover">
          <p className="font-display text-6xl font-bold">$0</p>
          <p className="mt-1 text-muted-foreground">per month · per project · per anything</p>
          <ul className="mt-8 space-y-3 text-left">
            {[
              'Unlimited jobs, proposals & contracts',
              'Milestones, chat & time tracking',
              'Direct payments via your own processor',
              'Verified reviews & reputation',
              'Full data export, no lock-in',
            ].map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm font-medium">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" />
                </span>
                {f}
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-8 w-full">
            <Link href="/register">Create your free account</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* vs Upwork comparison table                                                  */
/* -------------------------------------------------------------------------- */

const COMPARISON: { feature: string; us: string; them: string; usWin: boolean }[] = [
  { feature: 'Platform fee on your earnings', us: '0%', them: '10%', usWin: true },
  { feature: 'Pay to submit proposals (“connects”)', us: 'Never', them: 'Yes', usWin: true },
  { feature: 'Client payment processing markup', us: 'None', them: 'Up to 5%', usWin: true },
  { feature: 'Choose your own payout processor', us: 'Yes', them: 'No', usWin: true },
  { feature: 'Instant payouts', us: 'Supported', them: 'Limited', usWin: true },
  { feature: 'AI-assisted matching & proposals', us: 'Built-in', them: 'Partial', usWin: true },
  { feature: 'Own & export all your data', us: 'Always', them: 'No', usWin: true },
  { feature: 'Transparent, community-led disputes', us: 'Yes', them: 'Opaque', usWin: true },
];

function VsUpwork() {
  return (
    <section className="bg-background py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Freelancezero vs Upwork
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold heading-tight sm:text-4xl">
            A side-by-side you can’t unsee
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Same work. Same clients. Radically different economics and control.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-2xl border shadow-card-hover">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="p-4 font-medium text-muted-foreground">What matters to you</th>
                <th className="p-4 text-center font-semibold text-primary">Freelancezero</th>
                <th className="p-4 text-center font-medium text-muted-foreground">Upwork</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr key={row.feature} className={i % 2 ? 'bg-muted/20' : ''}>
                  <td className="p-4 font-medium">{row.feature}</td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                      <Check className="size-4" /> {row.us}
                    </span>
                  </td>
                  <td className="p-4 text-center text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <X className="size-4 text-destructive/70" /> {row.them}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mx-auto mt-4 max-w-3xl text-center text-xs text-muted-foreground">
          Comparison based on publicly listed Upwork terms as of 2026. “Upwork” is a trademark of its
          owner; Freelancezero is not affiliated with or endorsed by Upwork.
        </p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* FAQ (with FAQPage schema for rich results)                                  */
/* -------------------------------------------------------------------------- */

const FAQ_ITEMS = [
  {
    q: 'Is Freelancezero really free — what’s the catch?',
    a: 'Yes. Freelancezero charges freelancers and clients 0% — no commissions, no connects, no withdrawal fees. There is no catch: the platform is a coordinator, not a middleman that skims payments. We sustain the project through optional premium tools and services that never gate the core marketplace.',
  },
  {
    q: 'How is Freelancezero different from Upwork?',
    a: 'The biggest difference is fees: Upwork takes up to 10% of your earnings, plus paid “connects” to apply and payment-processing markups. Freelancezero takes nothing. You also choose your own payout processor (Stripe, PayPal, Wise, or crypto), own and export your data anytime, and get faster, AI-assisted matching.',
  },
  {
    q: 'How do freelancers get paid if the platform takes no fee?',
    a: 'Payments flow directly from client to freelancer through a processor you choose. Freelancezero coordinates milestones and releases but never holds your money, so there’s no platform cut and often faster access to funds.',
  },
  {
    q: 'Can I import my Upwork profile and reviews?',
    a: 'Yes. Our import tool helps you rebuild your profile — bio, skills, portfolio, and work history — in minutes so switching doesn’t mean starting from zero.',
  },
  {
    q: 'Is it safe? How are disputes handled?',
    a: 'Clients can be payment- and identity-verified, reviews are transparent and double-blind to prevent retaliation, and disputes use a fast, transparent, community-led resolution process with optional arbitration.',
  },
  {
    q: 'Do you support agencies and teams?',
    a: 'Yes. Agencies can add team members with roles, manage a shared pipeline, and bid or deliver as a team — with the same zero-fee model.',
  },
];

function Faq() {
  return (
    <section className="border-y bg-muted/30 py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(faqJsonLd(FAQ_ITEMS))} />
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Questions, answered
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold heading-tight sm:text-4xl">
            Everything you’re wondering about a zero-fee marketplace
          </h2>
        </div>

        <div className="mx-auto mt-12 max-w-3xl divide-y rounded-2xl border bg-card">
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="group p-6 [&_summary]:list-none">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold">
                {item.q}
                <span className="grid size-6 shrink-0 place-items-center rounded-full border text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Final CTA                                                                    */
/* -------------------------------------------------------------------------- */

function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-navy-950 py-24 text-white">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
      <div className="container relative text-center">
        <LogoMark className="mx-auto size-14 rounded-2xl shadow-glow" />
        <h2 className="mx-auto mt-6 max-w-2xl font-display text-4xl font-bold heading-tight sm:text-5xl">
          Stop giving away a cut of your work.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-navy-300">
          Join thousands of freelancers and clients who&apos;ve switched to the fair way to work.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 px-7 text-base shadow-glow">
            <Link href="/register?role=freelancer">
              Start earning free <ArrowRight />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 border-navy-600 bg-transparent px-7 text-base text-white hover:bg-navy-800 hover:text-white"
          >
            <Link href="/register?role=client">Post a job</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
