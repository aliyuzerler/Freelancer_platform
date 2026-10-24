import { z } from 'zod';

// Letters (any language), apostrophes, hyphens, spaces — e.g. "José", "O'Neill",
// "Anne-Marie". Blocks digits/symbols that have no place in a legal name.
//
// All validation messages are stable message keys (`val.*`), localized through
// the message catalogs on the client (see src/i18n/msg.ts). This keeps the
// schemas locale-independent while every form renders localized errors.
const nameField = (prefix: string) =>
  z
    .string()
    .trim()
    .min(1, `${prefix}Required`)
    .max(50, `${prefix}TooLong`)
    .regex(/^[\p{L}\p{M}'’ -]+$/u, `${prefix}InvalidChars`);

export const registerSchema = z
  .object({
    firstName: nameField('val.firstName'),
    lastName: nameField('val.lastName'),
    email: z.string().trim().toLowerCase().email('val.emailInvalid'),
    password: z
      .string()
      .min(8, 'val.passwordMin')
      .max(100, 'val.passwordMax')
      .regex(/[a-z]/, 'val.passwordLowercase')
      .regex(/[A-Z]/, 'val.passwordUppercase')
      .regex(/[0-9]/, 'val.passwordDigit'),
    confirmPassword: z.string(),
    role: z.enum(['CLIENT', 'FREELANCER']).default('CLIENT'),
    // Clients only: picked from the company directory or added as new.
    companyName: z.string().trim().max(120, 'val.companyNameTooLong').optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'val.passwordMismatch',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
