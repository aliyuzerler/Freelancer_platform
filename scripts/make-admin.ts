/**
 * Promote a user to ADMIN (and approve them), so they can reach /admin/approvals.
 *
 *   npx tsx scripts/make-admin.ts you@example.com
 *
 * Admin is deliberately not self-serve in the UI — there is no "become admin"
 * button — so the first admin is bootstrapped here by someone with server access.
 *
 * Wrapped in main() rather than using top-level await: this package is CommonJS,
 * where top-level await is unavailable.
 */
import { db } from '@/lib/db';

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: npx tsx scripts/make-admin.ts <email>');
    process.exit(1);
  }

  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    console.error(`No user found with email "${email}".`);
    process.exit(1);
  }

  await db.user.update({
    where: { email },
    data: {
      role: 'ADMIN',
      // An admin must be past onboarding themselves to use the app.
      approvedAt: new Date(),
      emailVerified: new Date(),
    },
  });

  console.log(`✓ ${email} is now an ADMIN (approved + email verified).`);
  console.log('  Sign out and back in, then open /admin/approvals.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
