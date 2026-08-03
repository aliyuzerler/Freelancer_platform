/**
 * Demo seeder for the external-job → recruiter-notification flow.
 * Run with:  npx tsx prisma/seed-demo.ts
 *
 * Creates a realistic scraped-style job whose recruiter contact is a real inbox,
 * a demo freelancer, and a submitted proposal — then runs the notification
 * worker so the "someone applied" email is actually sent. With the local
 * Mailhog transport it lands in http://localhost:8025.
 *
 * Point it at an inbox you control to receive the demo mail yourself:
 *   DEMO_RECRUITER_EMAIL=you@example.com npx tsx prisma/seed-demo.ts
 *
 * Idempotent: re-running won't duplicate rows.
 */
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { fanOutNotifications } from '@/lib/mail/worker';

const RECRUITER_EMAIL = process.env.DEMO_RECRUITER_EMAIL ?? 'demo-recruiter@example.com';
const COMPANY = 'Northwind Labs';
// The shell's *login* identity is the recruiter's real email, so they can sign
// in (magic link / Google / GitHub) and claim this account.
const SHELL_EMAIL = RECRUITER_EMAIL;
const JOB_SLUG = 'senior-react-engineer-remote-demo-nw1';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const DESCRIPTION = `Northwind Labs is a small, profitable remote team building analytics
tooling for climate-tech companies. We're looking for a Senior React Engineer to
own our dashboard front-end end to end.

What you'll do
• Build and ship data-heavy dashboards in React + TypeScript
• Partner with design to turn Figma into fast, accessible UI
• Improve our charting/perf story (we render a LOT of time-series)

What we're looking for
• 5+ years with React and TypeScript in production
• Comfort with Next.js, React Query, and a design-system mindset
• Bonus: data-viz (d3/visx) experience

Fully remote (EU/US overlap). To apply, reach us with a short note and links to work.`;

async function main() {
  // 1. Company shell — an UNCLAIMED client, exactly like the scraper creates.
  const shell = await db.user.upsert({
    where: { email: SHELL_EMAIL },
    update: { status: 'UNCLAIMED', name: COMPANY },
    create: {
      email: SHELL_EMAIL,
      name: COMPANY,
      role: 'CLIENT',
      status: 'UNCLAIMED',
      clientProfile: {
        create: { companyName: COMPANY, companyUrl: 'https://northwind.example.com' },
      },
    },
    select: { id: true },
  });

  // 2. Recruiter contact → the real inbox, marked contactable (a PUBLISHED
  //    address that passed verification). This is the gate the worker checks.
  await db.recruiterContact.upsert({
    where: { userId: shell.id },
    update: {
      email: RECRUITER_EMAIL,
      origin: 'PUBLISHED',
      status: 'DELIVERABLE',
      confidence: 0.9,
      contactable: true,
      suppressedAt: null,
      unsubscribedAt: null,
      verifiedAt: new Date(),
    },
    create: {
      userId: shell.id,
      email: RECRUITER_EMAIL,
      companyDomain: 'gmail.com',
      origin: 'PUBLISHED',
      status: 'DELIVERABLE',
      confidence: 0.9,
      contactable: true,
      verifiedAt: new Date(),
    },
  });

  // 3. The scraped job + its provenance (JobSource). Source only created with
  //    the job, so re-runs (update path) leave it untouched.
  const job = await db.job.upsert({
    where: { slug: JOB_SLUG },
    update: { status: 'OPEN' },
    create: {
      clientId: shell.id,
      title: 'Senior React Engineer (Remote)',
      slug: JOB_SLUG,
      description: DESCRIPTION,
      budgetType: 'FIXED',
      budgetMin: 700000, // $7,000 — minor units
      budgetMax: 900000, // $9,000
      currency: 'USD',
      status: 'OPEN',
      publishedAt: new Date(),
      source: {
        create: {
          source: 'REMOTEOK',
          externalId: 'demo-nw1',
          url: 'https://remoteok.com/remote-jobs/demo-nw1',
          publishedEmail: RECRUITER_EMAIL,
          contentHash: 'demo-seed',
        },
      },
    },
    select: { id: true, title: true },
  });

  // 4. A demo freelancer to apply as.
  const passwordHash = await bcrypt.hash('Password123', 12);
  const dev = await db.user.upsert({
    where: { email: 'demo.dev@example.com' },
    update: {},
    create: {
      email: 'demo.dev@example.com',
      passwordHash,
      name: 'Alex Rivera',
      role: 'FREELANCER',
      status: 'ACTIVE',
      freelancerProfile: {
        create: {
          headline: 'Senior Full-Stack Engineer · React/Node · 8 yrs',
          completenessScore: 82,
        },
      },
    },
    select: { id: true, name: true },
  });

  // 5. Submit a proposal — same effect as POST /api/proposals, including the
  //    recruiter notification the worker will email.
  const dup = await db.proposal.findUnique({
    where: { jobId_freelancerId: { jobId: job.id, freelancerId: dev.id } },
    select: { id: true },
  });
  if (!dup) {
    await db.proposal.create({
      data: {
        jobId: job.id,
        freelancerId: dev.id,
        coverLetter:
          "Hi! I've shipped several data-heavy React/TypeScript dashboards and love " +
          'a good time-series perf challenge. Recent work: a visx-based analytics ' +
          'suite doing 50k+ points at 60fps. Would love to help Northwind. — Alex',
        bidAmount: 850000,
        bidType: 'FIXED',
        estimatedDays: 30,
        qualityScore: 82,
      },
    });
    await db.notification.create({
      data: {
        userId: shell.id,
        type: 'PROPOSAL_RECEIVED',
        title: `New applicant for "${job.title}"`,
        body: dev.name ?? 'A freelancer',
        href: `/jobs/${job.id}/proposals`,
      },
    });
  }

  // 6. Fan out — actually send the recruiter email.
  const result = await fanOutNotifications();

  console.log('\n✓ Demo data seeded.');
  console.log('  Company (UNCLAIMED):', COMPANY);
  console.log('  Job:', job.title);
  console.log('  Recruiter login email:', RECRUITER_EMAIL);
  console.log('  Fan-out result:', JSON.stringify(result));
  console.log('\n  1. Inspect the sent email:  http://localhost:8025');
  console.log('  2. Click "View the application" →', `${APP_URL}/jobs/${JOB_SLUG}/proposals`);
  console.log(`  3. Sign in with ${RECRUITER_EMAIL} (magic link → also in Mailhog).`);
  console.log('     First sign-in claims the account (UNCLAIMED → ACTIVE).');
  console.log('  4. Reply → the demo freelancer gets a "company replied" email.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
