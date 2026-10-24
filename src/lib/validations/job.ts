import { z } from 'zod';

/**
 * Currencies the platform accepts (FZ-26). A free-form three-letter string let
 * "XXX"/"ZZZ" (and typos) into the ledger and made reporting inconsistent.
 * Extend this list deliberately — every entry must be a real ISO-4217 code.
 */
export const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'TRY', 'CHF', 'CAD', 'AUD', 'NZD', 'JPY', 'PLN',
  'SEK', 'NOK', 'DKK', 'CZK', 'HUF', 'RON', 'BGN', 'AED', 'SAR', 'ILS',
] as const;

/** Hard ceiling for budget amounts in minor units: 10,000,000 major units. */
export const AMOUNT_MAX = 1_000_000_000;

/**
 * Shared job validation — used by both the API route and the client form,
 * so the rules live in exactly one place.
 */
export const createJobSchema = z
  .object({
    title: z.string().min(8, 'val.jobTitleMin').max(120),
    description: z.string().min(40, 'val.jobDescriptionMin').max(20_000),
    budgetType: z.enum(['HOURLY', 'FIXED']),
    // Amounts are entered in major units in the UI and converted to minor units
    // (cents) before hitting the API. Here we validate the minor-unit integers.
    budgetMin: z.number().int().nonnegative().max(AMOUNT_MAX).optional(),
    budgetMax: z.number().int().nonnegative().max(AMOUNT_MAX).optional(),
    currency: z.enum(CURRENCIES).default('USD'),
    experience: z.enum(['ENTRY', 'INTERMEDIATE', 'EXPERT']).default('INTERMEDIATE'),
    estimatedDays: z.number().int().positive().max(3650).optional(),
    skillIds: z.array(z.string().cuid()).max(15).default([]),
  })
  .refine(
    (v) => v.budgetMin == null || v.budgetMax == null || v.budgetMax >= v.budgetMin,
    { message: 'val.budgetMaxGte', path: ['budgetMax'] },
  );

export type CreateJobInput = z.infer<typeof createJobSchema>;
