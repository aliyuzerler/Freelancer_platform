import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PreferencesForm } from './preferences-form';

export const metadata = { title: 'Notifications & privacy' };
export const dynamic = 'force-dynamic';

export default async function NotificationsSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?next=/settings/notifications');

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      showFullName: true,
      indexProfile: true,
      notifyProposals: true,
      notifyMessages: true,
      notifyProductNews: true,
    },
  });
  if (!user) redirect('/login');

  return (
    <div className="container max-w-2xl py-12">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link href="/settings">
          <ArrowLeft /> Settings
        </Link>
      </Button>

      <h1 className="text-3xl font-bold">Notifications &amp; privacy</h1>
      <p className="mt-1 mb-8 text-muted-foreground">
        Control what we email you, and how your name appears to others.
      </p>

      <Card>
        <CardContent className="py-2">
          <PreferencesForm
            initial={{
              showFullName: user.showFullName,
              indexProfile: user.indexProfile,
              notifyProposals: user.notifyProposals,
              notifyMessages: user.notifyMessages,
              notifyProductNews: user.notifyProductNews,
            }}
            exampleName={user.name ?? 'Jordan Diaz'}
          />
        </CardContent>
      </Card>
    </div>
  );
}
