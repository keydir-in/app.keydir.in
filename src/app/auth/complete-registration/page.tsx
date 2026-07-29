import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthTerminal } from '@/components/auth/auth-terminal';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { isInternalRoute } from '@/lib/auth/utils';
import { completeOAuthRegistration } from '@/lib/auth/actions';
import { PasswordInput } from '@/components/auth/password-input';

export const metadata: Metadata = {
  title: 'Complete Registration | KeyDir',
  robots: { index: false, follow: false },
};
import { SubmitButton } from '@/components/auth/submit-button';

const PROVIDER_NAMES: Record<string, string> = {
  google: 'Google',
  discord: 'Discord',
};

export default async function CompleteRegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; provider?: string; next?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const rawNext = params.next ?? '/';
  const next = isInternalRoute(rawNext) ? rawNext : '/';

  const profile = await prisma.profile.findUnique({ where: { userId: user.id }, select: { registrationComplete: true } });
  if (profile?.registrationComplete) {
    redirect(next);
  }

  const provider = params.provider ?? (user.app_metadata?.provider as string) ?? 'this provider';
  const providerName = PROVIDER_NAMES[provider.toLowerCase()] ?? provider;
  const email = user.email ?? '';
  const hasEmail = !!email;
  const isDiscord = provider.toLowerCase() === 'discord';
  const showEmailInput = isDiscord && !hasEmail;

  return (
    <AuthLayout title={'COMPLETE\nYOUR\nACCOUNT.'}>
      <AuthTerminal>
        {params.error && (
          <div className="auth-msg error" role="alert">{params.error}</div>
        )}

        <div className="auth-msg info" role="status">
          Signed in with {providerName}
        </div>

        {hasEmail && (
          <p className="auth-oauth-msg">
            Email: <strong>{email}</strong>
          </p>
        )}

        <p className="auth-oauth-msg auth-oauth-msg--muted">
          {showEmailInput
            ? 'Your Discord account has no email. Please enter one below, then choose a username and password.'
            : 'Choose a username and set a password to complete your KeyDir account.'}
        </p>

        <form action={completeOAuthRegistration} noValidate>
          <input type="hidden" name="next" value={next} />
          {showEmailInput && (
            <div className="auth-field">
              <label className="auth-label" htmlFor="cr-email">Email</label>
              <input
                type="email"
                name="email"
                id="cr-email"
                required
                placeholder="you@example.com"
                className="auth-input"
                autoComplete="email"
                aria-label="Email"
              />
              <p className="auth-helper">We will send a verification link to this address.</p>
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label" htmlFor="cr-username">Username</label>
            <input
              type="text"
              name="username"
              id="cr-username"
              required
              minLength={3}
              maxLength={20}
              pattern="[a-z0-9_]+"
              placeholder="shadow269"
              className="auth-input"
              autoComplete="username"
              aria-label="Username"
            />
            <p className="auth-helper">Lowercase letters, numbers, and underscores only. 3-20 characters.</p>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="cr-password">Password</label>
            <PasswordInput
              name="password"
              id="cr-password"
              required
              minLength={8}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              aria-label="Password"
            />
            <p className="auth-helper">Set a password for email+password login.</p>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="cr-confirm-password">Confirm Password</label>
            <PasswordInput
              name="confirmPassword"
              id="cr-confirm-password"
              required
              minLength={8}
              placeholder="Repeat your password"
              autoComplete="new-password"
              aria-label="Confirm Password"
            />
          </div>

          <SubmitButton>
            <span className="auth-btn-text">Complete Registration</span>
            <span className="auth-btn-arrow">{'\u2192'}</span>
          </SubmitButton>
        </form>

        <div className="auth-alt-link">
          <Link href="/">{'\u2190'} Back to Home</Link>
        </div>
      </AuthTerminal>
    </AuthLayout>
  );
}
