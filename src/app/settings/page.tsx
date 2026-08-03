import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Wallet, ShieldCheck, User, Bell, ChevronRight } from 'lucide-react';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AvatarUpload } from '@/components/avatar-upload';

export const metadata = { title: 'Settings' };
export const dynamic = 'force-dynamic';

const FREELANCER_ROLES = ['FREELANCER', 'AGENCY_OWNER', 'AGENCY_MEMBER'];

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?next=/settings');

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      twoFactorEnabled: true,
      passwordHash: true,
      showFullName: true,
    },
  });
  if (!user) redirect('/login');

  const isFreelancer = FREELANCER_ROLES.includes(user.role);
  const memberSince = user.createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="container max-w-2xl py-12">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="mt-1 mb-8 text-muted-foreground">Manage your account, payouts, and security.</p>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <User className="size-5 text-primary" />
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="border-b pb-4">
            <AvatarUpload image={user.image} name={user.name} email={user.email} />
          </div>
          <Row label="Name" value={user.name ?? '—'} />
          <Row label="Email" value={user.email} />
          <Row
            label="Account type"
            value={<Badge variant="secondary">{user.role.toLowerCase().replace('_', ' ')}</Badge>}
          />
          <Row label="Member since" value={memberSince} />
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4">
        <LinkCard
          href="/settings/profile"
          icon={User}
          title={isFreelancer ? 'Public profile' : 'Your identity'}
          desc={
            isFreelancer
              ? 'Your headline, bio, rate, availability, and links — what clients see.'
              : 'Company name, website, and about — how freelancers see you.'
          }
        />
        <LinkCard
          href="/settings/payments"
          icon={Wallet}
          title={isFreelancer ? 'Get paid' : 'Billing & payments'}
          desc={
            isFreelancer
              ? 'Connect a payout method and keep 100% of what you earn.'
              : 'Choose how you pay talent — directly, with zero platform fees.'
          }
        />
        <LinkCard
          href="/settings/notifications"
          icon={Bell}
          title="Notifications & privacy"
          desc={`Email preferences · Public name shows as ${user.showFullName ? 'your full name' : 'first name + initial'}.`}
        />
        <LinkCard
          href="/settings/security"
          icon={ShieldCheck}
          title="Security"
          desc={`Password ${user.passwordHash ? 'set' : 'not set'} · Two-factor ${user.twoFactorEnabled ? 'enabled' : 'off'}.`}
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function LinkCard({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="transition-colors hover:border-primary">
        <CardContent className="flex items-center gap-4 py-4">
          <Icon className="size-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
