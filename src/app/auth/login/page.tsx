/**
 * Login page with email/password form and social OAuth buttons (Google, Discord).
 * Server action handles authentication via Supabase. Displays error/success
 * messages from search params. When OAuth errors arrive from the callback,
 * renders a friendly explanation instead of exposing internal details.
 *
 * Supports a "next" query parameter to redirect users back to their
 * originating page after successful login.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthTerminal } from '@/components/auth/auth-terminal';
import { SocialButtons } from '@/components/auth/social-buttons';
import { PasswordInput } from '@/components/auth/password-input';
import { SubmitButton } from '@/components/auth/submit-button';

export const metadata: Metadata = {
  title: 'Login | KeyDir',
  robots: { index: false, follow: false },
};
// Reads searchParams (error/provider/next) directly — opt out of the instant shell.
export const instant = false;
import { login } from '@/lib/auth/actions';

const PROVIDER_NAMES: Record<string, string> = {
  google: 'Google',
  discord: 'Discord',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; provider?: string; next?: string }>;
}) {
  const params = await searchParams;
  const errorKey = params.error ?? '';
  const isOAuthError =
    errorKey === 'oauth_not_linked' ||
    errorKey === 'oauth_failed' ||
    errorKey === 'signup_disabled';
  const provider = (params.provider ?? '').toLowerCase();
  const providerName = PROVIDER_NAMES[provider] ?? (provider || 'Google/Discord');
  const next = params.next ?? '/';

  return (
    <AuthLayout title={'LOGIN\nTO\nYOUR\nACCOUNT.'}>
      <AuthTerminal>
        {isOAuthError ? (
          <>
            <div className="auth-msg info" role="alert">
              <strong>No account found</strong>
            </div>

            <p className="auth-oauth-msg">
              We couldn&apos;t find a KeyDir account linked to this {providerName} account.
            </p>

            <p className="auth-oauth-msg">
              Please create an account using your username, email, and password first.
            </p>

            <p className="auth-oauth-msg auth-oauth-msg--muted">
              Once you&apos;re signed in, you can link your {providerName} account from:<br />
              Settings &rarr; Connected Accounts
            </p>

            <div className="auth-oauth-actions">
              <Link href="/auth/register" className="btn-primary auth-btn">
                Create Account
              </Link>
              <Link href="/auth/login" className="btn-secondary auth-btn">
                Back to Login
              </Link>
            </div>
          </>
        ) : (
          <>
            {params.error && (
              <div className="auth-msg error" role="alert">
                {params.error}
              </div>
            )}
            {params.message && (
              <div className="auth-msg success" role="status">{params.message}</div>
            )}

            <form action={login} noValidate>
              <input type="hidden" name="next" value={next} />
              <div className="auth-field">
                <label className="auth-label" htmlFor="login-email">Email</label>
                <input
                  type="email"
                  name="email"
                  id="login-email"
                  required
                  placeholder="you@email.com"
                  className="auth-input"
                  autoComplete="email"
                  aria-label="Email address"
                />
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="login-password">Password</label>
                <PasswordInput
                  name="password"
                  id="login-password"
                  required
                  minLength={6}
                  autoComplete="current-password"
                  aria-label="Password"
                />
              </div>

              <div className="auth-row">
                <div className="auth-checkbox">
                  <input type="checkbox" id="remember" name="remember" />
                  <label htmlFor="remember">Remember Me</label>
                </div>
                <div className="auth-forgot-link">
                  <Link href="/forgot-password">Forgot Password?</Link>
                </div>
              </div>

              <SubmitButton>
                <span className="auth-btn-text">Login</span>
                <span className="auth-btn-arrow">{'\u2192'}</span>
              </SubmitButton>
            </form>

            <div className="auth-gap">
              <SocialButtons next={next} />
            </div>
          </>
        )}

        <div className="auth-alt-link">
          Don&apos;t have an account? <Link href="/auth/register">Register {'\u2192'}</Link>
        </div>
      </AuthTerminal>
    </AuthLayout>
  );
}