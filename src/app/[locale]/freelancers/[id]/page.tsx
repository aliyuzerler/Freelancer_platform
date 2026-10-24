import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, Star, MapPin, Globe, Github, Clock, Briefcase,
  Linkedin, Dribbble, Twitter, Code2, Palette, Award, BadgeCheck,
} from 'lucide-react';
import { db } from '@/lib/db';
import { getTranslations } from 'next-intl/server';
import { formatMoney, initials, displayName } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { SITE, pageMetadata, jsonLdScript } from '@/lib/seo';

export const dynamic = 'force-dynamic';

/**
 * Fetch a profile and immediately reduce the legal name to its public form.
 * The raw name is never returned, so it cannot leak into the serialized RSC
 * payload — "Jordan D." must not be recoverable from view-source.
 */
async function getProfile(id: string) {
  const p = await getProfileRaw(id);
  if (!p) return null;
  const { user, ...rest } = p;
  return {
    ...rest,
    publicName: displayName(user.name, user.showFullName),
    avatarInitials: initials(user.name),
    image: user.image,
    indexProfile: user.indexProfile,
    identityVerified: user.identityStatus === 'VERIFIED',
    status: user.status,
    deletedAt: user.deletedAt,
  };
}

function getProfileRaw(id: string) {
  return db.freelancerProfile.findUnique({
    where: { id },
    select: {
      id: true,
      headline: true,
      bio: true,
      hourlyRate: true,
      currency: true,
      availability: true,
      hoursPerWeek: true,
      location: true,
      websiteUrl: true,
      githubUrl: true,
      linkedinUrl: true,
      dribbbleUrl: true,
      behanceUrl: true,
      stackoverflowUrl: true,
      xUrl: true,
      timezone: true,
      yearsExperience: true,
      ratingAvg: true,
      ratingCount: true,
      user: {
        select: {
          name: true, image: true, showFullName: true,
          indexProfile: true, status: true, deletedAt: true, identityStatus: true,
        },
      },
      skills: { select: { skill: { select: { id: true, name: true } }, endorsements: true } },
      portfolioItems: {
        orderBy: { order: 'asc' },
        select: { id: true, title: true, description: true, externalUrl: true },
      },
      workHistory: {
        orderBy: { startDate: 'desc' },
        select: { id: true, company: true, title: true, description: true, startDate: true, endDate: true },
      },
      languages: { select: { id: true, language: true, level: true } },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const p = await getProfile(id);
  if (!p) {
    const t = await getTranslations({ locale, namespace: 'freelancerProfile' });
    return pageMetadata({ title: t('notFoundTitle'), path: '/freelancers', locale, noIndex: true });
  }

  // Profiles are public and indexed by default — free inbound lead flow for the
  // freelancer — unless they opted out in privacy settings.
  const skills = p.skills.map((s) => s.skill.name);
  const where = p.location ? ` in ${p.location}` : '';
  const t = await getTranslations({ locale, namespace: 'freelancerProfile' });
  const description =
    p.bio?.replace(/\s+/g, ' ').slice(0, 155) ??
    t('metaDescription', {
      name: p.publicName,
      where,
      headline: p.headline ?? t('freelancerFallback'),
      skills: skills.length ? `, ${skills.slice(0, 4).join(', ')}` : '',
    });

  return pageMetadata({
    title: `${p.publicName} — ${p.headline ?? t('freelancerFallback')}${where}`,
    description,
    path: `/freelancers/${p.id}`,
    keywords: [
      ...skills,
      `hire ${p.headline ?? 'freelancer'}`,
      ...(p.location ? [`freelancer ${p.location}`] : []),
    ],
    noIndex: !p.indexProfile,
  });
}

export default async function FreelancerProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'freelancerProfile' });
  const p = await getProfile(id);
  if (!p || p.deletedAt || p.status !== 'ACTIVE') notFound();

  const name = p.publicName;

  const links = (
    [
      { href: p.websiteUrl, labelKey: 'linkWebsite', Icon: Globe },
      { href: p.linkedinUrl, labelKey: 'linkLinkedIn', Icon: Linkedin },
      { href: p.githubUrl, labelKey: 'linkGitHub', Icon: Github },
      { href: p.stackoverflowUrl, labelKey: 'linkStackOverflow', Icon: Code2 },
      { href: p.dribbbleUrl, labelKey: 'linkDribbble', Icon: Dribbble },
      { href: p.behanceUrl, labelKey: 'linkBehance', Icon: Palette },
      { href: p.xUrl, labelKey: 'linkX', Icon: Twitter },
    ] as const
  ).filter((l): l is typeof l & { href: string } => !!l.href);

  // Rich Person schema so search engines can surface the profile properly.
  // Only emitted when the freelancer allows indexing.
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    jobTitle: p.headline ?? undefined,
    description: p.bio ?? undefined,
    url: `${SITE.url}/freelancers/${p.id}`,
    image: p.image ? `${SITE.url}${p.image}` : undefined,
    knowsAbout: p.skills.map((s) => s.skill.name),
    ...(p.location ? { homeLocation: { '@type': 'Place', name: p.location } } : {}),
    ...(p.ratingCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: p.ratingAvg.toFixed(1),
            reviewCount: p.ratingCount,
          },
        }
      : {}),
    ...(p.hourlyRate
      ? {
          makesOffer: {
            '@type': 'Offer',
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: (p.hourlyRate / 100).toFixed(2),
              priceCurrency: p.currency,
              unitCode: 'HUR',
            },
          },
        }
      : {}),
  };

  return (
    <div className="container max-w-3xl py-12">
      {p.indexProfile ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(personJsonLd)} />
      ) : null}

      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link href="/">
          <ArrowLeft /> Freelancezero
        </Link>
      </Button>

      <div className="flex flex-wrap items-start gap-5">
        <Avatar className="size-20">
          {p.image ? <AvatarImage src={p.image} alt="" /> : null}
          <AvatarFallback className="text-xl">{p.avatarInitials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            {name}
            {p.identityVerified ? (
              <span title={t("identityVerified")} className="inline-flex">
                <BadgeCheck className="size-6 text-primary" aria-label={t("identityVerified")} />
              </span>
            ) : null}
          </h1>
          {p.headline ? <p className="mt-1 text-lg text-muted-foreground">{p.headline}</p> : null}

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="secondary">{t(`availability.${p.availability}` as never)}</Badge>
            {p.ratingCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Star className="size-4 fill-primary text-primary" />
                {p.ratingAvg.toFixed(1)} ({p.ratingCount})
              </span>
            ) : (
              <span>{t('noReviewsYet')}</span>
            )}
            {p.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-4" /> {p.location}
              </span>
            ) : null}
            {p.timezone ? <span>{p.timezone}</span> : null}
            {p.hoursPerWeek ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-4" /> {t('hoursPerWeekShort', { hours: p.hoursPerWeek })}
              </span>
            ) : null}
            {p.yearsExperience ? (
              <span className="inline-flex items-center gap-1">
                <Award className="size-4" /> {t('yearsExperienceShort', { years: p.yearsExperience })}
              </span>
            ) : null}
          </div>
        </div>
        {p.hourlyRate ? (
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {formatMoney(p.hourlyRate, p.currency, locale)}
            </p>
            <p className="text-xs text-muted-foreground">{t('perHour')}</p>
          </div>
        ) : null}
      </div>

      {links.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {links.map((l) => (
            <Button key={l.labelKey} asChild variant="outline" size="sm">
              <a href={l.href} target="_blank" rel="noopener noreferrer nofollow">
                <l.Icon /> {t(l.labelKey as never)}
              </a>
            </Button>
          ))}
        </div>
      ) : null}

      {p.skills.length ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {p.skills.map((s) => (
            <Badge key={s.skill.id}>{s.skill.name}</Badge>
          ))}
        </div>
      ) : null}

      {p.bio ? (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>{t('about')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {p.bio}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {p.portfolioItems.length ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t('portfolio')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {p.portfolioItems.map((item) => (
              <div key={item.id} className="rounded-lg border p-4">
                <p className="font-medium">{item.title}</p>
                {item.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                ) : null}
                {item.externalUrl ? (
                  <a
                    href={item.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-2 inline-block text-sm text-primary hover:underline"
                  >
                    {t('viewProject')}
                  </a>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {p.workHistory.length ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="size-5 text-primary" /> {t('experience')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {p.workHistory.map((w) => (
              <div key={w.id}>
                <p className="font-medium">
                  {w.title} · <span className="text-muted-foreground">{w.company}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {w.startDate ? w.startDate.getFullYear() : '—'} –{' '}
                  {w.endDate ? w.endDate.getFullYear() : t('present')}
                </p>
                {w.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{w.description}</p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {p.languages.length ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t('languages')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {p.languages.map((l) => (
              <Badge key={l.id} variant="outline">
                {l.language} — {l.level}
              </Badge>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
