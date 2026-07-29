import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthTerminal } from '@/components/auth/auth-terminal';

export const metadata: Metadata = {
  title: 'Account Created | KeyDir',
  robots: { index: false, follow: false },
};

export default function AccountCreatedPage() {
  return (
    <AuthLayout title={'ACCOUNT\nCREATED.'}>
      <AuthTerminal>
        <div className="auth-message-page">
          <div className="auth-msg-icon">{'\u2713'}</div>
          <h2>Welcome to KeyDir</h2>
          <p>
            Your account has been created successfully.
            Check your email to verify your address, then log in.
          </p>
        </div>

        <Link href="/auth/login" className="btn-primary auth-btn auth-gap">
          Login {'\u2192'}
        </Link>

        <div className="auth-alt-link">
          <Link href="/">{'\u2190'} Back to Home</Link>
        </div>
      </AuthTerminal>
    </AuthLayout>
  );
}
