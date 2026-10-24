import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { ok, handle } from '@/lib/api';
import { registerSchema } from '@/lib/validations/auth';
import { sendVerificationEmail } from '@/lib/verification';

/**
 * POST /api/register — create a credentials-based account.
 * Passwords are hashed with bcrypt (cost 12). The account stays inert until
 * the email is confirmed: password sign-in is refused until emailVerified is
 * set, which is what neutralizes pre-account-takeover traps (FZ-01).
 *
 * FZ-10: every code path returns the exact same generic response, so response
 * differences cannot reveal whether an address already has an account.
 */
export function POST(req: Request) {
  return handle(async () => {
    const body = registerSchema.parse(await req.json());

    const GENERIC = { ok: true, pending: 'email_verification' } as const;

    const existing = await db.user.findUnique({ where: { email: body.email } });
    if (existing) {
      // An inert, never-verified duplicate is most often the same person who
      // lost the first mail — re-send the confirmation. Verified accounts and
      // provider/shell identities are left alone (no unsolicited email), and
      // the response stays identical either way. A per-address resend cap is
      // enforced inside sendMail, so this cannot be used to flood an inbox.
      if (existing.passwordHash && !existing.emailVerified) {
        await sendVerificationEmail({ email: existing.email, name: existing.name }).catch(
          (err) => console.error('[register] verification re-send failed', err),
        );
      }
      return ok(GENERIC);
    }

    const passwordHash = await bcrypt.hash(body.password, 12);

    const name = `${body.firstName} ${body.lastName}`;
    const user = await db.user.create({
      data: {
        name,
        email: body.email,
        passwordHash,
        role: body.role,
        // Create the matching profile row for the chosen role.
        ...(body.role === 'FREELANCER'
          ? { freelancerProfile: { create: {} } }
          : {
              clientProfile: {
                create: { companyName: body.companyName || undefined },
              },
            }),
      },
      select: { id: true, email: true, role: true },
    });

    // A company the directory didn't know yet becomes part of it.
    if (body.role === 'CLIENT' && body.companyName) {
      await db.company.upsert({
        where: { name: body.companyName },
        update: {},
        create: { name: body.companyName },
      });
    }

    await db.auditLog.create({
      data: { userId: user.id, action: 'user.register', entity: 'User', entityId: user.id },
    });

    // Email confirmation is now the activation gate — send it right away.
    // Best-effort: a mail hiccup must never fail registration.
    await sendVerificationEmail({ email: user.email, name }).catch((err) =>
      console.error('[register] verification email failed', err),
    );

    return ok(GENERIC);
  });
}
