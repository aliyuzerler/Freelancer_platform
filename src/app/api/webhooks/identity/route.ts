import { db } from '@/lib/db';
import { ok, fail, handle } from '@/lib/api';
import { getIdentityAdapter } from '@/lib/adapters/identity';
import { verifyStripeSignature } from '@/lib/webhook-signature';
import { sendMail } from '@/lib/mail/send';

/**
 * POST /api/webhooks/identity — provider callback with the verification result.
 *
 * FZ-03: the `stripe-signature` header is verified against
 * STRIPE_WEBHOOK_SECRET before anything is acted on. Previously any JSON body
 * reached the handler, so a forged "verified" event could grant the KYC badge
 * without a KYC flow. Fail closed: a misconfigured deployment refuses the
 * webhook rather than trusting unsigned payloads.
 */
export function POST(req: Request) {
  return handle(async () => {
    const adapter = getIdentityAdapter();
    if (!adapter.configured) return fail('Identity verification is not enabled', 503);

    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      console.error('[webhook:identity] STRIPE_WEBHOOK_SECRET is not set — refusing payload');
      return fail('Webhook is not configured', 503);
    }

    const raw = await req.text();
    if (!verifyStripeSignature(raw, req.headers.get('stripe-signature'), secret)) {
      return fail('Invalid signature', 400);
    }

    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      return fail('Invalid payload', 400);
    }

    const result = adapter.parseWebhook(payload);
    if (!result) return ok({ ignored: true });

    const user = await db.user.findFirst({
      where: { identityRef: result.ref },
      select: { id: true, email: true, name: true, identityStatus: true },
    });
    if (!user) return ok({ ignored: true });
    if (user.identityStatus === result.status) return ok({ duplicate: true });

    await db.user.update({
      where: { id: user.id },
      data: {
        identityStatus: result.status,
        identityVerifiedAt: result.status === 'VERIFIED' ? new Date() : null,
      },
    });
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: `identity.${result.status.toLowerCase()}`,
        entity: 'User',
        entityId: user.id,
      },
    });

    if (user.email && result.status !== 'PROCESSING') {
      await sendMail(
        user.email,
        result.status === 'VERIFIED' ? 'Your identity is verified' : 'Identity check unsuccessful',
        result.status === 'VERIFIED'
          ? `Hi ${user.name ?? 'there'},\n\nYour identity has been verified — a verified badge now shows on your public profile.`
          : `Hi ${user.name ?? 'there'},\n\nWe couldn't verify your identity from the documents provided. You can try again from your security settings.`,
      );
    }

    return ok({ status: result.status });
  });
}
