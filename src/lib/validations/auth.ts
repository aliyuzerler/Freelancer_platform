import { z } from 'zod';

// Letters (any language), apostrophes, hyphens, spaces — e.g. "José", "O'Neill",
// "Anne-Marie". Blocks digits/symbols that have no place in a legal name.
const nameField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(50, `${label} is too long`)
    .regex(/^[\p{L}\p{M}'’ -]+$/u, `${label} contains invalid characters`);

export const registerSchema = z
  .object({
    firstName: nameField('First name'),
    lastName: nameField('Last name'),
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .max(100)
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string(),
    role: z.enum(['CLIENT', 'FREELANCER']).default('CLIENT'),
    // Clients only: picked from the company directory or added as new.
    companyName: z.string().trim().max(120).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
