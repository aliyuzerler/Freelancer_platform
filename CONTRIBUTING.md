# Contributing to Freelancezero

Thanks for helping build a fee-free future for freelancers! This guide gets you
productive fast.

## Ground rules

- **Be kind.** We follow the [Contributor Covenant](https://www.contributor-covenant.org/).
- **Small, focused PRs.** One concern per PR. Link the issue it closes.
- **Discuss big changes first.** Open an issue before large refactors or new
  features so we can align on direction.

## Development setup

```bash
npm install
docker compose up -d db mailhog
cp .env.example .env          # set AUTH_SECRET
npm run db:migrate && npm run db:seed
npm run dev
```

## Before you push

Run the full check suite locally — CI runs the same:

```bash
npm run typecheck   # tsc --noEmit (strict)
npm run lint        # eslint
npm run test        # jest unit tests
npm run test:e2e    # playwright (optional locally)
```

## Coding standards

- **TypeScript strict** — no `any` without a `// eslint-disable` and a reason.
- **Money is integer minor units** (cents) everywhere. Never floats.
- **Validate at the boundary** — every mutating API route parses input with a
  Zod schema from `src/lib/validations/`. Reuse the same schema on the client.
- **Adapters over hard-coding** — payment/storage/realtime/search integrations
  implement the interfaces in `src/lib/adapters/`. Never add a platform fee.
- **Comment the "why", not the "what".** Match the density of surrounding code.
- **Accessibility** — interactive elements need labels; target WCAG AA.

## Database changes

1. Edit `prisma/schema.prisma`.
2. `npm run db:migrate` — name the migration descriptively.
3. Commit both the schema and the generated migration.
4. Keep migrations small and reversible where possible.

## Commit & PR conventions

- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- PR description: what changed, why, and how you verified it.
- Add/extend tests for behavior changes.

## Where to start

- Issues labeled **`good-first-issue`** and **`help-wanted`**.
- The [Roadmap](./ROADMAP.md) lists larger initiatives up for grabs.

Happy shipping! ⚡
