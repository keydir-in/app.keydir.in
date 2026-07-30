'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

import { isInternalRoute } from './utils';

export interface VotingEligibility {
  eligible: boolean;
  hasPassword: boolean;
  hasGoogle: boolean;
  hasDiscord: boolean;
  hasProfile: boolean;
  missingRequirements: string[];
}

export async function isVotingEligible(userId: string): Promise<VotingEligibility> {
  const linked = new Map<string, boolean>();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.identities) {
    for (const identity of user.identities) {
      linked.set(identity.provider, true);
    }
  }

  const rows = await prisma.$queryRaw<{ encrypted_password: string | null }[]>`
    SELECT encrypted_password FROM auth.users WHERE id = ${userId}
  `;
  const hasPassword = !!(rows[0]?.encrypted_password);
  const hasGoogle = linked.has('google');
  const hasDiscord = linked.has('discord');

  const profile = await prisma.profile.findUnique({ where: { userId }, select: { username: true } });
  const hasProfile = !!profile?.username;

  const missingRequirements: string[] = [];
  if (!hasPassword) missingRequirements.push('Password Login');
  if (!hasGoogle) missingRequirements.push('Google Connected');
  if (!hasDiscord) missingRequirements.push('Discord Connected');
  if (!hasProfile) missingRequirements.push('Profile Completed');

  return {
    eligible: missingRequirements.length === 0,
    hasPassword,
    hasGoogle,
    hasDiscord,
    hasProfile,
    missingRequirements,
  };
}

export async function checkAndGrantReward(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { voteRewardClaimed: true, voteCredits: true },
  });
  if (!profile || profile.voteRewardClaimed) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.identities) return;

  const providers = new Set(user.identities.map(i => i.provider));
  const rows = await prisma.$queryRaw<{ encrypted_password: string | null }[]>`
    SELECT encrypted_password FROM auth.users WHERE id = ${userId}
  `;
  const hasPassword = !!(rows[0]?.encrypted_password);

  if (!providers.has('google') || !providers.has('discord') || !hasPassword) return;

  await prisma.$transaction([
    prisma.profile.update({
      where: { userId },
      data: { voteCredits: profile.voteCredits + 10, voteRewardClaimed: true },
    }),
  ]);
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const next = formData.get('next') as string;
  const safeNext = next && isInternalRoute(next) ? next : '/';

  const accountExists = await prisma.$queryRaw<{ id: string; confirmed_at: string | null }[]>`
    SELECT id, confirmed_at FROM auth.users WHERE email = ${email} LIMIT 1
  `;

  if (accountExists.length === 0) {
    redirect('/auth/register?error=' + encodeURIComponent('No account found with this email. Please register first.'));
  }

  const account = accountExists[0];
  if (!account.confirmed_at) {
    redirect('/auth/verify-email');
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
      redirect('/auth/verify-email');
    }
    redirect('/auth/login?error=' + encodeURIComponent(error.message));
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: account.id },
    select: { registrationComplete: true },
  });
  if (profile && !profile.registrationComplete) {
    redirect('/auth/complete-registration');
  }

  revalidatePath('/', 'layout');
  redirect(safeNext);
}

export async function register(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const username = formData.get('username') as string;

  if (password !== confirmPassword) {
    redirect('/auth/register?error=' + encodeURIComponent('Passwords do not match'));
  }

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    redirect('/auth/register?error=' + encodeURIComponent('Username must be 3-20 characters: lowercase letters, numbers, or underscores'));
  }

  const taken = await prisma.profile.findUnique({ where: { username } });
  if (taken) {
    redirect('/auth/register?error=' + encodeURIComponent('Username already taken'));
  }

  const existingProfile = await prisma.$queryRaw<{ id: string }[]>`
    SELECT p.id FROM "Profile" p
    JOIN auth.users u ON u.id = p."userId"::uuid
    WHERE u.email = ${email} LIMIT 1
  `;
  if (existingProfile.length > 0) {
    redirect('/auth/login?error=' + encodeURIComponent('An account with this email already exists. Please login instead.'));
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('rate') || msg.includes('limit') || msg.includes('too many')) {
      redirect('/auth/register?error=' + encodeURIComponent('Too many attempts. Please wait a few minutes and try again.'));
    }
    redirect('/auth/register?error=' + encodeURIComponent(error.message));
  }

  if (data?.user) {
    await prisma.profile.create({
      data: {
        userId: data.user.id,
        username,
        displayName: username,
        registrationComplete: true,
      },
    });
    await supabase.auth.updateUser({
      data: { registration_complete: true },
    });
  }

  redirect('/auth/verify-email');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function signInWithGoogle(next?: string) {
  const supabase = await createClient();
  const safeNext = next && isInternalRoute(next) ? next : '/';
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(safeNext)}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });

  if (error) redirect('/auth/login?error=' + encodeURIComponent(error.message));
  if (data.url) redirect(data.url);
}

export async function signInWithDiscord(next?: string) {
  const supabase = await createClient();
  const safeNext = next && isInternalRoute(next) ? next : '/';
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(safeNext)}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: { redirectTo },
  });

  if (error) redirect('/auth/login?error=' + encodeURIComponent(error.message));
  if (data.url) redirect(data.url);
}

export async function linkProviderAction(provider: string) {
  await linkProvider(provider as 'google' | 'discord');
}

export async function linkProvider(provider: 'google' | 'discord') {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.linkIdentity({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/settings`,
    },
  });

  if (error) redirect('/settings?error=' + encodeURIComponent(error.message));
  if (data.url) redirect(data.url);
}

export async function unlinkProvider(provider: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const identities = user.identities;

  if (!identities || identities.length <= 1) {
    redirect('/settings?error=' + encodeURIComponent('Cannot unlink your last authentication method'));
  }

  const identity = identities.find((i) => i.provider === provider);
  if (!identity) {
    redirect('/settings?error=' + encodeURIComponent('Provider not connected'));
  }

  const { error } = await supabase.auth.unlinkIdentity(identity);

  if (error) {
    redirect('/settings?error=' + encodeURIComponent(error.message));
  }

  revalidatePath('/settings');
  redirect('/settings?message=' + encodeURIComponent(`${provider} unlinked`));
}

async function _getConnectedAccounts() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const identities = user.identities;

  const linked = new Map<string, { email?: string; username?: string; lastUsedAt?: string }>();
  if (identities) {
    for (const identity of identities) {
      linked.set(identity.provider, {
        email: (identity.identity_data?.email as string | undefined) ?? undefined,
        username:
          (identity.identity_data?.full_name as string | undefined) ??
          (identity.identity_data?.username as string | undefined) ??
          undefined,
        lastUsedAt: identity.last_sign_in_at ?? undefined,
      });
    }
  }

  const rows = await prisma.$queryRaw<{ encrypted_password: string | null }[]>`
    SELECT encrypted_password FROM auth.users WHERE id = ${user.id}
  `;
  const hasPassword = !!(rows[0]?.encrypted_password);

  const emailConnected = linked.has('email') || hasPassword;
  const googleConnected = linked.has('google');
  const discordConnected = linked.has('discord');

  const profileRow = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { voteCredits: true, voteRewardClaimed: true },
  });
  const voteCredits = profileRow?.voteCredits ?? 0;
  const voteRewardClaimed = profileRow?.voteRewardClaimed ?? false;

  const votingEligible = emailConnected && googleConnected && discordConnected;

  const oauthEmails: { email: string; provider: string }[] = [];
  if (linked.get('google')?.email) oauthEmails.push({ email: linked.get('google')!.email!, provider: 'google' });
  if (linked.get('discord')?.email) oauthEmails.push({ email: linked.get('discord')!.email!, provider: 'discord' });

  return {
    hasPassword,
    emailConnected,
    googleConnected,
    discordConnected,
    email: user.email ?? undefined,
    oauthEmails,
    methods: [
      {
        id: 'password' as const,
        name: 'Password Login',
        connected: hasPassword,
        lastUsedAt: hasPassword ? (user.last_sign_in_at ?? undefined) : undefined,
      },
      {
        id: 'google' as const,
        name: 'Google',
        connected: googleConnected,
        email: linked.get('google')?.email,
        lastUsedAt: linked.get('google')?.lastUsedAt,
      },
      {
        id: 'discord' as const,
        name: 'Discord',
        connected: discordConnected,
        email: linked.get('discord')?.email ?? linked.get('discord')?.username,
        lastUsedAt: linked.get('discord')?.lastUsedAt,
      },
    ],
    votingEligible,
    voteCredits,
    voteRewardClaimed,
  };
}
export const getConnectedAccounts = cache(_getConnectedAccounts);

export async function enableEmailLogin(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (password !== confirmPassword) {
    redirect('/settings?error=' + encodeURIComponent('Passwords do not match'));
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect('/settings?error=' + encodeURIComponent(error.message));
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { userId: true },
  });
  if (profile) {
    await checkAndGrantReward(user.id);
  }

  revalidatePath('/settings');
  redirect('/settings?message=' + encodeURIComponent('Password Login enabled'));
}

export async function changePassword(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (newPassword !== confirmPassword) {
    redirect('/settings?error=' + encodeURIComponent('New passwords do not match'));
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });
  if (signInError) {
    redirect('/settings?error=' + encodeURIComponent('Current password is incorrect'));
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    redirect('/settings?error=' + encodeURIComponent(error.message));
  }

  revalidatePath('/settings');
  redirect('/settings?message=' + encodeURIComponent('Password changed'));
}

export async function disablePasswordLogin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const identities = user.identities;
  if (!identities || identities.length <= 1) {
    redirect('/settings?error=' + encodeURIComponent('Cannot disable your last authentication method'));
  }

  const emailIdentity = identities?.find((i) => i.provider === 'email');
  if (!emailIdentity) {
    redirect('/settings?error=' + encodeURIComponent('Password Login is not enabled'));
  }

  const { error } = await supabase.auth.unlinkIdentity(emailIdentity);
  if (error) {
    redirect('/settings?error=' + encodeURIComponent(error.message));
  }

  revalidatePath('/settings');
  redirect('/settings?message=' + encodeURIComponent('Password Login disabled'));
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  });

  if (error) {
    redirect('/auth/forgot-password?error=' + encodeURIComponent(error.message));
  }

  redirect('/auth/forgot-password?message=Check+your+email+for+the+reset+link');
}

export async function completeOAuthRegistration(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const next = formData.get('next') as string;
  const safeNext = next && isInternalRoute(next) ? next : '/';

  const existing = await prisma.profile.findUnique({ where: { userId: user.id }, select: { registrationComplete: true } });
  if (existing?.registrationComplete) {
    redirect(safeNext);
  }

  const username = (formData.get('username') as string)?.toLowerCase().trim();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const emailField = formData.get('email') as string | null;

  if (!username || !/^[a-z0-9_]{3,20}$/.test(username)) {
    redirect('/auth/complete-registration?error=' + encodeURIComponent('Username must be 3-20 characters: lowercase letters, numbers, or underscores'));
  }

  if (!password || password.length < 8) {
    redirect('/auth/complete-registration?error=' + encodeURIComponent('Password must be at least 8 characters'));
  }

  if (password !== confirmPassword) {
    redirect('/auth/complete-registration?error=' + encodeURIComponent('Passwords do not match'));
  }

  if (!user.email && emailField) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField)) {
      redirect('/auth/complete-registration?error=' + encodeURIComponent('Please enter a valid email address'));
    }
    const { error: emailError } = await supabase.auth.updateUser({ email: emailField });
    if (emailError) {
      redirect('/auth/complete-registration?error=' + encodeURIComponent(emailError.message));
    }
  }

  const taken = await prisma.profile.findUnique({ where: { username } });
  if (taken) {
    redirect('/auth/complete-registration?error=' + encodeURIComponent('Username already taken'));
  }

  const { error: pwError } = await supabase.auth.updateUser({ password });
  if (pwError) {
    redirect('/auth/complete-registration?error=' + encodeURIComponent(pwError.message));
  }

  try {
    await prisma.profile.create({
      data: {
        userId: user.id,
        username,
        displayName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? username,
        registrationComplete: true,
      },
    });
  } catch (dbErr) {
    console.error("[completeOAuthRegistration] Profile create FAILED:", dbErr);
    redirect('/auth/complete-registration?error=' + encodeURIComponent('Failed to create profile. Please try again.'));
  }

  await supabase.auth.updateUser({
    data: { registration_complete: true },
  });

  await checkAndGrantReward(user.id);

  revalidatePath('/', 'layout');
  redirect(safeNext);
}

export interface CurrentUser {
  id: string;
  email: string | null;
  username: string;
  avatarUrl: string | null;
  displayName: string | null;
  isAdmin: boolean;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase());

  const email = user.email ?? '';
  const username = user.user_metadata?.username ?? email.split('@')[0] ?? '';

  return {
    id: user.id,
    email: user.email ?? null,
    username,
    avatarUrl: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
    displayName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
    isAdmin: adminEmails.includes(email.toLowerCase()),
  };
}
