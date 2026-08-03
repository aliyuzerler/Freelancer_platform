<div align="center">

# ⚡ Freelancezero — the open-source, zero-fee Upwork alternative

**A self-hostable freelance marketplace that takes _nothing_ from your work.**

Freelancezero is a free, open-source freelance marketplace where freelancers keep
**100% of what they earn**. No commissions, no connects, no paying to apply —
self-host it in one command, or use the hosted version.

[**🌐 Live site**](https://www.freelancezero.com) ·
[**Quick start**](#quick-start-local-dev) ·
[**Self-hosting**](#run-the-whole-stack-in-docker) ·
[**Roadmap**](./ROADMAP.md) ·
[**Contributing**](./CONTRIBUTING.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg "MIT licensed")](./LICENSE)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black "Built with Next.js 15")](https://nextjs.org)
[![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-blue "TypeScript in strict mode")](https://www.typescriptlang.org)
[![Self-hostable](https://img.shields.io/badge/self--hostable-Docker-2496ED "Self-host with Docker Compose")](#run-the-whole-stack-in-docker)

</div>

---

> **Status: v0.1 — MVP foundation.** The data model, auth, core API, and a
> polished marketing homepage are in place. See the [Roadmap](./ROADMAP.md) for
> what's next.

## Why Freelancezero?

Traditional marketplaces take **10–20%** of every dollar. Freelancezero takes **0%**
by design — the platform is a _coordinator_, never a _custodian_ of money. Payments
flow directly from client to freelancer through a pluggable processor you choose
(or off-platform entirely).

| | Freelancezero | Typical marketplace |
|---|---|---|
| Platform fee | **0%** | 10–20% |
| Open source | ✅ MIT | ❌ |
| Self-hostable | ✅ Docker one-command | ❌ |
| Owns your data | **You do** | The platform |
| Transparent ranking | ✅ | ❌ |

## Tech stack

- **Next.js 15** (App Router) + **TypeScript (strict)** + **Tailwind** + **shadcn/ui**
- **PostgreSQL** + **Prisma 6**
- **Auth.js (NextAuth v5)** — credentials, Google, GitHub, magic links, 2FA-ready
- **TanStack Query** for client data fetching
- Pluggable **adapters** for payments, storage, realtime, and search — swap providers via env vars, no forking

## Quick start (local dev)

```bash
# 1. Install dependencies
npm install

# 2. Start Postgres + a local mail inbox
docker compose up -d db mailhog

# 3. Configure environment
cp .env.example .env
# generate a secret:  openssl rand -base64 32  -> paste into AUTH_SECRET

# 4. Create the schema and seed demo data
npm run db:migrate
npm run db:seed

# 5. Run it
npm run dev        # http://localhost:3000
```

Demo logins (after seeding):

- Client — `client@example.com` / `Password123`
- Freelancer — `freelancer@example.com` / `Password123`

## Run the whole stack in Docker

```bash
cp .env.example .env   # set AUTH_SECRET
docker compose up -d   # app on :3000, mail UI on :8025
```

The `app` service runs `prisma migrate deploy` on boot, so the schema is created
automatically. Put a reverse proxy (Caddy/Traefik) in front for TLS in production.

## One-click deploy

> Deploy buttons target the hosted-Postgres variants of each platform. Set the
> environment variables from [`.env.example`](./.env.example) during setup.

- **Railway / Coolify / Fly.io** — use the included `Dockerfile` + `docker-compose.yml`.
- **Vercel** — deploy the app and attach a managed Postgres (Neon/Supabase); set
  `DATABASE_URL` and `AUTH_SECRET`. Note the local-FS storage driver needs an S3
  adapter on serverless.

## Project structure

```
freelancezero/
├─ prisma/
│  ├─ schema.prisma        # the domain model (single source of truth)
│  └─ seed.ts              # demo data
├─ src/
│  ├─ app/                 # Next.js App Router
│  │  ├─ api/              # route handlers (jobs, proposals, account, admin, cron)
│  │  ├─ admin/            # approvals + user/posting curation
│  │  ├─ dashboard/        # role-aware hub
│  │  ├─ jobs/             # feed, detail, post-a-job, applicants
│  │  ├─ freelancers/[id]/ # public, indexable freelancer profiles
│  │  ├─ messages/         # inbox + conversation threads
│  │  ├─ onboarding/       # required, resumable setup wizard
│  │  ├─ settings/         # profile, payments, notifications, security
│  │  ├─ blog/             # MDX-free content engine (SEO)
│  │  ├─ r/[token]/        # recruiter one-click sign-in
│  │  └─ globals.css       # theme tokens (light/dark)
│  ├─ components/
│  │  ├─ ui/               # shadcn/ui primitives (button, card, …)
│  │  └─ site-header.tsx
│  └─ lib/
│     ├─ db.ts             # Prisma client singleton
│     ├─ auth.ts           # Auth.js configuration
│     ├─ env.ts            # validated env (fail-fast)
│     ├─ api.ts            # consistent API response helpers
│     ├─ onboarding.ts     # step state derived from the DB (resumable)
│     ├─ notify.ts         # create a notification + deliver it inline
│     ├─ scrapers/         # job-board ingestion adapters
│     ├─ email-discovery/  # contact discovery, verification, gating
│     ├─ mail/             # transport, templates, delivery worker
│     ├─ blog/             # post data + rendering
│     ├─ validations/      # shared Zod schemas (client + server)
│     └─ adapters/         # payments / storage / realtime / identity interfaces
├─ Dockerfile             # multi-stage standalone build
├─ docker-compose.yml     # db + mailhog + app
└─ .env.example
```

## API overview

All responses are `{ data }` on success or `{ error }` on failure.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/register` | — | Create a credentials account |
| `GET`/`POST` | `/api/auth/*` | — | Auth.js (login, callbacks, session) |
| `GET` | `/api/jobs` | — | Paginated, filterable job feed (keyset pagination) |
| `POST` | `/api/jobs` | Client | Publish a job |
| `POST` | `/api/proposals` | Freelancer | Submit a proposal (one per job) |
| `POST` | `/api/proposals/reply` | Client | Reply to an applicant, opening a thread |
| `GET` | `/api/messages/unread` | User | Unread message count for the navbar badge |
| `POST` | `/api/messages/[id]` | Participant | Post a message to a conversation |
| `GET`/`POST` | `/api/notifications` | User | Recent activity; mark read |
| `POST` | `/api/account/profile` | Freelancer | Public profile (validated per-host links) |
| `POST` | `/api/account/company` | Client | Company identity shown to freelancers |
| `POST` | `/api/account/preferences` | User | Display name, privacy, email preferences |
| `POST` | `/api/account/password` | User | Set or change password |
| `POST` | `/api/account/avatar` | User | Upload a profile photo |
| `POST` | `/api/account/payout` | User | Connect or remove a payout method |
| `POST` | `/api/account/identity` | User | Start identity verification (KYC) |
| `POST` | `/api/webhooks/identity` | Provider | Verification result callback |
| `PATCH` | `/api/admin/users` | Admin | Curate accounts and recruiter contacts |
| `PATCH` | `/api/admin/jobs` | Admin | Curate and publish ingested postings |
| `POST` | `/api/admin/approvals` | Admin | Approve a pending account |
| `GET`/`POST` | `/api/cron/ingest` | Cron secret | Scrape → verify contacts → send notifications |

## Cold-start job ingestion

The hard part of any marketplace is an empty one. Freelancezero ships a
scheduled pipeline that seeds real demand:

1. **Scrape** public boards through a per-source adapter (`src/lib/scrapers/`).
2. **Resolve the employer** — board and ATS hostnames are blocklisted so a
   posting's apply URL is never mistaken for the company's own domain.
3. **Find a contact** — use the address published in the posting; otherwise
   generate role-box candidates and verify MX before anything is contactable.
4. **Publish or draft** — postings with a reachable contact go live; the rest
   wait in the admin curation queue rather than becoming dead ends.
5. **Notify** — when a freelancer applies, the company gets an email with a
   one-click sign-in link into their applicant list.

Outreach is deliberately conservative: published addresses are preferred over
guesses, every send honours one-click unsubscribe and suppression, and the
policy is configurable via `RECRUITER_OUTREACH_POLICY`.

## Security & privacy

- Passwords hashed with bcrypt (cost 12); JWT sessions.
- Zod validation on every mutating endpoint; typed env fails fast on misconfig.
- Audit log (`AuditLog`) for security-relevant actions.
- GDPR-ready: soft-delete grace period + planned data export/erasure endpoints.
- Money stored as **integer minor units** — never floats.

## Contributing

We ❤️ contributions. See [CONTRIBUTING.md](./CONTRIBUTING.md) and the
[Roadmap](./ROADMAP.md). Good first issues are labeled `good-first-issue`.

## License

[MIT](./LICENSE) © Freelancezero contributors
