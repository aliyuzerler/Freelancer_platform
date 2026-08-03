<div align="center">

# ⚡ Freelancezero

**The freelance marketplace that takes _nothing_ from your work.**

A 100% free, fully open-source, self-hostable alternative to Upwork.
Zero platform fees — forever. Freelancers keep 100% of what they earn.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org)

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
│  │  ├─ api/              # route handlers (jobs, proposals, register, auth)
│  │  ├─ layout.tsx        # root layout + providers
│  │  ├─ page.tsx          # marketing homepage
│  │  └─ globals.css       # theme tokens (light/dark)
│  ├─ components/
│  │  ├─ ui/               # shadcn/ui primitives (button, card, …)
│  │  └─ site-header.tsx
│  └─ lib/
│     ├─ db.ts             # Prisma client singleton
│     ├─ auth.ts           # Auth.js configuration
│     ├─ env.ts            # validated env (fail-fast)
│     ├─ api.ts            # consistent API response helpers
│     ├─ validations/      # shared Zod schemas (client + server)
│     └─ adapters/         # payments / storage (+ realtime, search) interfaces
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

## Screenshots

> _(Describe / add once UI screens land.)_
> - **Homepage** — emerald-accented hero, "0% platform fees" badge, three value-prop cards, light/dark toggle.
> - **Job feed** — filterable list with skill chips and proposal counts.
> - **Dashboard** — earnings, proposals sent, and job-match analytics.

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
