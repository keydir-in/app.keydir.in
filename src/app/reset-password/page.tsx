import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthTerminal } from '@/components/auth/auth-terminal';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata: Metadata = {
  title: 'Reset Password | KeyDir',
  robots: { index: false, follow: false },
};
// Reads searchParams (token/error) directly — opt out of the instant shell.
export const instant = false;

/**
 * Reset password page. Better Auth's reset-password callback validates the
 * token in the email link and redirects here with `?token=<token>` (valid) or
 * `?error=INVALID_TOKEN` (missing/expired/used token). The token is passed to
 * Better Auth's official reset-password API — it is never validated here.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;
  const invalid = !token || Boolean(params.error);

  if (invalid) {
    return (
      <AuthLayout title={'RESET\nYOUR\nPASSWORD.'}>
        <AuthTerminal>
          <div className="auth-msg error" role="alert">
            This password reset link is invalid or has expired.
          </div>
          <div className="auth-alt-link">
            <Link href="/forgot-password">Request a new reset link</Link>
          </div>
          <div className="auth-alt-link">
            <Link href="/auth/login">{'\u2190'} Back to Login</Link>
          </div>
        </AuthTerminal>
      </AuthLayout>
    );
  }

  return <ResetPasswordForm token={token} />;
}