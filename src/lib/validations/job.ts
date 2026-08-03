import { z } from 'zod';

/**
 * Shared job validation — used by both the API route and the client form,
 * so the rules live in exactly one place.
 */
export const createJobSchema = z
  .object({
    title: z.string().min(8, 'Give your job a descriptive title').max(120),
    description: z.string().min(40, 'Describe the work in a bit more detail').max(20_000),
    budgetType: z.enum(['HOURLY', 'FIXED']),
    // Amounts are entered in major units in the UI and converted to minor units
    // (cents) before hitting the API. Here we validate the minor-unit integers.
    budgetMin: z.number().int().nonnegative().optional(),
    budgetMax: z.number().int().nonnegative().optional(),
    currency: z.string().length(3).default('USD'),
    experience: z.enum(['ENTRY', 'INTERMEDIATE', 'EXPERT']).default('INTERMEDIATE'),
    estimatedDays: z.number().int().positive().max(3650).optional(),
    skillIds: z.array(z.string().cuid()).max(15).default([]),
  })
  .refine(
    (v) => v.budgetMin == null || v.budgetMax == null || v.budgetMax >= v.budgetMin,
    { message: 'Maximum budget must be greater than or equal to the minimum', path: ['budgetMax'] },
  );

export type CreateJobInput = z.infer<typeof createJobSchema>;
