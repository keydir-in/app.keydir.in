/**
 * OAuth not-linked error page. Shown when a user attempts to sign in
 * with Google or Discord but has no linked account. Provides clear
 * guidance on how to create an account and link providers.
 */

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'OAuth Not Linked | KeyDir',
  robots: { index: false, follow: false },
};
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthTerminal } from '@/components/auth/auth-terminal';

const PROVIDER_NAMES: Record<string, string> = {
  google: 'Google',
  discord: 'Discord',
};

export default async function OAuthNotLinkedPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string }>;
}) {
  const params = await searchParams;
  const provider = params.provider ?? 'this provider';
  const providerName = PROVIDER_NAMES[provider.toLowerCase()] ?? provider;

  return (
    <AuthLayout title={'SIGN-IN\nNOT\nAVAILABLE.'}>
      <AuthTerminal>
        <div className="auth-message-page">
          <div className="auth-msg info" role="alert">
            <strong>{providerName} Sign-In Not Available</strong>
          </div>

          <p style={{ marginTop: '16px' }}>
            {providerName} sign-in is only available for existing KeyDir
            accounts that have already linked that provider.
          </p>

          <p style={{ marginTop: '12px' }}>
            If you&apos;re new to KeyDir, please create an account using your
            username, email, and password first.
          </p>

          <p className="auth-message-sub auth-message-sub--block" style={{ marginTop: '12px' }}>
            After signing in, you can link your {providerName} account from:<br />
            <strong>Settings &rarr; Connected Accounts</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
          <Link href="/auth/register" className="btn-primary auth-btn" style={{ flex: 1 }}>
            Create Account
          </Link>
          <Link href="/auth/login" className="btn-secondary auth-btn" style={{ flex: 1 }}>
            Back to Login
          </Link>
        </div>

        <div className="auth-alt-link">
          <Link href="/">{'\u2190'} Back to Home</Link>
        </div>
      </AuthTerminal>
    </AuthLayout>
  );
}
