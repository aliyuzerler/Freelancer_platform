import { CheckCircle2, AlertTriangle, Activity } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { pageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'status.meta' });
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: '/status',
    locale,
    keywords: (t.raw('keywords') as string[]) ?? [],
  });
}

type Check = {
  key: string;
  up: boolean;
  /** Pre-localized detail line, built with the page's translator. */
  detail: string;
};

/** Probe the things we can actually verify from inside the app. */
async function runChecks(
  t: (key: string, values?: Record<string, string | number>) => string,
): Promise<Check[]> {
  const checks: Check[] = [];

  // Web app — if this renders, it is up.
  checks.push({ key: 'web', up: true, detail: t('web.ok') });

  // Database — a trivial query is a real liveness probe.
  const dbStart = Date.now();
  let dbUp = true;
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    dbUp = false;
  }
  checks.push({
    key: 'database',
    up: dbUp,
    detail: dbUp ? t('database.ok', { ms: Date.now() - dbStart }) : t('database.down'),
  });

  // Email — configured if either an SMTP host or a Resend key is present.
  const mailUp = !!(process.env.EMAIL_SERVER_HOST || process.env.RESEND_API_KEY);
  checks.push({
    key: 'email',
    up: mailUp,
    detail: mailUp ? t('email.ok') : t('email.down'),
  });

  // Background ingestion — reported as healthy when a scrape ran recently.
  let jobsUp = true;
  let jobsDetail = t('jobs.idle');
  try {
    const last = await db.jobSource.findFirst({
      orderBy: { lastSeenAt: 'desc' },
      select: { lastSeenAt: true },
    });
    if (last) {
      const hours = Math.round((Date.now() - last.lastSeenAt.getTime()) / 3_600_000);
      jobsUp = hours < 48;
      jobsDetail = t('jobs.lastRun', { hours });
    } else {
      jobsDetail = t('jobs.noRuns');
    }
  } catch {
    jobsUp = false;
    jobsDetail = t('jobs.unknown');
  }
  checks.push({ key: 'jobs', up: jobsUp, detail: jobsDetail });

  return checks;
}

export default async function StatusPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'status' });

  const checks = await runChecks(t as (key: string, values?: Record<string, string | number>) => string);
  const allUp = checks.every((c) => c.up);
  const now = new Date();

  return (
    <div className="container max-w-3xl py-16">
      <div className="flex items-center gap-3">
        <Activity className="size-6 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
      </div>

      <div
        className={`mt-8 flex items-center gap-3 rounded-xl border p-5 ${
          allUp ? 'border-primary/30 bg-primary/5' : 'border-amber-500/40 bg-amber-500/10'
        }`}
      >
        {allUp ? (
          <CheckCircle2 className="size-6 shrink-0 text-primary" />
        ) : (
          <AlertTriangle className="size-6 shrink-0 text-amber-600" />
        )}
        <div>
          <p className="text-lg font-semibold">{allUp ? t('allOperational') : t('partialDisruption')}</p>
          <p className="text-sm text-muted-foreground">
            {t('checkedAt', { time: now.toUTCString().replace('GMT', 'UTC') })}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-3">
        {checks.map((c) => (
          <Card key={c.key}>
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="font-medium">{t(`checks.${c.key}.name`)}</p>
                <p className="text-sm text-muted-foreground">{t(`checks.${c.key}.desc`)}</p>
              </div>
              <div className="flex items-center gap-3 whitespace-nowrap">
                <span className="text-xs text-muted-foreground">
                  {c.detail}
                </span>
                <Badge variant={c.up ? 'secondary' : 'outline'} className="gap-1">
                  <span
                    className={`size-2 rounded-full ${c.up ? 'bg-primary' : 'bg-amber-500'}`}
                  />
                  {c.up ? t('operational') : t('degraded')}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">{t('uptimeTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <UptimeBars allUp={allUp} />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{t('daysAgo')}</span>
            <span>{t('today')}</span>
          </div>
        </CardContent>
      </Card>

      <p className="mt-6 text-sm text-muted-foreground">{t('footerNote')}</p>
    </div>
  );
}

/**
 * 90-day bar strip. We do not yet persist historical probe results, so past days
 * render as "no data" rather than inventing green bars — only today reflects a
 * real check.
 */
function UptimeBars({ allUp }: { allUp: boolean }) {
  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: 90 }).map((_, i) => {
        const isToday = i === 89;
        return (
          <div
            key={i}
            className={`h-8 flex-1 rounded-sm ${
              isToday ? (allUp ? 'bg-primary' : 'bg-amber-500') : 'bg-muted'
            }`}
          />
        );
      })}
    </div>
  );
}
