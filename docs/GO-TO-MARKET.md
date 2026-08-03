# Freelancezero — Go-To-Market Strategy

> The version we launch with confidence. This document is the single source of
> truth for positioning, messaging, SEO, growth, and monetization. It is
> opinionated on purpose.

---

## 1. Positioning

**Category:** Freelance marketplace (two-sided: freelancers + clients).

**One-line positioning:**
> **Freelancezero is the freelance marketplace that finally works for you — keep 100% of what you earn, get paid faster, and find better matches.**

**Strategic wedge:** Upwork's ~10% take rate + paid "connects" + payment markups
are a structural, growing source of resentment. We don't compete on features
first — we compete on **fairness and economics**, then win retention with a
**superior, modern experience**. "Zero fees" is the hook; "better product" is
the moat.

**What we are NOT leading with:** open-source, self-hostable, MIT, Docker. These
are trust/defensibility assets for the ~5% who care (developers, agencies,
privacy-conscious teams) and belong in the footer, docs, and a dedicated
`/open-source` page — never the hero.

### Messaging hierarchy (in priority order)
1. **Keep 100% of what you earn.** (money — the emotional core)
2. **Get paid faster, your way.** (direct payouts, your processor, instant options)
3. **Find better matches, faster.** (AI matching, quality-scored proposals)
4. **A workspace you'll actually enjoy.** (modern, fast, mobile-first)
5. **Real trust.** (verified clients, transparent reviews, fair disputes)
6. **Yours to own.** (data export, no lock-in) ← where open-source lives

### Audience-specific hooks
- **Freelancers who hate fees:** "That 10% is your rent. Keep it."
- **Clients who want quality without bloat:** "Hire the person, not the middleman."
- **Agencies:** "Run your whole team's pipeline — commission-free."

---

## 2. SEO Strategy (primary growth channel)

SEO is our cheapest, most defensible acquisition channel because the intent
already exists: thousands of people search "Upwork alternative" every month.

### Target keyword map

| Cluster | Head term | Intent | Target page |
|---|---|---|---|
| **Alternative** | "Upwork alternative", "Upwork alternatives 2026" | Comparison | `/` + `/vs/upwork` |
| **Zero-fee** | "zero fee freelance platform", "freelance platform no fees" | Solution-aware | `/` |
| **No commission** | "freelance marketplace no commission", "hire freelancers no commission" | Client | `/freelancers` |
| **Find work** | "freelance jobs", "remote freelance work" | Freelancer | `/jobs` |
| **Comparisons** | "Fiverr alternative", "Toptal alternative", "Freelancer.com alternative" | Comparison | `/vs/[competitor]` |
| **How-to (top funnel)** | "how to earn $10k/month freelancing", "how to leave Upwork" | Content | `/blog/*` |
| **Money math** | "Upwork fees calculator", "how much does Upwork take" | Tool | `/tools/fee-calculator` |

### On-page SEO (implemented)
- **Keyword-first title tags**: `Freelancezero — The Zero-Fee Upwork Alternative`.
- **Meta descriptions** written for CTR, not just keywords.
- **Canonical URLs** on every page (`src/lib/seo.ts`).
- **Structured data (JSON-LD)**: `Organization`, `WebSite` + Sitelinks Search
  Box, `FAQPage` on the homepage → eligible for rich results.
- **Semantic headings**: one H1 per page, keyword-bearing H2s.
- **Dynamic `sitemap.xml`** (static routes + open jobs) and `robots.txt`.

### SEO pages to build next (high ROI, ordered)
1. **`/vs/upwork`** — the definitive comparison page. Own the highest-intent term.
2. **Programmatic `/vs/[competitor]`** — Fiverr, Freelancer.com, Toptal, Contra.
3. **Fee calculator tool** (`/tools/upwork-fee-calculator`) — "See what Upwork
   took from you this year." Link-bait + shareable + captures money-math intent.
4. **Skill/category landing pages** — `/hire/react-developers`,
   `/freelance/graphic-design-jobs` (programmatic, from the skills taxonomy).
5. **Location pages** — `/freelance-jobs/remote`, `/hire/freelancers-in-[country]`.

### Technical SEO / Core Web Vitals
- Static-render marketing pages (already done) → sub-second TTFB.
- `next/font` with `display: swap` (done) → no FOIT, better CLS/LCP.
- Product mockups are **inline SVG/CSS, zero images** → no image-weight LCP hit.
- Add `next/image` for any real imagery, with explicit width/height (no CLS).
- Ship an OG image via `app/opengraph-image.tsx` (dynamic `ImageResponse`).
- Target: **LCP < 2.0s, CLS < 0.05, INP < 200ms**; monitor with a RUM beacon.
- Route-level `revalidate` for feed/talent pages to keep them fast + fresh.

### Content flywheel
Publish weekly, each piece engineered to rank and to funnel into signup:
- "How to earn $10k/month freelancing in 2026 (real breakdown)"
- "How much does Upwork actually take? (with calculator)"
- "How to leave Upwork without losing your clients"
- "The freelancer's guide to getting paid faster"
- "Freelance contract templates that protect you"

Each post ends with a contextual CTA + the fee calculator. Distribute via
newsletter, Reddit (r/freelance), Indie Hackers, and LinkedIn.

---

## 3. Growth & Acquisition Engine

### a) Two-sided referral program
- **Freelancer → freelancer:** both get a **Featured Profile boost** (7 days of
  higher search ranking) when the referee completes their first contract.
- **Freelancer → client / client → freelancer:** cross-side referrals are the
  gold — reward with premium features, not cash (protects unit economics).
- Every user gets a vanity link `freelancezero.com/join/[handle]`.
- Viral loop metric to watch: **k-factor**; target > 0.5 to meaningfully lower CAC.

### b) Frictionless switching (the "moat-breaker")
- **Upwork profile importer:** paste your public Upwork URL → we pre-fill bio,
  skills, portfolio, work history. Switching cost is the #1 reason people stay;
  we destroy it. (Reviews can't be imported legally, so we seed trust via
  verified-earnings and identity badges instead.)
- **"Bring your clients" flow:** invite existing clients with a one-click link;
  their first contract is white-glove onboarded.

### c) Community (retention + defensibility)
- **Discord** + a public **forum** (SEO value from indexed threads).
- **Newsletter**: weekly "highest-paying open roles + one freelancing tactic."
- **Freelancer spotlights**: real earnings stories (with permission) → social
  proof engine + content.

### d) Partnerships
- **Payment providers** (Stripe, Wise, Payoneer): co-marketing — "the only
  marketplace that pays you directly through X."
- **Accounting/invoicing** (e.g., Wave, QuickBooks): export invoices/PDFs.
- **Portfolio platforms** (GitHub, Behance, Dribbble): one-click portfolio sync.
- **Creator/educator affiliates**: freelancing YouTubers/newsletters get
  referral perks for their audiences.

### e) Launch plan (sequenced)
1. **Pre-launch (waitlist):** landing page + fee calculator + "founding
   freelancer" perk (permanent Featured badge for first 1,000). Collect emails.
2. **Seed the supply side first.** A marketplace dies empty — recruit 500–1,000
   quality freelancers manually + via import before courting clients.
3. **Launch day:** Product Hunt + Hacker News (angle: "We built a freelance
   marketplace that takes 0% — here's how the economics work") + r/freelance +
   Indie Hackers. The open-source angle is the HN hook (not the homepage hook).
4. **Post-launch:** turn on the SEO content engine + referral loop; publish the
   first "transparency report" (see below) to build trust and press.

---

## 4. Sustainability Without Platform Fees

The core marketplace is free forever. Revenue comes from **optional** value that
never taxes a transaction:

| Stream | What | Why it's fair |
|---|---|---|
| **Freelancer Pro** ($12–19/mo) | Profile boost, advanced analytics, more portfolio slots, priority support, early access to matches | Pay for *visibility & insight*, not for the right to work |
| **Client Business/Enterprise** | SSO/SAML, team seats, invoicing, ATS integrations, SLAs, dedicated support | Enterprises pay for admin/compliance, not per-hire fees |
| **Sponsored listings** | Jobs/profiles can pay for placement, clearly labeled | Never degrades organic ranking; labeled "Promoted" |
| **Certified badges** | Optional skills certification (proctored) → trust badge | Verifiable quality signal, one-time fee |
| **Managed hosting** | We run an instance for orgs that want a private marketplace | Leverages the open-source core |
| **Sponsors/donations** | GitHub Sponsors, OpenCollective for the OSS project | Aligns with mission |

**Guardrail:** no revenue stream may ever take a percentage of a
freelancer↔client payment. That promise is the brand.

---

## 5. Trust & Conversion Systems

- **Verified earnings** badges (opt-in, from payment webhooks) → the most
  credible social proof a marketplace can show.
- **Real testimonials with photos** (replace current realistic placeholders
  before launch — never publish fabricated numbers).
- **Transparency dashboard** (`/transparency`): live public stats — total earned
  by freelancers, total fees taken ($0), dispute resolution times. This is a
  *marketing weapon* Upwork can't copy.
- **< 2-minute onboarding:** role pick → 3 fields → first match shown
  immediately. Defer profile completeness to progressive nudges.
- **Retention loops:** daily match digest (opt-in, not spammy), monthly earnings
  insights, skill-gap suggestions tied to in-demand jobs.

---

## 6. North-Star & KPIs

- **North star:** *dollars earned by freelancers* (aligns us with users, not
  extraction).
- **Acquisition:** organic sessions, "Upwork alternative" ranking, k-factor, CAC.
- **Activation:** % who see a relevant match in first session; time-to-first-proposal.
- **Retention:** repeat-contract rate; D30 for both sides.
- **Liquidity:** proposals-per-job (health of supply/demand balance),
  time-to-first-proposal, time-to-hire.
