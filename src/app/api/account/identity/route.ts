import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { ok, fail, unauthorized, handle } from '@/lib/api';
import { env } from '@/lib/env';
import { getIdentityAdapter } from '@/lib/adapters/identity';

/** POST /api/account/identity — begin identity verification. */
export function POST() {
  return handle(async () => {
    const session = await auth();
    if (!session?.user) return unauthorized();

    const adapter = getIdentityAdapter();
    if (!adapter.configured) {
      return fail('Identity verification is not enabled on this instance', 503);
    }

    const me = await db.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, identityStatus: true },
    });
    if (me?.identityStatus === 'VERIFIED') return fail('You are already verified', 409);

    const { url, ref } = await adapter.startVerification({
      userId: session.user.id,
      email: me?.email ?? null,
      returnUrl: `${env.NEXT_PUBLIC_APP_URL}/settings/security?identity=done`,
    });

    await db.user.update({
      where: { id: session.user.id },
      data: {
        identityStatus: 'PENDING',
        identityProvider: adapter.driver,
        identityRef: ref,
      },
    });
    await db.auditLog.create({
      data: { userId: session.user.id, action: 'identity.session_started', entity: 'User' },
    });

    // The hosted flow shows the QR hand-off to continue on a phone camera.
    return ok({ url });
  });
}
