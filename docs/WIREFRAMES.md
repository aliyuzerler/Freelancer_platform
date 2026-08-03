# Inner Page Wireframes — high-fidelity specs

Detailed enough for a designer or an engineer to build directly. Every screen is
**mobile-first** (freelancers live on phones), performance-obsessed, and includes
the loading / empty / error states that decide whether a marketplace feels
premium or broken.

Design language: refined **emerald + deep navy**, Sora display / Inter body,
generous whitespace, soft shadows, 0.7rem radii, subtle motion. Dark mode is a
first-class citizen, not an afterthought.

---

## 1. Dashboard (`/dashboard`)

**Goal:** answer "how much am I making and what needs my attention?" in one glance.

**Layout (desktop):** left sidebar (Dashboard, Contracts, Messages, Payments,
Profile) + main column. Mobile: bottom tab bar (Home, Work, Messages, Wallet,
Profile), thumb-reachable.

**Above the fold:**
- Greeting + current availability toggle ("Open to work" pill, one tap).
- **Three stat cards:** Available balance (with "100% yours · $0 fees" caption),
  This month's earnings (+% vs last), Active contracts.
- **Earnings chart** — 6-month area chart (the SVG we already built), range
  toggle (1M/6M/1Y). Hover shows exact figures.

**Below:**
- **"Needs your attention"** list: milestones to submit, proposals to respond to,
  messages unread, reviews to leave. Each row = one tap to resolve.
- **Recommended matches** (freelancer) / **recommended talent** (client): 3 cards
  from the matching engine, "why this match" chips (skill overlap, rate fit).
- **Insights strip:** "You respond in ~2h — faster than 80% of freelancers."

**States:**
- *Loading:* skeleton cards (shimmer), never spinners for layout.
- *Empty (new user):* a friendly checklist — "Complete your profile (60%) → get
  3× more invites," with a progress ring. Turns emptiness into activation.
- *Error:* inline card "Couldn't load earnings — retry," never a blank screen.

---

## 2. Freelancer Profile (`/[handle]`, edit at `/settings/profile`)

**Goal:** win the client the moment they land. This page *is* the sales pitch.

**Hero band:** avatar, name, headline, location, availability pill, star rating +
review count, and a sticky **"Invite to job" / "Message"** card (follows scroll
on desktop; fixed bottom bar on mobile). Rate shown prominently.

**Trust row:** Verified earnings badge, identity-verified, job-success %, response
time, on-time %. These are the conversion drivers.

**Sections (tabbed on mobile, stacked on desktop):**
- **About** — rich bio.
- **Portfolio** — masonry grid; each item opens a lightbox case study (problem →
  approach → result → link/GitHub). Portfolio strength is a ranking input.
- **Skills** — chips with endorsement counts; top skills first.
- **Work history & reviews** — reviews are double-blind (hidden until both submit)
  with the contract context ("$4,500 fixed · Web design").
- **Education & certifications.**

**Editing UX:** inline edit with autosave; a **profile completeness meter** that
explains *what unlocks* at each level ("Add 3 portfolio items → appear in more
searches").

**States:** skeleton on load; empty portfolio shows an "Add your best work" CTA
with examples; 404 profile → branded not-found with search.

---

## 3. Post a Job (`/jobs/new`)

**Goal:** a client posts a high-quality job in **under 3 minutes**, with just
enough structure to enable good matching.

**Format:** a **3-step wizard** (progress bar top), not one giant form.

- **Step 1 — Scope:** Title (with live "good title" hint), description (rich text
  + AI "help me write this" button that drafts from a one-line summary),
  required skills (typeahead against the taxonomy, max 15).
- **Step 2 — Budget & timeline:** Hourly vs Fixed toggle → contextual fields
  (rate range or fixed amount, all in major units, converted to minor units on
  submit), experience level, estimated duration. Live **"similar jobs pay
  $X–$Y"** benchmark to set expectations.
- **Step 3 — Review & publish:** preview exactly as freelancers will see it;
  visibility (Public / Invite-only); optional "invite specific freelancers."

**Smart touches:** autosave as **Draft** on every step (never lose work); AI
suggests missing skills based on the description; validation is inline and
friendly (Zod `createJobSchema`, shared client/server).

**States:** step-level validation errors inline; publishing shows an optimistic
success screen with "3 matched freelancers already notified"; save-draft
confirmation toast.

---

## 4. Proposals — client review view (`/jobs/[id]/proposals`)

**Goal:** let a client go from 20 proposals to a shortlist of 3 fast, without
spammy noise.

**Layout:** two-pane. Left = ranked proposal list; right = selected proposal
detail. Mobile = list → full-screen detail.

**Proposal list item:** freelancer avatar + name, rating, **quality/match score**
(our anti-spam signal), bid amount & type, a 2-line cover-letter preview, and
quick actions (Shortlist ★, Message, Decline). Default sort = match score, with
toggles (lowest bid, fastest, highest rated).

**Detail pane:** full cover letter, proposed milestones with amounts, relevant
portfolio items the freelancer attached, and a **"why this match"** breakdown
(skill overlap %, rate fit, past success). Primary CTA: **"Hire & create
contract"** → pre-fills the contract from the proposal's milestones.

**Anti-spam:** low-score proposals collapse under a "Show N lower-match
proposals" divider — quality surfaces, noise hides.

**States:** empty ("No proposals yet — here are 5 freelancers you could invite");
loading skeleton rows; declined proposals move to a collapsed section with an
optional templated, kind rejection message.

---

## 5. Proposal — freelancer submit view (`/jobs/[slug]/apply`)

- Live **strength meter** on the cover letter ("Mention their industry ↑",
  "Add a milestone ↑") tied to the quality score — coaches better proposals.
- **AI proposal assist:** drafts a tailored first version from the job + the
  freelancer's profile; the human always edits (never fully automated spam).
- Reusable **saved templates** and snippets.
- Milestone builder (title, amount, due-in-days) with a running total vs the
  client's budget.
- Clear "You keep 100% of $X" reinforcement at the bid field.

---

## Cross-cutting: the details that matter massively

- **Loading:** content-shaped skeletons everywhere; optimistic UI on mutations.
- **Empty states:** always a next action + why it helps ("Complete X → get Y").
- **Errors:** human copy ("We couldn't reach the server — retry"), inline, with a
  path forward; never raw stack traces (API returns `{ error }` shape already).
- **Notifications:** digest-by-default, per-type granular controls, quiet hours;
  never more than one email per event class per day. In-app badge is the primary
  channel; email is opt-in escalation.
- **Accessibility:** WCAG 2.1 AA — labeled controls, focus-visible rings (already
  in the button/input primitives), keyboard-navigable, prefers-reduced-motion
  respected, ≥ 4.5:1 contrast (palette chosen for this).
- **Performance:** feed & search paginated with keyset cursors (implemented);
  route-level caching; server components by default, client islands only where
  interactive.
- **Dark mode excellence:** true navy surfaces (not gray), tuned shadows/borders
  per theme, no pure-black; test every screen in both themes.
- **Data ownership:** one-click **export** (JSON + PDF portfolio) and account
  **deletion** with a grace window (schema already soft-deletes) — GDPR-ready.
