import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthTerminal } from '@/components/auth/auth-terminal';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { isInternalRoute } from '@/lib/auth/utils';
import { CompleteRegistrationForm } from '@/components/auth/complete-registration-form';

export const metadata: Metadata = {
  title: 'Complete Registration | KeyDir',
  robots: { index: false, follow: false },
};

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

        <CompleteRegistrationForm next={next} showEmailInput={showEmailInput} />

        <div className="auth-alt-link">
          <Link href="/">{'\u2190'} Back to Home</Link>
        </div>
      </AuthTerminal>
    </AuthLayout>
  );
}
