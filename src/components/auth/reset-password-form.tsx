'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthTerminal } from '@/components/auth/auth-terminal';
import { PasswordInput } from '@/components/auth/password-input';
import { authClient } from '@/lib/auth-client';

/**
 * Sets a new password with the one-time reset token that Better Auth placed
 * in the reset link (sent by email via Resend). Validates the new password
 * (minimum 8 characters, confirmation must match), prevents duplicate
 * submissions, and maps every reset failure to a generic "invalid or expired"
 * message so internal errors are never exposed.
 */
export function ResetPasswordForm({ token }: { token: string }) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading || submitted) return;
    setError('');

    const form = new FormData(e.currentTarget);
    const password = form.get('password') as string;
    const confirmPassword = form.get('confirmPassword') as string;

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (err) {
        setError(
          'This password reset link is invalid or has expired.',
        );
      } else {
        setSubmitted(true);
        setSuccess(true);
      }
    } catch {
      setError('This password reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title={'RESET\nYOUR\nPASSWORD.'}>
      <AuthTerminal>
        {error && <div className="auth-msg error" role="alert">{error}</div>}

        {success ? (
          <div className="auth-message-page">
            <div className="auth-msg-icon">{'\u2713'}</div>
            <h2>Password updated successfully.</h2>
            <div className="auth-oauth-actions">
              <Link href="/auth/login" className="btn-primary auth-btn">
                Sign in
              </Link>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <div className="auth-field">
                <label className="auth-label" htmlFor="reset-password">New Password</label>
                <PasswordInput
                  name="password"
                  id="reset-password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  aria-label="New password"
                />
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="reset-confirm">Confirm Password</label>
                <PasswordInput
                  name="confirmPassword"
                  id="reset-confirm"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  aria-label="Confirm new password"
                />
              </div>

              <button
                type="submit"
                className="btn-primary auth-btn auth-btn-tight"
                disabled={loading || submitted}
              >
                {loading ? 'Resetting...' : 'Reset Password \u2192'}
              </button>
            </form>

            <div className="auth-alt-link">
              <Link href="/forgot-password">Request a new reset link</Link>
            </div>
          </>
        )}

        <div className="auth-alt-link">
          <Link href="/auth/login">{'\u2190'} Back to Login</Link>
        </div>
      </AuthTerminal>
    </AuthLayout>
  );
}