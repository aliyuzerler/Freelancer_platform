import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getTranslations } from 'next-intl/server';

/**
 * Small, consistent helpers for API route responses so every endpoint returns
 * the same JSON shape: `{ data }` on success, `{ error }` on failure.
 *
 * Error bodies are language-neutral: `message` is either a stable key from the
 * message catalogs (`errors.*` / `val.*` — resolved to the visitor's language
 * on the client) or free-form text (passed through as-is). This keeps the API
 * locale-independent while the UI stays fully localized.
 */

/** Message keys are localized server-side when a request locale is present. */
async function resolveMessage(message: string): Promise<string> {
  if (!/^(errors|val)\./.test(message)) return message;
  try {
    const t = await getTranslations();
    return t(message as never);
  } catch {
    // No request context (cron, workers): the key travels to the client.
    return message;
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, { status: 200, ...init });
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export async function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { error: { message: await resolveMessage(message), details } },
    { status },
  );
}

export function unauthorized() {
  return fail('errors.authRequired', 401);
}

export function forbidden(message = 'errors.forbidden') {
  return fail(message, 403);
}

/**
 * Wrap a route handler so thrown ZodErrors become 422s and unexpected errors
 * become 500s — without leaking stack traces to clients. Zod field messages
 * are `val.*` keys by design and are localized on the client.
 */
export function handle(fn: () => Promise<Response>): Promise<Response> {
  return fn().catch((err) => {
    if (err instanceof ZodError) {
      return fail('errors.validationFailed', 422, err.flatten());
    }
    console.error('[api] unhandled error', err);
    return fail('errors.somethingWentWrong', 500);
  });
}
