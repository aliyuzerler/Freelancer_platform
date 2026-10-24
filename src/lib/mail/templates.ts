import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';

/**
 * Transactional email templates. These are deliberately "doorbells": the email
 * carries no application content, only a one-line reason and a link back to the
 * platform where the real content lives.
 *
 * Every template takes a `locale` and resolves its copy from the `emails`
 * message namespace, so adding a language later means adding catalog entries —
 * no code changes. Recipients default to the platform's default locale until
 * per-user locale preferences exist.
 */

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const BRAND = 'Freelancezero';
// Physical address is required by CAN-SPAM on the recruiter (cold) email.
const POSTAL = process.env.MAIL_POSTAL_ADDRESS ?? 'Freelancezero — MAIL_POSTAL_ADDRESS güncelleyin';

function layout(bodyHtml: string, footerHtml: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a;line-height:1.5">
${bodyHtml}
<hr style="border:none;border-top:1px solid #eaeaea;margin:24px 0"/>
<p style="font-size:12px;color:#8a8a8a">${footerHtml}</p>
</div>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0"><a href="${href}" style="background:#111;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;display:inline-block;font-weight:600">${label}</a></p>`;
}

async function mailT(locale: string) {
  return getTranslations({ locale, namespace: 'emails' });
}

/** Recruiter — "someone applied to your posting". Links into the app; the
 *  recruiter signs in (magic link / Google / GitHub) with this email to view. */
export async function recruiterApplicantEmail(p: {
  recruiterFirstName?: string;
  companyName: string;
  jobTitle: string;
  devName: string;
  devHeadline?: string;
  viewUrl: string;
  unsubscribeUrl: string;
  locale?: string;
}): Promise<EmailContent> {
  const locale = p.locale ?? routing.defaultLocale;
  const t = await mailT(locale);
  const hi = p.recruiterFirstName ? ` ${p.recruiterFirstName}` : '';
  const headline = p.devHeadline ? `<br/><span style="color:#555">${p.devHeadline}</span>` : '';
  const html = layout(
    `<p>${t('recruiter.hi', { name: hi || '' })}</p>
<p>${t('recruiter.applied', { jobTitle: p.jobTitle })}</p>
<p style="background:#f6f6f6;border-radius:8px;padding:12px 14px">
  <strong>${p.devName}</strong>${headline}
</p>
<p>${t('recruiter.signIn')}</p>
${button(p.viewUrl, t('recruiter.viewButton'))}
<p style="font-size:13px;color:#777">${t('recruiter.pasteLink')}<br/>${p.viewUrl}</p>`,
    `${t('recruiter.footerWhy', { brand: BRAND, jobTitle: p.jobTitle })}
 <a href="${p.unsubscribeUrl}">${t('recruiter.unsubscribe')}</a>.<br/>${POSTAL}`,
  );
  const text = `${t('recruiter.hi', { name: hi || '' })}

${t('recruiter.appliedPlain', { jobTitle: p.jobTitle })}

${t('recruiter.applicantLabel')}: ${p.devName}${p.devHeadline ? ` — ${p.devHeadline}` : ''}

${t('recruiter.signIn')}:
${p.viewUrl}

—
${t('recruiter.footerWhy', { brand: BRAND, jobTitle: p.jobTitle })}
${t('recruiter.unsubscribe')}: ${p.unsubscribeUrl}
${POSTAL}`;
  return { subject: t('recruiter.subject', { jobTitle: p.jobTitle }), html, text };
}

/** Dev (platform user) — "the company replied to you". */
export async function devMessageEmail(p: {
  devFirstName?: string;
  companyName: string;
  jobTitle: string;
  preview: string;
  appUrl: string;
  settingsUrl: string;
  locale?: string;
}): Promise<EmailContent> {
  const locale = p.locale ?? routing.defaultLocale;
  const t = await mailT(locale);
  const hi = p.devFirstName ? ` ${p.devFirstName}` : '';
  const html = layout(
    `<p>${t('dev.hi', { name: hi })}</p>
<p>${t('dev.replied', { company: p.companyName, jobTitle: p.jobTitle })}</p>
<blockquote style="border-left:3px solid #ddd;margin:12px 0;padding:4px 14px;color:#444">${p.preview}</blockquote>
${button(p.appUrl, t('dev.readButton'))}`,
    `${t('dev.footerWhy', { brand: BRAND })}
 <a href="${p.settingsUrl}">${t('dev.manageNotifications')}</a>.`,
  );
  const text = `${t('dev.hi', { name: hi })}

${t('dev.replied', { company: p.companyName, jobTitle: p.jobTitle })}:

  "${p.preview}"

${t('dev.readButton')}: ${p.appUrl}

—
${t('dev.manageNotifications')}: ${p.settingsUrl}`;
  return { subject: t('dev.subject', { company: p.companyName }), html, text };
}
