import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { ok, fail, unauthorized, handle } from '@/lib/api';
import { isValidIban, looksLikeIban } from '@/lib/validations/iban';
import { sendMail } from '@/lib/mail/send';

const setSchema = z.object({
  provider: z.enum(['STRIPE_CONNECT', 'PAYPAL', 'WISE', 'MANUAL', 'CRYPTO_USDC']),
  // Display-only identifier (PayPal email, IBAN, wallet, …). Never a secret.
  detail: z.string().trim().max(200).optional(),
  // Account holder name — required for bank transfers (a wire needs both).
  holderName: z.string().trim().max(120).optional(),
});

/**
 * Per-provider sanity checks. This is NOT gateway verification (Freelancezero
 * is non-custodial — money never flows through us), but typos in payout
 * details cost people real money, so the obvious mistakes are caught here.
 */
function validateDetail(provider: string, detail: string | undefined, holderName: string | undefined) {
  if (provider === 'MANUAL') {
    if (!holderName) return 'Account holder name is required for bank transfers';
    if (detail && looksLikeIban(detail) && !isValidIban(detail)) {
      return 'That IBAN fails its checksum — please double-check it';
    }
  }
  if (provider === 'PAYPAL' && detail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(detail)) {
    return 'Enter a valid PayPal email address';
  }
  if (provider === 'CRYPTO_USDC' && detail && !/^0x[a-fA-F0-9]{40}$/.test(detail)) {
    return 'Enter a valid EVM wallet address (0x…)';
  }
  return null;
}

/** GET /api/account/payout — the signed-in user's own payout method (or null). */
export function GET() {
  return handle(async () => {
    const session = await auth();
    if (!session?.user) return unauthorized();
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { payoutProvider: true, payoutDetail: true, payoutHolderName: true },
    });
    return ok({
      provider: user?.payoutProvider ?? null,
      detail: user?.payoutDetail ?? null,
      holderName: user?.payoutHolderName ?? null,
    });
  });
}

/** POST /api/account/payout — set/replace the user's payout method. */
export function POST(req: Request) {
  return handle(async () => {
    const session = await auth();
    if (!session?.user) return unauthorized();
    const { provider, detail, holderName } = setSchema.parse(await req.json());

    const invalid = validateDetail(provider, detail, holderName);
    if (invalid) return fail(invalid, 422);

    await db.user.update({
      where: { id: session.user.id },
      data: {
        payoutProvider: provider,
        payoutDetail: detail || null,
        payoutHolderName: holderName || null,
      },
    });

    // Security notification — payout-detail changes are a classic fraud vector.
    if (session.user.email) {
      await sendMail(
        session.user.email,
        'Your payout method was updated',
        `Hi ${session.user.name ?? 'there'},\n\n` +
          `The payout method on your Freelancezero account was set to ${provider.toLowerCase().replace('_', ' ')}.\n\n` +
          `If you didn't make this change, secure your account immediately: [Account settings](${process.env.NEXT_PUBLIC_APP_URL}/settings/payments)`,
      );
    }

    return ok({ provider, detail: detail || null, holderName: holderName || null });
  });
}

/** DELETE /api/account/payout — remove the user's payout method. */
export function DELETE() {
  return handle(async () => {
    const session = await auth();
    if (!session?.user) return unauthorized();
    await db.user.update({
      where: { id: session.user.id },
      data: { payoutProvider: null, payoutDetail: null, payoutHolderName: null },
    });
    return ok({ provider: null, detail: null });
  });
}
