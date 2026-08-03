import Link from 'next/link';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'Confirm your email' };
export const dynamic = 'force-dynamic';

/** Email-confirmation landing page. Consumes the one-time token. */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  let state: 'success' | 'expired' | 'invalid' = 'invalid';
  if (token && email) {
    const record = await db.verificationToken.findUnique({ where: { token } });
    if (record && record.identifier === email) {
      if (record.expires > new Date()) {
        await db.user.updateMany({ where: { email }, data: { emailVerified: new Date() } });
        // One-time: burn every outstanding token for this address.
        await db.verificationToken.deleteMany({ where: { identifier: email } });
        state = 'success';
      } else {
        state = 'expired';
      }
    }
  }

  const content = {
    success: {
      icon: <CheckCircle2 className="size-10 text-primary" />,
      title: 'Email confirmed',
      body: 'Your email is verified. You can finish the remaining setup steps from your dashboard.',
      cta: { href: '/dashboard', label: 'Go to dashboard' },
    },
    expired: {
      icon: <Clock className="size-10 text-amber-600" />,
      title: 'Link expired',
      body: 'Confirmation links expire after 24 hours. Sign in and request a fresh one from your dashboard.',
      cta: { href: '/login', label: 'Sign in' },
    },
    invalid: {
      icon: <XCircle className="size-10 text-destructive" />,
      title: 'Invalid link',
      body: 'This confirmation link is invalid or was already used.',
      cta: { href: '/login', label: 'Sign in' },
    },
  }[state];

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center gap-3">
          {content.icon}
          <CardTitle className="text-2xl">{content.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{content.body}</p>
          <Button asChild className="mt-6">
            <Link href={content.cta.href}>{content.cta.label}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
