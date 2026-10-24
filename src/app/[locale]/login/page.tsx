'use client';

import { Suspense, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { signIn, getProviders } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useRouter } from '@/i18n/navigation';

function LoginForm() {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/dashboard';
  // Set when a recruiter sign-in link was expired or invalid.
  const linkExpired = params.get('error') === 'link_expired';
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicEmail, setMagicEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  // Which optional providers are configured (self-hosters enable only some).
  const [providers, setProviders] = useState<Record<string, unknown>>({});

  useEffect(() => {
    getProviders().then((p) => setProviders(p ?? {}));
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await signIn('credentials', {
      email: String(form.get('email')),
      password: String(form.get('password')),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError(t('invalidCredentials'));
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function onMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!magicEmail.trim()) return;
    await signIn('nodemailer', { email: magicEmail, callbackUrl: next, redirect: false });
    setMagicSent(true);
  }

  const hasMagic = 'nodemailer' in providers;
  const hasGoogle = 'google' in providers;
  const hasGitHub = 'github' in providers;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {linkExpired ? (
          <p className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            {t('linkExpired')}
          </p>
        ) : null}
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? t('signingIn') : t('signIn')}
          </Button>
        </form>

        {hasMagic || hasGoogle || hasGitHub ? (
          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> {t('or')} <span className="h-px flex-1 bg-border" />
          </div>
        ) : null}

        {hasMagic ? (
          magicSent ? (
            <p className="rounded-md bg-muted p-3 text-center text-sm text-muted-foreground">
              {t('magicSent')}
            </p>
          ) : (
            <form onSubmit={onMagicLink} className="grid gap-2">
              <Input
                type="email"
                placeholder={t('magicPlaceholder')}
                value={magicEmail}
                onChange={(e) => setMagicEmail(e.target.value)}
                autoComplete="email"
              />
              <Button type="submit" variant="outline">
                {t('magicButton')}
              </Button>
            </form>
          )
        ) : null}

        {hasGoogle ? (
          <Button
            type="button"
            variant="outline"
            className="mt-2 w-full"
            onClick={() => signIn('google', { callbackUrl: next })}
          >
            {t('google')}
          </Button>
        ) : null}
        {hasGitHub ? (
          <Button
            type="button"
            variant="outline"
            className="mt-2 w-full"
            onClick={() => signIn('github', { callbackUrl: next })}
          >
            {t('github')}
          </Button>
        ) : null}

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t('noAccount')}{' '}
          <Link href="/register" className="text-primary hover:underline">
            {t('signUpFree')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
