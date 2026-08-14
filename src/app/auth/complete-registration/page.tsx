import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthTerminal } from '@/components/auth/auth-terminal';
import { getAuthUser } from '@/lib/auth/session';
import { adoptLegacyProfile } from '@/lib/auth/legacy';
import { prisma } from '@/lib/prisma';
import { isInternalRoute } from '@/lib/auth/utils';
import { CompleteRegistrationForm } from '@/components/auth/complete-registration-form';

export const metadata: Metadata = {
  title: 'Complete Registration | KeyDir',
  robots: { index: false, follow: false },
};

// Reads searchParams + auth session directly — opt out of the instant shell.
export const instant = false;

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
  const user = await getAuthUser();
  if (!user) redirect('/auth/login');

  const rawNext = params.next ?? '/';
  const next = isInternalRoute(rawNext) ? rawNext : '/';

  // Legacy Supabase users keep their existing KeyDir profile: adopt it on the
  // first Better Auth sign-in instead of forcing them to re-register.
  const adopted = await adoptLegacyProfile(user.id, user.email ?? '');
  if (adopted?.registrationComplete) {
    redirect(next);
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { registrationComplete: true },
  });
  if (profile?.registrationComplete) {
    redirect(next);
  }

  const oauthProvider = user.accounts.find((a) => a.providerId !== 'credential');
  const provider = params.provider ?? oauthProvider?.providerId ?? 'this provider';
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