'use client';

/**
 * Password reset page (client component). Calls Supabase updateUser
 * directly from the browser to set a new password. Shows a success
 * confirmation with a link to login after the update completes.
 */

import { useState } from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthTerminal } from '@/components/auth/auth-terminal';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const password = form.get('password') as string;
    const supabase = createClient();

    const { error: err } = await supabase.auth.updateUser({ password });

    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  return (
    <AuthLayout title={'SET NEW\nPASSWORD.'}>
      <AuthTerminal>
        {error && <div className="auth-msg error" role="alert">{error}</div>}

        {success ? (
          <div className="auth-message-page">
            <div className="auth-msg-icon">{'\u2713'}</div>
            <h2>Password Updated</h2>
            <p>Your password has been changed successfully.</p>
            <div className="auth-alt-link auth-gap">
              <Link href="/auth/login">Login {'\u2192'}</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label" htmlFor="reset-password">New Password</label>
              <input
                type="password"
                name="password"
                id="reset-password"
                required
                minLength={8}
                placeholder="{'\u2022'}{'\u2022'}{'\u2022'}{'\u2022'}{'\u2022'}{'\u2022'}{'\u2022'}{'\u2022'}"
                className="auth-input"
                autoComplete="new-password"
                aria-label="New password"
              />
            </div>

            <button type="submit" className="btn-primary auth-btn auth-btn-tight" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password \u2192'}
            </button>
          </form>
        )}

        <div className="auth-alt-link">
          <Link href="/auth/login">{'\u2190'} Back to Login</Link>
        </div>
      </AuthTerminal>
    </AuthLayout>
  );
}
