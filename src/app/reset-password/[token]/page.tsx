import { redirect } from 'next/navigation';

// Reads the token from params synchronously — opt out of the instant shell.
export const instant = false;

/**
 * Compatibility route. The current flow uses `/reset-password?token=<token>`
 * (Better Auth's callback redirects there). This keeps any old direct links to
 * `/reset-password/<token>` working by redirecting to the query format.
 */
export default async function ResetPasswordTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token) redirect('/reset-password');
  redirect(`/reset-password?token=${encodeURIComponent(token)}`);
}
