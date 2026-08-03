import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { formatMoney, initials, displayName } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ProposalReplyForm } from './proposals-reply-form';

export const dynamic = 'force-dynamic';

/**
 * Job owner's proposals view. This is where the recruiter notification email
 * lands. Access is the normal session (login wall) — signing in with the
 * posting's email (magic link / Google / GitHub) claims the shell and unlocks
 * this page.
 */
export default async function JobProposalsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user) redirect(`/login?next=/jobs/${slug}/proposals`);

  const job = await db.job.findUnique({
    where: { slug },
    select: {
      clientId: true,
      title: true,
      client: { select: { clientProfile: { select: { companyName: true } } } },
      proposals: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          coverLetter: true,
          bidAmount: true,
          bidType: true,
          freelancer: {
            select: {
              name: true,
              image: true,
              showFullName: true,
              freelancerProfile: { select: { id: true, headline: true, currency: true } },
            },
          },
        },
      },
    },
  });

  if (!job) notFound();
  // Only the posting's owner may see its applicants.
  if (job.clientId !== session.user.id) notFound();

  // Reduce applicant legal names to their public form before render.
  const proposals = job.proposals.map(({ freelancer, ...rest }) => ({
    ...rest,
    publicName: displayName(freelancer.name, freelancer.showFullName),
    avatarInitials: initials(freelancer.name),
    image: freelancer.image,
    profile: freelancer.freelancerProfile,
  }));

  const company = job.client.clientProfile?.companyName ?? 'Your company';

  return (
    <div className="container max-w-3xl py-12">
      <p className="text-sm text-muted-foreground">{company}</p>
      <h1 className="text-3xl font-bold">{job.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {proposals.length} application{proposals.length === 1 ? '' : 's'}
      </p>

      {proposals.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-8 text-center text-muted-foreground">
            No applications yet.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 space-y-6">
          {proposals.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar>
                    {p.image ? <AvatarImage src={p.image} alt="" /> : null}
                    <AvatarFallback>{p.avatarInitials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg">
                      {p.profile ? (
                        <Link
                          href={`/freelancers/${p.profile.id}`}
                          className="hover:text-primary hover:underline"
                        >
                          {p.publicName}
                        </Link>
                      ) : (
                        p.publicName
                      )}
                    </CardTitle>
                    {p.profile?.headline ? (
                      <p className="truncate text-sm text-muted-foreground">{p.profile.headline}</p>
                    ) : null}
                  </div>
                  <Badge variant="outline">
                    {p.bidType === 'HOURLY'
                      ? `${formatMoney(p.bidAmount, p.profile?.currency ?? 'USD')}/hr`
                      : formatMoney(p.bidAmount, p.profile?.currency ?? 'USD')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {p.coverLetter}
                </p>
                <ProposalReplyForm proposalId={p.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
