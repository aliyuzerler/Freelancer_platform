'use client';

import { Suspense, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';
import { useMessageResolver } from '@/i18n/msg';
import { CompanyCombobox } from '@/components/company-combobox';
import { Link } from '@/i18n/navigation';

type Role = 'CLIENT' | 'FREELANCER';

function RegisterForm() {
  const t = useTranslations('auth.register');
  const m = useMessageResolver();
  const params = useSearchParams();
  const initialRole: Role = params.get('role') === 'freelancer' ? 'FREELANCER' : 'CLIENT';
  const [role, setRole] = useState<Role>(initialRole);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [company, setCompany] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema), mode: 'onBlur' });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...values,
        role,
        companyName: role === 'CLIENT' && company.trim() ? company.trim() : undefined,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setServerError(m(body?.error?.message, t('couldNotCreate')));
      return;
    }

    // Email verification is the activation gate: the account stays inert until
    // the address is confirmed, so there is no auto sign-in here (FZ-01).
    setSubmittedEmail(values.email);
  }

  if (submittedEmail) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{t('checkInboxTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t.rich('checkInboxText', { email: submittedEmail, strong: (chunks) => <strong>{chunks}</strong> })}</p>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t('alreadyConfirmed')}{' '}
            <Link href="/login" className="text-primary hover:underline">
              {t('logIn')}
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {(['CLIENT', 'FREELANCER'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                'rounded-md border p-3 text-sm font-medium transition-colors',
                role === r ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-accent',
              )}
            >
              {r === 'CLIENT' ? t('imHiring') : t('imWorking')}
            </button>
          ))}
        </div>

        {/* noValidate: inline field errors below replace browser tooltips. */}
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          {role === 'CLIENT' ? (
            <Field id="company" label={t('companyOptional')}>
              <CompanyCombobox id="company" value={company} onChange={setCompany} />
            </Field>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <Field id="firstName" label={t('firstName')} error={m(errors.firstName?.message)}>
              <Input
                id="firstName"
                autoComplete="given-name"
                aria-invalid={!!errors.firstName}
                className={cn(errors.firstName && 'border-destructive')}
                {...register('firstName')}
              />
            </Field>
            <Field id="lastName" label={t('lastName')} error={m(errors.lastName?.message)}>
              <Input
                id="lastName"
                autoComplete="family-name"
                aria-invalid={!!errors.lastName}
                className={cn(errors.lastName && 'border-destructive')}
                {...register('lastName')}
              />
            </Field>
          </div>
          <Field id="email" label={t('email')} error={m(errors.email?.message)}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              className={cn(errors.email && 'border-destructive')}
              {...register('email')}
            />
          </Field>
          <Field
            id="password"
            label={t('password')}
            error={m(errors.password?.message)}
            hint={t('passwordHint')}
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              className={cn(errors.password && 'border-destructive')}
              {...register('password')}
            />
          </Field>
          <Field id="confirmPassword" label={t('confirmPassword')} error={m(errors.confirmPassword?.message)}>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              className={cn(errors.confirmPassword && 'border-destructive')}
              {...register('confirmPassword')}
            />
          </Field>
          <p className="text-xs text-muted-foreground">{t('nextStepHint')}</p>
          {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('creating') : t('createAccount')}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t('haveAccount')}{' '}
          <Link href="/login" className="text-primary hover:underline">
            {t('logIn')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

/** Label + input + inline error (or hint) — keeps the form fields uniform. */
function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <Suspense>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
