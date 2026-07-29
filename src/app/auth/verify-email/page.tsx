/**
 * Email verification instruction page. Static page shown after registration
 * telling the user to check their inbox for a verification link. Provides
 * a fallback suggestion (check spam) and a back-to-login link.
 */

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Verify Email | KeyDir',
  robots: { index: false, follow: false },
};
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthTerminal } from '@/components/auth/auth-terminal';

export default function VerifyEmailPage() {
  return (
    <AuthLayout title={'VERIFY\nYOUR\nEMAIL.'}>
      <AuthTerminal>
        <div className="auth-message-page">
          <div className="auth-msg-icon">{'\uD83D\uDCE7'}</div>
          <h2>Check Your Email</h2>
          <p>
            We&apos;ve sent a verification link to your email address.
            Click the link to activate your account.
          </p>
          <p className="auth-message-sub">
            Didn&apos;t receive it? Check your spam folder or try registering again.
          </p>
        </div>

        <div className="auth-alt-link auth-gap">
          <Link href="/auth/login">{'\u2190'} Back to Login</Link>
        </div>
      </AuthTerminal>
    </AuthLayout>
  );
}
