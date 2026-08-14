/**
 * Forgot password page. Accepts an email address and sends a password
 * reset link via Supabase server action. Shows success/error feedback
 * and links back to login.
 */

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Forgot Password | KeyDir',
  robots: { index: false, follow: false },
};
// Reads searchParams (error/message) directly — opt out of the instant shell.
export const instant = false;
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthTerminal } from '@/components/auth/auth-terminal';
import { SubmitButton } from '@/components/auth/submit-button';
import { forgotPassword } from '@/lib/auth/actions';

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthLayout title={'RESET\nYOUR\nPASSWORD.'}>
      <AuthTerminal>
        {params.error && (
          <div className="auth-msg error" role="alert">{params.error}</div>
        )}
        {params.message && (
          <div className="auth-msg success" role="status">{params.message}</div>
        )}

        <p className="auth-message-sub auth-message-sub--block">
          Enter your email address and we&apos;ll send you a link to reset your password.
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
          Remember your password? <Link href="/auth/login">Login {'\u2192'}</Link>
        </div>
      </AuthTerminal>
    </AuthLayout>
  );
}
