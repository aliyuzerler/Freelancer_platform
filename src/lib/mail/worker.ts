/**
 * Notification email worker. Fans out un-emailed Notification rows over SMTP.
 * Routing is by the *target user's* status, so both directions flow through
 * here:
 *   - UNCLAIMED recruiter  -> magic-link portal email (the one cold send;
 *                             gated by RecruiterContact.contactable).
 *   - ACTIVE user (dev)    -> normal in-app deep link email.
 *
 * `Notification.emailedAt` is the idempotency guard: set once handled (whether
 * sent or deliberately skipped) so a notification is never emailed twice.
 */
import { db } from '@/lib/db';
import { env } from '@/lib/env';
import { getTransport, MAIL_FROM } from './transport';
import { mintRecruiterToken, unsubscribeUrl } from './tokens';
import { recruiterApplicantEmail, devMessageEmail, type EmailContent } from './templates';

const jobIdFromHref = (href: string | null): string | null =>
  href?.match(/\/jobs\/([^/?#]+)/)?.[1] ?? null;

async function buildRecruiterEmail(
  n: { userId: string; body: string | null; href: string | null },
): Promise<{ to: string; content: EmailContent; unsub: string } | null> {
  const contact = await db.recruiterContact.findUnique({ where: { userId: n.userId } });
  if (!contact?.contactable || contact.suppressedAt || contact.unsubscribedAt) return null;

  const jobKey = jobIdFromHref(n.href);
  if (!jobKey) return null;
  // The href carries the slug, but older notifications used the id — accept
  // either, so a href-format change can never silently drop the email again.
  const job = await db.job.findFirst({
    where: { OR: [{ slug: jobKey }, { id: jobKey }] },
    select: { id: true, title: true, slug: true },
  });
  const company = await db.clientProfile.findUnique({
    where: { userId: n.userId },
    select: { companyName: true },
  });
  if (!job) return null;

  // One token backs both links: the CTA signs the recruiter in and lands them on
  // this job's applicants; the footer link unsubscribes.
  const token = await mintRecruiterToken(n.userId, job.id);
  const unsub = unsubscribeUrl(token);
  const content = await recruiterApplicantEmail({
    companyName: company?.companyName ?? 'your company',
    jobTitle: job.title,
    devName: n.body || 'A freelancer',
    viewUrl: `${env.NEXT_PUBLIC_APP_URL}/r/${token}`,
    unsubscribeUrl: unsub,
  });
  return { to: contact.email, content, unsub };
}

async function buildDevEmail(
  n: { userId: string; title: string; body: string | null; href: string | null },
  user: { email: string; name: string | null },
): Promise<{ to: string; content: EmailContent } | null> {
  const content = await devMessageEmail({
    devFirstName: user.name?.split(' ')[0],
    // The reply handler encodes "<Company> · <Job Title>" in the title.
    companyName: n.title.split(' · ')[0] ?? 'The company',
    jobTitle: n.title.split(' · ')[1] ?? 'your application',
    preview: n.body ?? '',
    appUrl: `${env.NEXT_PUBLIC_APP_URL}${n.href ?? '/dashboard'}`,
    settingsUrl: `${env.NEXT_PUBLIC_APP_URL}/settings/notifications`,
  });
  return { to: user.email, content };
}

export interface FanOutResult {
  processed: number;
  sent: number;
  skipped: number;
}

/** Notification types the user can switch off. Anything else is always sent. */
function allowedByPreferences(
  type: string,
  prefs: { notifyProposals: boolean; notifyMessages: boolean; notifyProductNews: boolean },
): boolean {
  if (type === 'MESSAGE') return prefs.notifyMessages;
  if (type === 'PROPOSAL_RECEIVED' || type === 'PROPOSAL_STATUS') return prefs.notifyProposals;
  if (type === 'SYSTEM') return prefs.notifyProductNews;
  return true;
}

/**
 * Email a single notification. Returns whether mail was actually sent.
 * Marks `emailedAt` on success *and* on deliberate skips, so a notification is
 * never emailed twice; transient failures are left for the next retry.
 */
export async function deliverNotification(notificationId: string): Promise<boolean> {
  const transport = getTransport();
  const n = await db.notification.findUnique({
    where: { id: notificationId },
    include: {
      user: {
        select: {
          status: true,
          email: true,
          name: true,
          notifyProposals: true,
          notifyMessages: true,
          notifyProductNews: true,
        },
      },
    },
  });
  if (!n || n.emailedAt) return false;

  const markHandled = () =>
    db.notification.update({ where: { id: n.id }, data: { emailedAt: new Date() } });

  // No transport configured, or the user switched this category off.
  if (!transport || !allowedByPreferences(n.type, n.user)) {
    await markHandled();
    return false;
  }

  try {
    if (n.user.status === 'UNCLAIMED') {
      const built = await buildRecruiterEmail(n);
      if (!built) {
        await markHandled();
        return false;
      }
      await transport.sendMail({
        from: MAIL_FROM,
        to: built.to,
        subject: built.content.subject,
        text: built.content.text,
        html: built.content.html,
        headers: {
          'List-Unsubscribe': `<${built.unsub}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      });
    } else {
      // Skip shell/system rows with no real inbox.
      if (!n.user.email || n.user.email.endsWith('.invalid')) {
        await markHandled();
        return false;
      }
      const built = await buildDevEmail(n, n.user);
      if (!built) {
        await markHandled();
        return false;
      }
      await transport.sendMail({
        from: MAIL_FROM,
        to: built.to,
        subject: built.content.subject,
        text: built.content.text,
        html: built.content.html,
      });
    }
    await markHandled();
    return true;
  } catch (err) {
    // Leave emailedAt null so the scheduled fan-out retries this one.
    console.error('[mail] delivery failed for notification', n.id, err);
    return false;
  }
}

/**
 * Retry sweep for notifications that were not delivered inline (mail outage,
 * transient SMTP error). Notifications are normally emailed immediately by
 * `notifyUser`; this is the safety net, not the primary path.
 */
export async function fanOutNotifications(batchSize = 50): Promise<FanOutResult> {
  const pending = await db.notification.findMany({
    where: { emailedAt: null },
    orderBy: { createdAt: 'asc' },
    take: batchSize,
    select: { id: true },
  });

  const res: FanOutResult = { processed: 0, sent: 0, skipped: 0 };

  for (const { id } of pending) {
    res.processed++;
    if (await deliverNotification(id)) res.sent++;
    else res.skipped++;
  }

  return res;
}
