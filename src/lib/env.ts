import { z } from 'zod';

/**
 * Validate environment variables once, at startup, and export a typed object.
 * Fail fast: a misconfigured deployment should crash on boot, not at runtime
 * deep inside a request handler.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),

  // Optional providers — validated only for shape.
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),

  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.coerce.number().optional(),
  EMAIL_FROM: z.string().optional(),
  // Production email provider. When set (and no EMAIL_SERVER_HOST), mail is sent
  // via Resend's SMTP relay. Requires a verified sending domain for EMAIL_FROM.
  RESEND_API_KEY: z.string().optional(),

  // --- External-job recruiter outreach ---
  // FZ-07: guessing is an OPT-IN. The safe default contacts only addresses the
  // posting actually published; operators who accept the legal/reputational
  // trade-offs may enable 'published_first' explicitly.
  RECRUITER_OUTREACH_POLICY: z
    .enum(['published_only', 'published_first'])
    .default('published_only'),
  // Live SMTP RCPT probing during verification. OFF by default: probing from the
  // app's IP harms sending reputation. When off we rely on MX + confidence.
  EMAIL_VERIFY_SMTP: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  // Minimum confidence for a *guessed* address to be marked contactable.
  RECRUITER_MIN_CONFIDENCE: z.coerce.number().min(0).max(1).default(0.7),
  // Shared secret guarding the /api/cron/* endpoints (Bearer token).
  CRON_SECRET: z.string().optional(),

  // Identity verification provider (KYC). 'none' disables the feature.
  IDENTITY_DRIVER: z.enum(['none', 'stripe']).default('none'),
  // FZ-03: required whenever IDENTITY_DRIVER=stripe — the webhook refuses
  // unsigned payloads, so without a secret the endpoint fail-closes.
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  REALTIME_DRIVER: z.enum(['socketio', 'pusher', 'none']).default('none'),
  SEARCH_DRIVER: z.enum(['postgres', 'meilisearch']).default('postgres'),
  PAYMENTS_DRIVER: z.enum(['manual', 'stripe', 'paypal']).default('manual'),
});

// On the client, only NEXT_PUBLIC_* vars exist; skip strict parsing there.
export const env =
  typeof window === 'undefined'
    ? schema.parse(process.env)
    : ({
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      } as unknown as z.infer<typeof schema>);
