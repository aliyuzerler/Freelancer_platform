# Roadmap — prioritized by impact

Built in the open. Priorities are ordered by **impact on the north star (dollars
earned by freelancers)** and on the growth engine, not by engineering
convenience. See [docs/GO-TO-MARKET.md](./docs/GO-TO-MARKET.md) for the strategy
these map to.

Legend: 🎯 conversion · 🌱 growth/SEO · 🛠 product · 🔒 trust

---

## ✅ Foundation (shipped)

- [x] Domain data model (Prisma): profiles, jobs, proposals, contracts,
      milestones, payments ledger, messaging, reviews, disputes, notifications, audit.
- [x] Auth.js: credentials + Google/GitHub + magic link; role-aware sessions.
- [x] Core API: register, job feed (keyset pagination), job create, proposal submit.
- [x] Adapter interfaces: payments (zero-fee), storage; realtime/search stubs.
- [x] Marketing site: premium homepage, vs-Upwork table, FAQ, testimonials,
      product mockups, pricing; app pages (jobs, profile, login, register, dashboard).
- [x] **SEO infra**: keyword metadata system, JSON-LD (Org/WebSite/FAQ), dynamic
      sitemap, robots, PWA manifest, canonical URLs.
- [x] Docker Compose stack + migrations + seed.

## 🚀 MVP launch blockers (do first — highest impact)

- [ ] 🌱 **`/vs/upwork` page** + programmatic `/vs/[competitor]` — own the
      highest-intent search terms. *(cheapest CAC we'll ever get)*
- [ ] 🌱 **Fee calculator tool** (`/tools/upwork-fee-calculator`) — link-bait +
      captures money-math intent + shareable.
- [ ] 🎯 **< 2-minute onboarding**: role pick → 3 fields → first match shown.
- [ ] 🛠 **Post-a-job wizard** (`/jobs/new`) + **apply/proposal** submit UI.
- [ ] 🎯 **Real freelancer profile + edit** with completeness meter.
- [ ] 🔒 **Auth completeness**: email verification, password reset, 2FA (TOTP).
- [ ] 🌱 **Waitlist + "founding freelancer" perk** for pre-launch supply seeding.
- [ ] 🛠 File uploads wired to the storage adapter (`/api/files`).

## 🌱 Growth engine (v1.0)

- [ ] **Upwork profile importer** — collapse switching cost (the moat-breaker).
- [ ] **Two-sided referral program** — vanity links, visibility rewards, k-factor.
- [ ] **Transparency dashboard** (`/transparency`) — live "$0 fees taken" + stats.
- [ ] **Content engine** — blog/MDX, first 5 SEO cornerstone posts + newsletter.
- [ ] **Programmatic SEO**: skill (`/hire/react-developers`) & location pages.
- [ ] **Verified earnings** badges from payment webhooks (top-tier social proof).
- [ ] Advanced search & filters (skills, rate, availability, rating) + saved
      searches & job alerts (in-app + email digest).

## 🛠 Product depth (v1.0)

- [ ] Contract lifecycle: milestone funding, deliverable submit/approve, revisions.
- [ ] Real-time chat + project rooms (Socket.io adapter): files, code, mentions.
- [ ] Time tracking (privacy-first, optional screenshots) + **beautiful invoice PDFs**.
- [ ] Payments: **Stripe Connect + PayPal** adapters (still 0% platform fee),
      instant-payout options.
- [ ] Mutual reviews (double-blind release) + skill endorsements.
- [ ] Notification service: digest-by-default, granular controls, quiet hours.

## 🔒 Trust, scale & polish (v1.0 → 1.x)

- [ ] Dispute resolution workflow (transparent, community + optional arbitration).
- [ ] Admin/moderation panel: reports, verification, analytics.
- [ ] Agencies: teams, seats, roles, shared pipeline.
- [ ] Meilisearch adapter (feed/search at scale); PWA offline; WCAG AA audit.
- [ ] GDPR: self-serve data export (JSON + portfolio PDF) + erasure.
- [ ] Playwright E2E on critical paths; RUM for Core Web Vitals; Helm chart.

## 💸 Monetization (never a transaction fee)

- [ ] **Freelancer Pro** — profile boost, analytics, priority support.
- [ ] **Client Business/Enterprise** — SSO/SAML, seats, ATS integrations, SLAs.
- [ ] **Sponsored listings** (labeled), **certified badges**, managed hosting,
      GitHub Sponsors / OpenCollective.

## 🔮 Future / research

- Deeper AI matching (transparent, opt-in) & reputation graph.
- Portable, verifiable credentials; decentralized identity (opt-in).
- Crypto payout adapters (USDC on Solana/Base).
- Native mobile apps; Drizzle ORM alternative; multi-region guide.
