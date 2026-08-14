import { notFound } from 'next/navigation';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

// Reads the token from params synchronously — opt out of the instant shell.
export const instant = false;

/**
 * Route that Better Auth links to in password-reset emails:
 * `${BETTER_AUTH_URL}/reset-password/<token>?callbackURL=...`
 */
export default async function ResetPasswordTokenPage({  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token) notFound();
  return <ResetPasswordForm token={token} />;
}