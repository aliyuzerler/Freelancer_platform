'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { useRouter, Link } from '@/i18n/navigation';
import { useMessageResolver } from '@/i18n/msg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export type AdminJob = {
  id: string;
  title: string;
  slug: string;
  status: string;
  companyName: string;
  contactEmail: string;
  contactable: boolean;
  isScraped: boolean;
  sourceUrl: string | null;
  proposals: number;
  createdAt: string;
};

/** One posting with an inline curation form. */
export function JobRow({ job }: { job: AdminJob }) {
  const t = useTranslations('admin.jobs');
  const m = useMessageResolver();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function patch(payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    setSaved(false);
    const res = await fetch('/api/admin/jobs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: job.id, ...payload }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(m(body?.error?.message, t('couldNotSave')));
      return false;
    }
    setSaved(true);
    router.refresh();
    return true;
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await patch({
      title: String(form.get('title') ?? '').trim(),
      companyName: String(form.get('companyName') ?? '').trim(),
      contactEmail: String(form.get('contactEmail') ?? '').trim(),
    });
  }

  const statusVariant =
    job.status === 'OPEN' ? 'default' : job.status === 'DRAFT' ? 'secondary' : 'outline';

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant}>{t(`status.${job.status}` as never)}</Badge>
              {job.isScraped ? <Badge variant="outline">{t('scraped')}</Badge> : null}
              {!job.contactable && job.isScraped ? (
                <Badge variant="outline" className="border-amber-500/50 text-amber-600">
                  {t('noContact')}
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 truncate font-medium">{job.title}</p>
            <p className="truncate text-sm text-muted-foreground">
              {job.companyName || t('noCompanyName')}
              {job.contactEmail ? ` · ${job.contactEmail}` : ''}
              {job.proposals > 0 ? ` · ${t('applicantsShort', { count: job.proposals })}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {job.status === 'DRAFT' ? (
              <Button size="sm" disabled={busy} onClick={() => patch({ status: 'OPEN' })}>
                Publish
              </Button>
            ) : job.status === 'OPEN' ? (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => patch({ status: 'DRAFT' })}
              >
                Unpublish
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={() => setOpen(!open)}>
              <ChevronDown className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </Button>
          </div>
        </div>

        {open ? (
          <form onSubmit={onSave} className="mt-4 grid gap-3 border-t pt-4">
            <div className="grid gap-2">
              <Label htmlFor={`t-${job.id}`}>{t('titleLabel')}</Label>
              <Input id={`t-${job.id}`} name="title" defaultValue={job.title} maxLength={200} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`c-${job.id}`}>{t('companyLabel')}</Label>
                <Input
                  id={`c-${job.id}`}
                  name="companyName"
                  defaultValue={job.companyName}
                  placeholder={t('companyPlaceholder')}
                  maxLength={120}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`e-${job.id}`}>{t('contactEmailLabel')}</Label>
                <Input
                  id={`e-${job.id}`}
                  name="contactEmail"
                  type="email"
                  defaultValue={job.contactEmail}
                  placeholder={t('contactPlaceholder')}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              A posting can only be published once someone can be notified about applications.
            </p>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" size="sm" disabled={busy}>
                {busy ? t('saving') : t('save')}
              </Button>
              {saved ? <span className="text-sm text-green-600">{t('saved')}</span> : null}
              <Button asChild size="sm" variant="ghost">
                <Link href={`/jobs/${job.slug}`}>{t('viewPosting')}</Link>
              </Button>
              {job.sourceUrl ? (
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Original <ExternalLink className="size-3" />
                </a>
              ) : null}
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
