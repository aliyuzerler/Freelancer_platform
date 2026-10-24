import { createJobSchema, CURRENCIES, AMOUNT_MAX } from '@/lib/validations/job';
import { createProposalSchema } from '@/lib/validations/proposal';

const baseJob = {
  title: 'Build a marketing site in Next.js',
  description:
    'We need a fast, SEO-friendly marketing site with a blog and dark mode. Design provided.',
  budgetType: 'FIXED' as const,
  budgetMin: 250_000,
  budgetMax: 250_000,
};

describe('createJobSchema (FZ-26 amount/currency bounds)', () => {
  it('accepts a realistic job', () => {
    expect(() => createJobSchema.parse(baseJob)).not.toThrow();
  });

  it('rejects an unknown currency code', () => {
    expect(createJobSchema.safeParse({ ...baseJob, currency: 'XXX' }).success).toBe(false);
    expect(createJobSchema.safeParse({ ...baseJob, currency: 'usd' }).success).toBe(false);
    expect(CURRENCIES).toContain('USD');
  });

  it('rejects an absurd budget above the ceiling', () => {
    expect(
      createJobSchema.safeParse({ ...baseJob, budgetMax: AMOUNT_MAX + 1 }).success,
    ).toBe(false);
  });

  it('rejects budgetMax below budgetMin', () => {
    expect(
      createJobSchema.safeParse({ ...baseJob, budgetMin: 500, budgetMax: 100 }).success,
    ).toBe(false);
  });
});

describe('createProposalSchema (FZ-26 bid bounds)', () => {
  const base = {
    jobId: 'cjld2cjxh0000qzrmn831i7rn',
    coverLetter: 'x'.repeat(40),
    bidAmount: 100,
    bidType: 'FIXED' as const,
  };

  it('accepts a realistic bid', () => {
    expect(() => createProposalSchema.parse(base)).not.toThrow();
  });

  it('rejects a bid over the ceiling', () => {
    expect(createProposalSchema.safeParse({ ...base, bidAmount: AMOUNT_MAX + 1 }).success).toBe(
      false,
    );
  });
});
