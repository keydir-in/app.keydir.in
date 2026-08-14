import { redirect } from 'next/navigation';

/**
 * Supabase-era password-reset route. Password resets now go through
 * `/reset-password/<token>` (linked by Better Auth), so this legacy
 * path just sends users to the login page.
 */
export default function LegacyResetPasswordPage() {
  redirect('/auth/login');
}