/**
 * Server-side session helpers backed by Better Auth.
 *
 * Replaces the old Supabase `auth.getUser()` calls. Everything reads the
 * Better Auth session cookie, validates it against the `session` table and
 * returns the signed-in user. Request-scoped via React cache().
 */
import { cache } from 'react';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export interface AuthAccount {
  providerId: string;
  accountId: string;
}

export interface AuthUser {
  id: string;
  email: string | null;
  emailVerified: boolean;
  name: string;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  accounts: AuthAccount[];
}

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  const session = await getSession();
  if (!session?.user) return null;

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: { providerId: true, accountId: true },
  });

  return {
    id: session.user.id,
    email: session.user.email,
    emailVerified: session.user.emailVerified,
    name: session.user.name,
    image: session.user.image ?? null,
    createdAt: session.user.createdAt,
    updatedAt: session.user.updatedAt,
    accounts,
  };
});

export async function requireAuthUser(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) throw new Error('AUTH_REQUIRED');
  return user;
}

export function getBaseURL(): string {
  return process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}
