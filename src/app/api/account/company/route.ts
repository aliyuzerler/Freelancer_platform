import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { ok, forbidden, unauthorized, handle } from '@/lib/api';

// FZ-14: z.string().url() happily accepts "javascript:alert(1)" — a stored
// value that later renders as an href. Require an http(s) URL explicitly.
const httpUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => {
    if (v === '') return true;
    try {
      const u = new URL(v);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Enter a valid https:// URL');

const schema = z.object({
  companyName: z.string().trim().max(120).optional(),
  companyUrl: httpUrl.or(z.literal('')).optional(),
  about: z.string().trim().max(5000).optional(),
  location: z.string().trim().max(120).optional(),
});

/**
 * POST /api/account/company — the client's public identity. This is the name
 * freelancers see on your postings and messages, so it is worth filling in.
 */
export function POST(req: Request) {
  return handle(async () => {
    const session = await auth();
    if (!session?.user) return unauthorized();
    if (!['CLIENT', 'AGENCY_OWNER', 'ADMIN'].includes(session.user.role)) return forbidden();

    const body = schema.parse(await req.json());
    // Empty string clears; undefined leaves untouched.
    const data = {
      ...(body.companyName !== undefined ? { companyName: body.companyName || null } : {}),
      ...(body.companyUrl !== undefined ? { companyUrl: body.companyUrl || null } : {}),
      ...(body.about !== undefined ? { about: body.about || null } : {}),
      ...(body.location !== undefined ? { location: body.location || null } : {}),
    };

    await db.clientProfile.upsert({
      where: { userId: session.user.id },
      update: data,
      create: { userId: session.user.id, ...data },
    });

    return ok(data);
  });
}
