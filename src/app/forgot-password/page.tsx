/**
 * Forgot password page. Accepts an email address and sends a Better Auth
 * password reset link via Resend. Always shows the same generic response
 * so account existence is never revealed. Links back to login.
 */

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Forgot Password | KeyDir',
  robots: { index: false, follow: false },
};
// Reads searchParams (message) directly — opt out of the instant shell.
export const instant = false;
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthTerminal } from '@/components/auth/auth-terminal';
import { SubmitButton } from '@/components/auth/submit-button';
import { forgotPassword } from '@/lib/auth/actions';

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthLayout title={'FORGOT\nYOUR\nPASSWORD?'}>
      <AuthTerminal>
        {params.message && (
          <div className="auth-msg success" role="status">{params.message}</div>
        )}

        <p className="auth-message-sub auth-message-sub--block">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        <form action={forgotPassword}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="forgot-email">Email</label>
            <input
              type="email"
              name="email"
              id="forgot-email"
              required
              placeholder="you@email.com"
              className="auth-input"
              autoComplete="email"
              aria-label="Email address"
            />
          </div>

          <SubmitButton>
            <span className="auth-btn-text">Send Reset Link {'\u2192'}</span>
          </SubmitButton>
        </form>

        <div className="auth-alt-link">
          <Link href="/auth/login">{'\u2190'} Back to Login</Link>
        </div>
      </AuthTerminal>
    </AuthLayout>
  );
}