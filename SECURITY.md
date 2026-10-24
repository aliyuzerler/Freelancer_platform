# Security Policy

## Supported version

Only the latest `master` branch is supported. The project is at **v0.1 (MVP
foundation)** — deploy it as exactly that: an early foundation, hardened per
the 2026 security audit but not yet battle-tested.

## Reporting a vulnerability

Please report security issues privately rather than opening a public issue:

- **Email:** security@freelancezero.com
- Include reproduction steps, affected files, and (if possible) a minimal
  proof of concept.
- You will receive an acknowledgment within 72 hours and a status update
  within 7 days.

We credit reporters in release notes unless they prefer to stay anonymous.

## Documented security posture (post-audit, FZ-01..FZ-28)

The following controls are implemented in code; each is marked with its
audit finding ID in comments:

- **Account integrity** — email confirmation gates password sign-in;
  OAuth linking strips unverified stale password hashes; every session
  re-checks account status/role from the database at most 5 minutes stale
  (`src/lib/auth.ts`).
- **Ingestion safety** — scraped postings always land as admin-curated
  DRAFTs and scraped contact emails never become login identities
  (`src/lib/scrapers/ingest.ts`, `src/lib/email-discovery/discover.ts`).
- **Webhooks** — Stripe identity webhooks verify the `stripe-signature`
  header (HMAC-SHA256, replay-tolerant, fail-closed)
  (`src/lib/webhook-signature.ts`).
- **Rate limiting** — per-IP sliding windows on auth, registration,
  password change, proposals, messages, and admin endpoints
  (`src/lib/rate-limit.ts`, `src/middleware.ts`).
- **Token hygiene** — email-confirmation and recruiter portal tokens are
  stored only as SHA-256 digests; recruiter links expire after 72 hours and
  rotate on each notification (`src/lib/verification.ts`,
  `src/lib/mail/tokens.ts`).
- **Mail safety** — subjects are sanitized against header injection;
  bodies (which embed one-time links) are never logged in production;
  per-recipient hourly caps prevent flooding (`src/lib/mail/send.ts`).
- **Headers** — CSP, HSTS, X-Frame-Options, Referrer-Policy,
  Permissions-Policy on every response (`next.config.mjs`).
- **Defaults** — recruiter email guessing is opt-in
  (`RECRUITER_OUTREACH_POLICY=published_only`); demo seeding refuses to run
  in production; Docker Compose requires real credentials and publishes no
  database port.

## Known limitations

- The in-process rate limiter covers single-instance deployments; run a
  shared store (e.g. Redis) in front of horizontally scaled replicas.
- 2FA (TOTP), password reset self-service, and automated dependency updates
  (Dependabot) are on the roadmap, not yet implemented.
