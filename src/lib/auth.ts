import NextAuth, { type DefaultSession } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Nodemailer from 'next-auth/providers/nodemailer';
import type { Provider } from 'next-auth/providers';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getTransport, MAIL_FROM } from '@/lib/mail/transport';
import type { UserRole } from '@prisma/client';

/** Recruiter / verification tokens are stored only as SHA-256 digests (FZ-17). */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * How often an established JWT session re-syncs status/role from the DB
 * (FZ-04 session revocation + FZ-06 role freshness). JWT sessions are not
 * backed by a DB read per request by design; a banned or demoted user's
 * session therefore dies within this window instead of surviving 30 days.
 */
const SESSION_RECHECK_MS = 5 * 60 * 1000;

/** OAuth providers whose sign-in proves the email address owner. */
const OAUTH_PROVIDERS = new Set(['google', 'github']);

// Extend the session type so `session.user.role` / `.id` are strongly typed.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession['user'];
  }
}

const credentialsSchema = z.object({
  // Normalized the same way as registration, so casing never breaks sign-in.
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
});

/**
 * Providers are added conditionally: if a provider's credentials are absent
 * from the environment, its button simply won't appear. This keeps the
 * self-hosting story simple — enable only what you configure.
 */
const providers: Provider[] = [
  /**
   * One-click sign-in for recruiters from the "someone applied" email.
   *
   * The emailed link carries a high-entropy token (RecruiterAccessToken),
   * scoped to one company shell and expiring after 7 days.
   *
   * Deliberately NOT single-use: corporate mail scanners routinely pre-fetch
   * links, which would burn a one-shot token before the human ever clicks and
   * leave them staring at "link expired". The bounded window is the mitigation
   * instead. `usedAt` records first use for the audit trail only.
   */
  Credentials({
    id: 'recruiter-token',
    name: 'Recruiter link',
    credentials: { token: {} },
    async authorize(raw) {
      const token = typeof raw?.token === 'string' ? raw.token : null;
      if (!token) return null;

      // Tokens are stored hashed (FZ-17); a DB leak does not leak usable links.
      const row = await db.recruiterAccessToken.findUnique({
        where: { token: hashToken(token) },
        select: { id: true, userId: true, expiresAt: true, usedAt: true },
      });
      if (!row) return null;
      if (row.expiresAt && row.expiresAt < new Date()) return null;

      const user = await db.user.findUnique({
        where: { id: row.userId },
        select: { id: true, email: true, name: true, image: true, deletedAt: true, status: true },
      });
      // FZ-04: suspended/banned/deleted accounts cannot authenticate, period.
      // UNCLAIMED shells may still claim themselves via a fresh token link.
      if (!user || user.deletedAt || (user.status !== 'ACTIVE' && user.status !== 'UNCLAIMED')) {
        return null;
      }

      // Record first use (audit trail), then the sign-in itself.
      if (!row.usedAt) {
        await db.recruiterAccessToken.update({
          where: { id: row.id },
          data: { usedAt: new Date() },
        });
      }
      await db.auditLog.create({
        data: { userId: user.id, action: 'user.login_recruiter_link', entity: 'User' },
      });

      return { id: user.id, email: user.email, name: user.name, image: user.image };
    },
  }),

  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(raw) {
      const parsed = credentialsSchema.safeParse(raw);
      if (!parsed.success) return null;

      const user = await db.user.findUnique({
        where: { email: parsed.data.email },
      });
      if (!user?.passwordHash) return null;

      const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!ok) return null;

      // FZ-01: an unverified password account is inert. This is what makes
      // pre-account-takeover traps useless — an attacker who registers with a
      // victim's email can never activate or link that account, and the
      // sign-in event strips the stale hash when the rightful owner arrives
      // via a verified OAuth provider.
      if (!user.emailVerified) return null;

      // FZ-04: suspended/banned/deleted accounts must never sign in again.
      if (user.deletedAt || user.status !== 'ACTIVE') return null;

      // 2FA, when enabled, is verified in a dedicated step after this.
      return { id: user.id, email: user.email, name: user.name, image: user.image };
    },
  }),
];

// `allowDangerousEmailAccountLinking` lets a Google/GitHub sign-in attach to an
// existing user with the same (provider-verified) email. This is safe under
// three compensating controls (FZ-01): (1) password sign-in requires a
// verified email, so an attacker cannot pre-create an activated trap account;
// (2) the sign-in event strips any unverified stale password hash at the
// moment of linking; (3) linking into a *verified* account requires the
// provider to have verified the very same address.
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google({ allowDangerousEmailAccountLinking: true }));
}
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(GitHub({ allowDangerousEmailAccountLinking: true }));
}
if (process.env.EMAIL_SERVER_HOST || process.env.RESEND_API_KEY) {
  providers.push(
    Nodemailer({
      // Prefer an explicit SMTP server (e.g. local Mailhog); otherwise fall back
      // to Resend — so magic-link login works in production (Resend, no
      // EMAIL_SERVER_HOST) too. Actual delivery goes through getTransport() in
      // sendVerificationRequest below; this `server` just needs to be valid.
      server: process.env.EMAIL_SERVER_HOST
        ? {
            host: process.env.EMAIL_SERVER_HOST,
            port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
            auth:
              process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD
                ? {
                    user: process.env.EMAIL_SERVER_USER,
                    pass: process.env.EMAIL_SERVER_PASSWORD,
                  }
                : undefined,
          }
        : {
            host: 'smtp.resend.com',
            port: 465,
            secure: true,
            auth: { user: 'resend', pass: process.env.RESEND_API_KEY ?? '' },
          },
      from: process.env.EMAIL_FROM,
      // Send through our shared transport, which correctly skips SMTP AUTH when
      // no credentials are set (e.g. local Mailhog). The provider's built-in
      // transport otherwise attempts PLAIN auth and fails against auth-less MTAs.
      async sendVerificationRequest({ identifier, url }) {
        const t = await getTranslations({ locale: routing.defaultLocale, namespace: 'emails' });
        const transport = getTransport();
        if (!transport) throw new Error('Email transport is not configured');
        await transport.sendMail({
          to: identifier,
          from: MAIL_FROM,
          subject: t('magicLink.subject'),
          text: `${t('magicLink.heading')}\n${url}\n\n${t('magicLink.ignore')}`,
          html: `<p>${t('magicLink.heading')}</p><p><a href="${url}">${t('magicLink.button')}</a></p><p style="color:#777;font-size:13px">${t('magicLink.paste')}<br/>${url}</p>`,
        });
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  // JWT sessions keep the credentials provider working without a DB round-trip
  // on every request; Auth.js requires this strategy alongside Credentials.
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers,
  events: {
    // First successful sign-in "claims" a scraped recruiter shell: an UNCLAIMED
    // account becomes a normal ACTIVE user with a verified email. Any auth
    // method (magic link, Google, GitHub) triggers this.
    async signIn({ user, account }) {
      if (!user?.id) return;
      await db.user.updateMany({
        where: { id: user.id, status: 'UNCLAIMED' },
        data: { status: 'ACTIVE', emailVerified: new Date() },
      });

      // FZ-01: when an OAuth provider links into an account that still has a
      // password hash but never verified its email, that hash is a takeover
      // trap planted before the real owner arrived. Strip it and audit.
      if (account?.provider && OAUTH_PROVIDERS.has(account.provider)) {
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { passwordHash: true, emailVerified: true },
        });
        if (dbUser?.passwordHash && !dbUser.emailVerified) {
          await db.user.update({
            where: { id: user.id },
            data: { passwordHash: null },
          });
          await db.auditLog.create({
            data: {
              userId: user.id,
              action: 'security.unverified_password_hash_cleared',
              entity: 'User',
              entityId: user.id,
            },
          });
        }
      }
    },
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On sign-in, enrich the token with the user's role and photo.
      if (user?.id) {
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true, image: true, name: true },
        });
        token.role = dbUser?.role ?? 'CLIENT';
        token.uid = user.id;
        token.picture = dbUser?.image ?? null;
        token.name = dbUser?.name ?? token.name;
        token.chk = Date.now();
        return token;
      }
      if (trigger === 'update' && token.uid) {
        // Profile changed (e.g. avatar upload). JWT sessions are not backed by
        // a DB read per request, so the client calls `useSession().update()`
        // and we re-sync the mutable fields here.
        const dbUser = await db.user.findUnique({
          where: { id: token.uid as string },
          select: { role: true, image: true, name: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.picture = dbUser.image ?? null;
          token.name = dbUser.name ?? token.name;
        }
        token.chk = Date.now();
        return token;
      }
      // FZ-04 (session revocation) + FZ-06 (role freshness): an established
      // session periodically re-checks the account state. A banned, suspended,
      // deleted, or demoted account loses its session within SESSION_RECHECK_MS
      // instead of keeping stale privileges for the token lifetime. Returning
      // null invalidates the session.
      const lastCheck = typeof token.chk === 'number' ? token.chk : 0;
      if (token.uid && Date.now() - lastCheck > SESSION_RECHECK_MS) {
        const dbUser = await db.user.findUnique({
          where: { id: token.uid as string },
          select: { role: true, status: true, deletedAt: true },
        });
        if (!dbUser || dbUser.deletedAt || dbUser.status !== 'ACTIVE') return null;
        token.role = dbUser.role;
        token.chk = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.role = token.role as UserRole;
        session.user.image = (token.picture as string | null) ?? null;
        session.user.name = (token.name as string | null) ?? session.user.name;
      }
      return session;
    },
  },
});
