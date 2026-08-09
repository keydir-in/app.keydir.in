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
import { RegisterForm } from '@/components/auth/register-form';

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

        <RegisterForm />

        <div className="auth-alt-link">
          Already have an account? <Link href="/auth/login">Login {'\u2192'}</Link>
        </div>
      </AuthTerminal>
    </AuthLayout>
  );
}
