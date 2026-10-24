/**
 * Seed script — creates a demo dataset so a fresh clone has something to look at.
 * Run with: npm run db:seed
 *
 * Idempotent-ish: uses upserts on stable keys so re-running won't duplicate.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

const SKILLS = [
  ['TypeScript', 'Web Development'],
  ['React', 'Web Development'],
  ['Next.js', 'Web Development'],
  ['Node.js', 'Web Development'],
  ['UI/UX Design', 'Design'],
  ['Figma', 'Design'],
  ['Copywriting', 'Writing'],
  ['SEO', 'Marketing'],
] as const;

// 50 roots × 20 suffixes = 1,000 deterministic company names for the sign-up
// directory combobox.
const COMPANY_ROOTS = [
  'Acme', 'Globex', 'Initech', 'Hooli', 'Umbrella', 'Stark', 'Wayne', 'Cyberdyne', 'Aperture',
  'Oscorp', 'Nexon', 'Vanta', 'Lumen', 'Pinnacle', 'Vertex', 'Quantum', 'Zenith', 'Aurora',
  'Cascade', 'Summit', 'Harbor', 'Beacon', 'Catalyst', 'Dynamo', 'Ember', 'Falcon', 'Granite',
  'Horizon', 'Ironwood', 'Juniper', 'Keystone', 'Lattice', 'Meridian', 'Northstar', 'Onyx',
  'Polaris', 'Quasar', 'Ridgeline', 'Solstice', 'Tundra', 'Uplift', 'Vector', 'Willow', 'Xenial',
  'Yield', 'Zephyr', 'Cobalt', 'Sable', 'Treeline',
];
const COMPANY_SUFFIXES = [
  'Labs', 'Systems', 'Group', 'Works', 'Studio', 'Partners', 'Industries', 'Ventures',
  'Solutions', 'Collective', 'Technologies', 'Digital', 'Agency', 'Co', 'Inc', 'Consulting',
  'Dynamics', 'Networks', 'Analytics', 'Software',
];

async function main() {
  // FZ-16: the seed creates accounts with a well-known password, including an
  // ADMIN. That must never happen against a real deployment.
  if (process.env.NODE_ENV === 'production') {
    console.error(
      'Refusing to seed demo data (known-password accounts, including an ADMIN) ' +
        'into a production environment. Set NODE_ENV=development or clear NODE_ENV ' +
        'and seed a staging database explicitly if you really intend this.',
    );
    process.exit(1);
  }

  const password = await bcrypt.hash('Password123', 12);

  // Skills taxonomy
  const skills = await Promise.all(
    SKILLS.map(([name, category]) =>
      db.skill.upsert({
        where: { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
        update: {},
        create: { name, category, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
      }),
    ),
  );

  // An admin (reviews new accounts in the approval queue)
  await db.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Site Admin',
      passwordHash: password,
      role: 'ADMIN',
      emailVerified: new Date(),
      approvedAt: new Date(),
    },
  });

  // A client
  const client = await db.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      name: 'Acme Startup',
      passwordHash: password,
      role: 'CLIENT',
      emailVerified: new Date(),
      approvedAt: new Date(),
      clientProfile: { create: { companyName: 'Acme Inc.', paymentVerified: true, emailVerified: true } },
    },
  });

  // A freelancer
  const freelancer = await db.user.upsert({
    where: { email: 'freelancer@example.com' },
    update: {},
    create: {
      email: 'freelancer@example.com',
      name: 'Jordan Dev',
      passwordHash: password,
      role: 'FREELANCER',
      emailVerified: new Date(),
      approvedAt: new Date(),
      freelancerProfile: {
        create: {
          headline: 'Senior Full-Stack Engineer',
          bio: 'I build fast, accessible web apps with React, Next.js and TypeScript.',
          hourlyRate: 8500,
          availability: 'OPEN_TO_WORK',
          completenessScore: 85,
          ratingAvg: 4.9,
          ratingCount: 12,
        },
      },
    },
  });

  // The company directory behind the sign-up combobox (1,000 names).
  await db.company.createMany({
    data: COMPANY_ROOTS.flatMap((root) =>
      COMPANY_SUFFIXES.map((suffix) => ({ name: `${root} ${suffix}` })),
    ),
    skipDuplicates: true,
  });

  // A job
  await db.job.upsert({
    where: { slug: 'build-a-marketing-site-demo' },
    update: {},
    create: {
      slug: 'build-a-marketing-site-demo',
      clientId: client.id,
      title: 'Build a marketing site in Next.js',
      description:
        'We need a fast, SEO-friendly marketing site with a blog and dark mode. Design in Figma provided. ~2 weeks.',
      budgetType: 'FIXED',
      budgetMin: 250000,
      budgetMax: 250000,
      experience: 'EXPERT',
      estimatedDays: 14,
      status: 'OPEN',
      publishedAt: new Date(),
      skills: {
        create: skills
          .filter((s) => ['Next.js', 'React', 'TypeScript'].includes(s.name))
          .map((s) => ({ skillId: s.id })),
      },
    },
  });

  console.log('✅ Seed complete.');
  console.log('   Admin:      admin@example.com / Password123');
  console.log('   Client:     client@example.com / Password123');
  console.log('   Freelancer: freelancer@example.com / Password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
