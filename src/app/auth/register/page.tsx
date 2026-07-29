/**
 * Registration page with username, email, password, and confirm-password fields.
 * Includes a live password strength indicator. Server action creates the user
 * account via Supabase. Links back to login for existing users.
 */

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Create Account | KeyDir',
  robots: { index: false, follow: false },
};
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthTerminal } from '@/components/auth/auth-terminal';
import { PasswordInput } from '@/components/auth/password-input';
import { PasswordStrength } from '@/components/auth/password-strength';
import { SubmitButton } from '@/components/auth/submit-button';
import { register } from '@/lib/auth/actions';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthLayout title={'CREATE\nYOUR\nACCOUNT.'}>
      <AuthTerminal>
        {params.error && (
          <div className="auth-msg error" role="alert">{params.error}</div>
        )}

        <form action={register} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-username">Username</label>
            <input
              type="text"
              name="username"
              id="reg-username"
              required
              minLength={3}
              maxLength={20}
              pattern="[a-z0-9_]+"
              placeholder="shadow269"
              className="auth-input"
              autoComplete="username"
              aria-label="Username"
            />
            <p className="auth-helper">Your username is permanent and will be part of your public KeyDir profile.</p>
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-email">Email</label>
            <input
              type="email"
              name="email"
              id="reg-email"
              required
              placeholder="you@email.com"
              className="auth-input"
              autoComplete="email"
              aria-label="Email address"
            />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-password">Password</label>
            <PasswordInput
              name="password"
              id="reg-password"
              required
              minLength={8}
              autoComplete="new-password"
              aria-label="Password"
            />
            <PasswordStrength inputName="password" />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-confirm">Confirm Password</label>
            <PasswordInput
              name="confirmPassword"
              id="reg-confirm"
              required
              minLength={8}
              autoComplete="new-password"
              aria-label="Confirm password"
            />
          </div>

          <SubmitButton>
            <span className="auth-btn-text">Create Account</span>
            <span className="auth-btn-arrow">{'\u2192'}</span>
          </SubmitButton>
        </form>

        <div className="auth-alt-link">
          Already have an account? <Link href="/auth/login">Login {'\u2192'}</Link>
        </div>
      </AuthTerminal>
    </AuthLayout>
  );
}
