import type { Metadata } from 'next';
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
import { getTranslations } from 'next-intl/server';
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
import { Link } from '@/i18n/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home.meta' });
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: '/',
    locale,
  });
}

/**
 * Marketing homepage — benefit-first, trust-forward, commercially framed.
 * Statically rendered for instant load and strong Lighthouse/SEO.
 */
export default async function HomePage() {
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

async function Hero() {
  const t = await getTranslations('home.hero');

  return (
    <section className="relative overflow-hidden bg-navy-950 text-white">
      {/* Ambient grid + glow */}
      <div className="pointer-events-none absolute inset-0 bg-grid-navy [background-size:44px_44px] [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" />

      <div className="container relative py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex animate-fade-up items-center gap-2 rounded-full border border-navy-700 bg-navy-850/70 px-4 py-1.5 text-sm text-navy-300 backdrop-blur">
            <Sparkles className="size-4 text-brand-400" />
            {t('badge')}
          </div>

          <h1 className="mt-6 animate-fade-up font-display text-5xl font-bold heading-tight sm:text-6xl md:text-7xl [animation-delay:60ms]">
            {t('title')} <span className="text-gradient-brand">{t('titleHighlight')}</span>
            <br className="hidden sm:block" /> {t('titleTail')}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-lg leading-relaxed text-navy-300 [animation-delay:120ms] sm:text-xl">
            {t.rich('subtitle', {
              strong: (chunks) => <span className="font-semibold text-white">{chunks}</span>,
            })}
          </p>

          <div className="mt-8 flex animate-fade-up flex-col items-center justify-center gap-3 [animation-delay:180ms] sm:flex-row">
            <Button asChild size="lg" className="h-12 px-7 text-base shadow-glow">
              <Link href="/register?role=freelancer">
                {t('ctaPrimary')} <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-navy-600 bg-transparent px-7 text-base text-white hover:bg-navy-800 hover:text-white"
            >
              <Link href="/register?role=client">{t('ctaSecondary')}</Link>
            </Button>
          </div>

          <p className="mt-5 animate-fade-up text-sm text-navy-400 [animation-delay:220ms]">
            {t('finePrint')}
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
            {t('trustTitle')}
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

const STATS = ['earned', 'fees', 'rating', 'members'] as const;

function StatsBand() {
  return (
    <section id="trust" className="border-b bg-background">
      <StatsGrid />
    </section>
  );
}

async function StatsGrid() {
  const t = await getTranslations('home.stats');
  return (
    <div className="container grid grid-cols-2 gap-8 py-14 md:grid-cols-4">
      {STATS.map((key) => (
        <div key={key} className="text-center">
          <p className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {t(`${key}.value`)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{t(`${key}.label`)}</p>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Fee comparison                                                              */
/* -------------------------------------------------------------------------- */

async function FeeComparison() {
  const t = await getTranslations('home.feeComparison');

  return (
    <section className="bg-background py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold heading-tight sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t('subtitle')}</p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
          {/* Them */}
          <div className="rounded-2xl border bg-card p-8">
            <p className="text-sm font-semibold text-muted-foreground">{t('typical')}</p>
            <p className="mt-2 font-display text-4xl font-bold text-foreground">
              {t('themValue')} <span className="text-lg font-medium text-muted-foreground">{t('toYou')}</span>
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
                {t('fee1')}
              </li>
              <li className="flex items-center gap-2 text-orange-600">
                <span className="size-2 shrink-0 rounded-sm bg-orange-500" />
                {t('fee2')}
              </li>
              <li className="flex items-center gap-2 text-amber-600">
                <span className="size-2 shrink-0 rounded-sm bg-amber-400" />
                {t('fee3')}
              </li>
              <li className="flex items-center gap-2 text-violet-600">
                <span className="size-2 shrink-0 rounded-sm bg-violet-500" />
                {t('fee4')}
              </li>
            </ul>
            <p className="mt-4 text-sm font-medium text-muted-foreground">{t('footnote')}</p>
          </div>

          {/* Us */}
          <div className="relative rounded-2xl border-2 border-primary bg-card p-8 shadow-card-hover">
            <span className="absolute -top-3 left-8 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              Freelancezero
            </span>
            <p className="text-sm font-semibold text-primary">Freelancezero</p>
            <p className="mt-2 font-display text-4xl font-bold text-foreground">
              {t('usValue')} <span className="text-lg font-medium text-muted-foreground">{t('toYou')}</span>
            </p>
            <div className="mt-6 h-4 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-full bg-primary" />
            </div>
            <p className="mt-3 text-sm font-medium text-primary">{t('zeroFeeNote')}</p>
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
  { icon: Wallet, key: 'keepEveryDollar' },
  { icon: Sparkles, key: 'smarterMatching' },
  { icon: Zap, key: 'workflow' },
  { icon: ShieldCheck, key: 'directPayments' },
  { icon: BadgeCheck, key: 'trustSignals' },
  { icon: Users2, key: 'ownYourData' },
] as const;

async function Benefits() {
  const t = await getTranslations('home.benefits');

  return (
    <section className="border-y bg-muted/30 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">{t('eyebrow')}</p>
          <h2 className="mt-3 font-display text-3xl font-bold heading-tight sm:text-4xl">
            {t('title')}
          </h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <div
              key={b.key}
              className="group rounded-2xl border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-card-hover"
            >
              <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <b.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{t(`${b.key}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`${b.key}.body`)}</p>
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

const FEATURES: {
  eyebrowKey: string;
  titleKey: string;
  bodyKey: string;
  pointsKey: string;
  mockup: React.ReactElement;
  reverse?: boolean;
}[] = [
  { eyebrowKey: 'discovery.eyebrow', titleKey: 'discovery.title', bodyKey: 'discovery.body', pointsKey: 'discovery.points', mockup: <JobFeedMockup /> },
  { eyebrowKey: 'reputation.eyebrow', titleKey: 'reputation.title', bodyKey: 'reputation.body', pointsKey: 'reputation.points', mockup: <ProfileMockup />, reverse: true },
  { eyebrowKey: 'payments.eyebrow', titleKey: 'payments.title', bodyKey: 'payments.body', pointsKey: 'payments.points', mockup: <ProposalMockup /> },
];

async function FeatureShowcase() {
  const t = await getTranslations('home.features');

  return (
    <section id="how" className="bg-background py-24">
      <div className="container space-y-24">
        {FEATURES.map((f) => (
          <div key={f.titleKey} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className={f.reverse ? 'lg:order-2' : ''}>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                {t(f.eyebrowKey)}
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold heading-tight sm:text-4xl">
                {t(f.titleKey)}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{t(f.bodyKey)}</p>
              <ul className="mt-6 space-y-3">
                {(t.raw(f.pointsKey) as string[]).map((p) => (
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
  { icon: Search, key: 'step1' },
  { icon: FileCheck2, key: 'step2' },
  { icon: Wallet, key: 'step3' },
] as const;

async function HowItWorks() {
  const t = await getTranslations('home.how');

  return (
    <section className="border-y bg-muted/30 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold heading-tight sm:text-4xl">
            {t('title')}
          </h2>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.key} className="relative text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <s.icon className="size-6" />
              </div>
              <div className="mt-2 text-sm font-semibold text-primary">{t('step', { n: i + 1 })}</div>
              <h3 className="mt-1 text-lg font-semibold">{t(`${s.key}.title`)}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{t(`${s.key}.body`)}</p>
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

async function TestimonialSection() {
  const t = await getTranslations('home.testimonials');

  return (
    <section className="bg-navy-950 py-24 text-white">
      <div className="container">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
            {t('eyebrow')}
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold heading-tight sm:text-4xl">
            {t('title')}
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
  { name: 'Amara Nwosu', roleKey: 'role1', rate: '$75/saat', rating: '5.0', initials: 'AN', skills: ['Figma', 'Webflow'] },
  { name: 'Leo Martins', roleKey: 'role2', rate: '$90/saat', rating: '4.9', initials: 'LM', skills: ['React', 'Go'] },
  { name: 'Priya Nair', roleKey: 'role3', rate: '$65/saat', rating: '4.9', initials: 'PN', skills: ['SEO', 'Ads'] },
  { name: 'Hugo Weber', roleKey: 'role4', rate: '$80/saat', rating: '5.0', initials: 'HW', skills: ['After Effects'] },
] as const;

async function FeaturedTalent() {
  const t = await getTranslations('home.talent');

  return (
    <section className="bg-background py-24">
      <div className="container">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              {t('eyebrow')}
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold heading-tight sm:text-4xl">
              {t('title')}
            </h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/register?role=client">
              {t('cta')} <ArrowRight />
            </Link>
          </Button>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TALENT.map((person) => (
            <div key={person.name} className="rounded-2xl border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-card-hover">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 font-bold text-white">
                  {person.initials}
                </div>
                <div>
                  <p className="font-semibold leading-tight">{person.name}</p>
                  <p className="text-xs text-muted-foreground">{t(person.roleKey)}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-semibold text-primary">{person.rate}</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Star className="size-4 fill-amber-400 text-amber-400" /> {person.rating}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {person.skills.map((s) => (
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

async function Pricing() {
  const t = await getTranslations('home.pricing');

  return (
    <section id="pricing" className="border-y bg-muted/30 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">{t('eyebrow')}</p>
          <h2 className="mt-3 font-display text-3xl font-bold heading-tight sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t('subtitle')}</p>
        </div>

        <div className="mx-auto mt-12 max-w-md rounded-3xl border-2 border-primary bg-card p-8 text-center shadow-card-hover">
          <p className="font-display text-6xl font-bold">$0</p>
          <p className="mt-1 text-muted-foreground">{t('per')}</p>
          <ul className="mt-8 space-y-3 text-left">
            {(t.raw('features') as string[]).map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm font-medium">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" />
                </span>
                {f}
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-8 w-full">
            <Link href="/register">{t('cta')}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* vs Upwork comparison table                                                  */
/* -------------------------------------------------------------------------- */

const COMPARISON = [
  'platformFee',
  'payToApply',
  'processingMarkup',
  'ownProcessor',
  'instantPayouts',
  'aiMatching',
  'dataOwnership',
  'disputes',
] as const;

async function VsUpwork() {
  const t = await getTranslations('home.vsUpwork');

  return (
    <section className="bg-background py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            {t('eyebrow')}
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold heading-tight sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t('subtitle')}</p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-2xl border shadow-card-hover">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="p-4 font-medium text-muted-foreground">{t('colWhat')}</th>
                <th className="p-4 text-center font-semibold text-primary">Freelancezero</th>
                <th className="p-4 text-center font-medium text-muted-foreground">Upwork</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((key, i) => (
                <tr key={key} className={i % 2 ? 'bg-muted/20' : ''}>
                  <td className="p-4 font-medium">{t(`${key}.feature`)}</td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                      <Check className="size-4" /> {t(`${key}.us`)}
                    </span>
                  </td>
                  <td className="p-4 text-center text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <X className="size-4 text-destructive/70" /> {t(`${key}.them`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mx-auto mt-4 max-w-3xl text-center text-xs text-muted-foreground">
          {t('disclaimer')}
        </p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* FAQ (with FAQPage schema for rich results)                                  */
/* -------------------------------------------------------------------------- */

const FAQ_KEYS = ['free', 'difference', 'payment', 'import', 'safety', 'agencies'] as const;

async function Faq() {
  const t = await getTranslations('home.faq');
  const items = FAQ_KEYS.map((key) => ({
    q: t(`${key}.q`),
    a: t(`${key}.a`),
  }));

  return (
    <section className="border-y bg-muted/30 py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(faqJsonLd(items))} />
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            {t('eyebrow')}
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold heading-tight sm:text-4xl">
            {t('title')}
          </h2>
        </div>

        <div className="mx-auto mt-12 max-w-3xl divide-y rounded-2xl border bg-card">
          {items.map((item) => (
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

async function FinalCta() {
  const t = await getTranslations('home.finalCta');

  return (
    <section className="relative overflow-hidden bg-navy-950 py-24 text-white">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
      <div className="container relative text-center">
        <LogoMark className="mx-auto size-14 rounded-2xl shadow-glow" />
        <h2 className="mx-auto mt-6 max-w-2xl font-display text-4xl font-bold heading-tight sm:text-5xl">
          {t('title')}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-navy-300">{t('subtitle')}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 px-7 text-base shadow-glow">
            <Link href="/register?role=freelancer">
              {t('ctaPrimary')} <ArrowRight />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 border-navy-600 bg-transparent px-7 text-base text-white hover:bg-navy-800 hover:text-white"
          >
            <Link href="/register?role=client">{t('ctaSecondary')}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
