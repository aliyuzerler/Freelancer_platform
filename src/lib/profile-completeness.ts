import { db } from '@/lib/db';

/**
 * Profile completeness (0–100).
 *
 * The score is a denormalized column (FreelancerProfile.completenessScore)
 * because it drives sorting and the proposal quality score, so it must be
 * recomputed whenever anything feeding it changes — that is what `recompute`
 * below is for.
 *
 * Weights reflect what a client actually looks at when deciding to reply.
 */
export interface CompletenessInput {
  headline: string | null;
  bio: string | null;
  location: string | null;
  hourlyRate: number | null;
  yearsExperience: number | null;
  timezone: string | null;
  image: string | null;
  skillCount: number;
  portfolioCount: number;
  linkCount: number;
}

const WEIGHTS: { key: keyof CompletenessInput | 'links'; points: number; met: (i: CompletenessInput) => boolean }[] = [
  { key: 'headline', points: 15, met: (i) => !!i.headline?.trim() },
  { key: 'image', points: 15, met: (i) => !!i.image },
  { key: 'bio', points: 20, met: (i) => (i.bio?.trim().length ?? 0) >= 80 },
  { key: 'location', points: 10, met: (i) => !!i.location?.trim() },
  { key: 'hourlyRate', points: 10, met: (i) => (i.hourlyRate ?? 0) > 0 },
  { key: 'skillCount', points: 10, met: (i) => i.skillCount >= 3 },
  { key: 'portfolioCount', points: 10, met: (i) => i.portfolioCount >= 1 },
  { key: 'links', points: 5, met: (i) => i.linkCount >= 1 },
  { key: 'yearsExperience', points: 3, met: (i) => (i.yearsExperience ?? 0) > 0 },
  { key: 'timezone', points: 2, met: (i) => !!i.timezone?.trim() },
];

export function computeCompleteness(input: CompletenessInput): number {
  const score = WEIGHTS.reduce((sum, w) => sum + (w.met(input) ? w.points : 0), 0);
  return Math.max(0, Math.min(100, score));
}

/** What is still missing, most valuable first — used to nudge the user. */
export function missingItems(input: CompletenessInput): string[] {
  const labels: Record<string, string> = {
    headline: 'Add a headline',
    image: 'Add a profile photo',
    bio: 'Write a bio (80+ characters)',
    location: 'Add your location',
    hourlyRate: 'Set your hourly rate',
    skillCount: 'Add at least 3 skills',
    portfolioCount: 'Add a portfolio item',
    links: 'Add a professional link',
    yearsExperience: 'Add years of experience',
    timezone: 'Add your timezone',
  };
  return WEIGHTS.filter((w) => !w.met(input))
    .sort((a, b) => b.points - a.points)
    .map((w) => labels[w.key as string] ?? String(w.key));
}

/**
 * Recompute and persist the score for one user. Safe to call after any profile
 * write (details, avatar, skills, portfolio); a no-op when the user has no
 * freelancer profile.
 */
export async function recomputeCompleteness(userId: string): Promise<number | null> {
  const profile = await db.freelancerProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      headline: true,
      bio: true,
      location: true,
      hourlyRate: true,
      yearsExperience: true,
      timezone: true,
      websiteUrl: true,
      githubUrl: true,
      linkedinUrl: true,
      dribbbleUrl: true,
      behanceUrl: true,
      stackoverflowUrl: true,
      xUrl: true,
      user: { select: { image: true } },
      _count: { select: { skills: true, portfolioItems: true } },
    },
  });
  if (!profile) return null;

  const linkCount = [
    profile.websiteUrl,
    profile.githubUrl,
    profile.linkedinUrl,
    profile.dribbbleUrl,
    profile.behanceUrl,
    profile.stackoverflowUrl,
    profile.xUrl,
  ].filter(Boolean).length;

  const score = computeCompleteness({
    headline: profile.headline,
    bio: profile.bio,
    location: profile.location,
    hourlyRate: profile.hourlyRate,
    yearsExperience: profile.yearsExperience,
    timezone: profile.timezone,
    image: profile.user.image,
    skillCount: profile._count.skills,
    portfolioCount: profile._count.portfolioItems,
    linkCount,
  });

  await db.freelancerProfile.update({
    where: { id: profile.id },
    data: { completenessScore: score },
  });
  return score;
}
