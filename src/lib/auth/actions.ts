'use server';

import { cache } from 'react';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAuthUser, getBaseURL } from '@/lib/auth/session';
import {
  adoptLegacyProfile,
  getLegacyEligibility,
  findLegacyUserByEmail,
  migrateLegacyUser,
  verifyLegacyPassword,
} from '@/lib/auth/legacy';
import { isInternalRoute } from './utils';

export interface VotingEligibility {
  eligible: boolean;
  hasPassword: boolean;
  hasGoogle: boolean;
  hasDiscord: boolean;
  hasProfile: boolean;
  missingRequirements: string[];
}

/**
 * Dual-source eligibility: Better Auth accounts (providerId `credential` /
 * `google` / `discord`) are authoritative; the legacy Supabase `auth.users`
 * + `auth.identities` state is used as a fallback until migrated.
 */
async function getProviderState(userId: string) {
  const baUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { providerId: true },
  });
  const baProviders = new Set(accounts.map((a) => a.providerId));

  let legacy = { hasPassword: false, hasGoogle: false, hasDiscord: false };
  if (baUser?.email) {
    legacy = await getLegacyEligibility(baUser.email);
  }

  return {
    hasPassword: baProviders.has('credential') || legacy.hasPassword,
    hasGoogle: baProviders.has('google') || legacy.hasGoogle,
    hasDiscord: baProviders.has('discord') || legacy.hasDiscord,
  };
}

export async function isVotingEligible(userId: string): Promise<VotingEligibility> {
  const [state, profile] = await Promise.all([
    getProviderState(userId),
    prisma.profile.findUnique({ where: { userId }, select: { username: true } }),
  ]);

  const hasProfile = Boolean(profile?.username);
  const { hasPassword, hasGoogle, hasDiscord } = state;

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

export async function canUploadSoundTests(userId: string, isVerified: boolean): Promise<boolean> {
  if (isVerified) return true;
  const eligibility = await isVotingEligible(userId);
  return eligibility.eligible;
}

export async function checkAndGrantReward(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { voteRewardClaimed: true, voteCredits: true },
  });
  if (!profile || profile.voteRewardClaimed) return;

  const state = await getProviderState(userId);
  if (!state.hasPassword || !state.hasGoogle || !state.hasDiscord) return;

  await prisma.profile.update({
    where: { userId },
    data: { voteCredits: profile.voteCredits + 10, voteRewardClaimed: true },
  });
}

function loginError(message: string) {
  return '/auth/login?error=' + encodeURIComponent(message);
}

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const next = formData.get('next') as string;
  const safeNext = next && isInternalRoute(next) ? next : '/';

  if (!email || !password) {
    redirect(loginError('Please enter your email and password'));
  }

  const baUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  const legacy = await findLegacyUserByEmail(email);

  if (!baUser && !legacy) {
    redirect(
      '/auth/register?error=' +
        encodeURIComponent('No account found with this email. Please register first.'),
    );
  }

  // Legacy-only user: verify the old bcrypt hash, then migrate to Better Auth.
  if (!baUser && legacy) {
    if (!legacy.encryptedPassword && legacy.providerIds.includes('google')) {
      redirect(
        loginError(
          'This account was created with Google. Please sign in with Google to continue.',
        ),
      );
    }
    const ok = await verifyLegacyPassword(email, password);
    if (!ok) redirect(loginError('Invalid email or password'));
    await migrateLegacyUser(email, password);
  }

  let sessionUser: { id: string } | undefined;
  try {
    const result = await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });
    sessionUser = result.user;
  } catch {
    redirect(loginError('Invalid email or password'));
  }

  if (sessionUser) {
    const profile = await prisma.profile.findUnique({
      where: { userId: sessionUser.id },
      select: { registrationComplete: true },
    });
    if (profile && !profile.registrationComplete) {
      redirect('/auth/complete-registration');
    }
  }

  revalidatePath('/', 'layout');
  redirect(safeNext);
}

export async function register(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const username = (formData.get('username') as string)?.toLowerCase().trim();

  if (formData.get('consent') !== 'true') {
    redirect('/auth/register?error=' + encodeURIComponent('You must agree to the Terms of Service and Privacy Policy before creating an account'));
  }

  if (password !== confirmPassword) {
    redirect('/auth/register?error=' + encodeURIComponent('Passwords do not match'));
  }

  if (!username || !/^[a-z0-9_]{3,20}$/.test(username)) {
    redirect('/auth/register?error=' + encodeURIComponent('Username must be 3-20 characters: lowercase letters, numbers, or underscores'));
  }

  const taken = await prisma.profile.findUnique({ where: { username } });
  if (taken) {
    redirect('/auth/register?error=' + encodeURIComponent('Username already taken'));
  }

  const baUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  const legacy = await findLegacyUserByEmail(email);
  if (baUser || legacy) {
    redirect('/auth/login?error=' + encodeURIComponent('An account with this email already exists. Please login instead.'));
  }

  let newUserId: string | undefined;
  try {
    const result = await auth.api.signUpEmail({
      body: { name: username, email, password },
      headers: await headers(),
    });
    newUserId = result.user.id;
  } catch {
    redirect('/auth/register?error=' + encodeURIComponent('Registration failed. Please try again.'));
  }

  if (newUserId) {
    await prisma.profile.create({
      data: {
        userId: newUserId,
        username,
        displayName: username,
        registrationComplete: true,
        consentAccepted: true,
        consentVersion: 'v1',
      },
    });
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function logout() {
  await auth.api.signOut({ headers: await headers() });
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signInWithGoogle(next?: string) {
  const safeNext = next && isInternalRoute(next) ? next : '/';
  const callbackURL =
    `${getBaseURL()}/auth/complete-registration?next=${encodeURIComponent(safeNext)}`;

  let result;
  try {
    result = await auth.api.signInSocial({
      body: {
        provider: 'google',
        callbackURL,
        errorCallbackURL: `${getBaseURL()}/auth/login?error=oauth_failed`,
      },
      headers: await headers(),
    });
  } catch {
    redirect('/auth/login?error=oauth_failed');
  }

  if (result.url) redirect(result.url);
  redirect('/auth/login?error=oauth_failed');
}

export async function signInWithDiscord(next?: string) {
  const safeNext = next && isInternalRoute(next) ? next : '/';
  const callbackURL =
    `${getBaseURL()}/auth/complete-registration?next=${encodeURIComponent(safeNext)}`;

  let result;
  try {
    result = await auth.api.signInSocial({
      body: {
        provider: 'discord',
        callbackURL,
        errorCallbackURL: `${getBaseURL()}/auth/login?error=oauth_failed`,
      },
      headers: await headers(),
    });
  } catch {
    redirect('/auth/login?error=oauth_failed');
  }

  if (result.url) redirect(result.url);
  redirect('/auth/login?error=oauth_failed');
}

export async function linkProviderAction(provider: string) {
  await linkProvider(provider as 'google' | 'discord');
}

export async function linkProvider(provider: 'google' | 'discord') {
  let result;
  try {
    result = await auth.api.linkSocialAccount({
      body: {
        provider,
        callbackURL: `${getBaseURL()}/settings`,
      },
      headers: await headers(),
    });
  } catch {
    redirect('/settings?error=' + encodeURIComponent('Provider is not configured yet'));
  }

  if (result.url) redirect(result.url);
  redirect('/settings?error=' + encodeURIComponent('Failed to link provider'));
}

async function countAllMethods(userId: string, email: string) {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { providerId: true },
  });
  const baSet = new Set(accounts.map((a) => a.providerId));
  const legacy = await getLegacyEligibility(email);
  const total = new Set<string>();
  for (const p of baSet) total.add(p);
  if (legacy.hasPassword) total.add('credential');
  if (legacy.hasGoogle) total.add('google');
  if (legacy.hasDiscord) total.add('discord');
  return { baSet, total };
}

export async function unlinkProvider(provider: string) {
  const user = await getAuthUser();
  if (!user) redirect('/auth/login');

  const { total } = await countAllMethods(user.id, user.email ?? '');
  if (total.size <= 1) {
    redirect('/settings?error=' + encodeURIComponent('Cannot unlink your last authentication method'));
  }

  try {
    await auth.api.unlinkAccount({
      body: { providerId: provider },
      headers: await headers(),
    });
  } catch {
    redirect('/settings?error=' + encodeURIComponent('Provider not connected'));
  }

  revalidatePath('/settings');
  redirect('/settings?message=' + encodeURIComponent(`${provider} unlinked`));
}

async function _getConnectedAccounts() {
  const user = await getAuthUser();
  if (!user) return null;

  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    select: { providerId: true },
  });
  const baProviders = new Set(accounts.map((a) => a.providerId));
  const legacy = await getLegacyEligibility(user.email ?? '');

  const hasPassword = baProviders.has('credential') || legacy.hasPassword;
  const googleConnected = baProviders.has('google') || legacy.hasGoogle;
  const discordConnected = baProviders.has('discord') || legacy.hasDiscord;
  const emailConnected = Boolean(user.email) || hasPassword;

  const lastSession = await prisma.session.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  const lastUsedAt = lastSession?.createdAt.toISOString();

  const profileRow = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { voteCredits: true, voteRewardClaimed: true },
  });
  const voteCredits = profileRow?.voteCredits ?? 0;
  const voteRewardClaimed = profileRow?.voteRewardClaimed ?? false;

  const votingEligible = hasPassword && googleConnected && discordConnected;

  const oauthEmails: { email: string; provider: string }[] = [];
  if (googleConnected && user.email) oauthEmails.push({ email: user.email, provider: 'google' });
  if (discordConnected && user.email) oauthEmails.push({ email: user.email, provider: 'discord' });

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
        lastUsedAt: hasPassword ? lastUsedAt : undefined,
      },
      {
        id: 'google' as const,
        name: 'Google',
        connected: googleConnected,
        email: googleConnected ? (user.email ?? undefined) : undefined,
      },
      {
        id: 'discord' as const,
        name: 'Discord',
        connected: discordConnected,
        email: discordConnected ? (user.email ?? undefined) : undefined,
      },
    ],
    votingEligible,
    voteCredits,
    voteRewardClaimed,
  };
}

/**
 * Deduped per request: the settings page calls this three times (hero,
 * provider section, account details). The result is request/user-specific
 * account state, so it must never enter a shared data cache — React cache()
 * scopes it to a single request only.
 */
export const getConnectedAccounts = cache(_getConnectedAccounts);

export async function enableEmailLogin(formData: FormData) {
  const user = await getAuthUser();
  if (!user) redirect('/auth/login');

  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (password !== confirmPassword) {
    redirect('/settings?error=' + encodeURIComponent('Passwords do not match'));
  }

  try {
    await auth.api.setPassword({
      body: { newPassword: password },
      headers: await headers(),
    });
  } catch {
    redirect('/settings?error=' + encodeURIComponent('Could not enable password login. Please try again.'));
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
  const user = await getAuthUser();
  if (!user) redirect('/auth/login');

  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (newPassword !== confirmPassword) {
    redirect('/settings?error=' + encodeURIComponent('New passwords do not match'));
  }

  try {
    await auth.api.changePassword({
      body: { currentPassword, newPassword },
      headers: await headers(),
    });
  } catch {
    redirect('/settings?error=' + encodeURIComponent('Current password is incorrect'));
  }

  revalidatePath('/settings');
  redirect('/settings?message=' + encodeURIComponent('Password changed'));
}

export async function disablePasswordLogin() {
  const user = await getAuthUser();
  if (!user) redirect('/auth/login');

  const { total } = await countAllMethods(user.id, user.email ?? '');
  if (total.size <= 1) {
    redirect('/settings?error=' + encodeURIComponent('Cannot disable your last authentication method'));
  }

  try {
    await auth.api.unlinkAccount({
      body: { providerId: 'credential' },
      headers: await headers(),
    });
  } catch {
    redirect('/settings?error=' + encodeURIComponent('Password Login is not enabled'));
  }

  revalidatePath('/settings');
  redirect('/settings?message=' + encodeURIComponent('Password Login disabled'));
}

export async function forgotPassword(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();

  // Safe server-side diagnostics only — never log the reset token, password,
  // or full reset URL. The recipient is masked.
  console.info(`[KeyDir] reset request started (recipient=${maskEmail(email)})`);

  // Always issue a reset request and always show the same generic response.
  // This deliberately does not reveal whether the email has an account, and
  // does not special-case social-only (Google/Discord) accounts. `redirectTo`
  // is the KeyDir reset-password UI: Better Auth validates the token at the
  // callback route and redirects there with `?token=...` (or `?error=...`).
  try {
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: "/reset-password" },
      headers: await headers(),
    });
    console.info('[KeyDir] reset request: Better Auth accepted the request');
  } catch (err) {
    // Never reveal failures (network, provider, OAuth-only, non-existent).
    console.warn(
      `[KeyDir] reset request: Better Auth rejected request (type=${err instanceof Error ? err.name : 'unknown'})`,
    );
  }

  redirect(
    '/forgot-password?message=' +
      encodeURIComponent("If an account exists for this email, we've sent a password reset link."),
  );
}

function maskEmail(email: string): string {
  const idx = email.indexOf('@');
  if (idx <= 0) return '***';
  const local = email.slice(0, idx);
  const domain = email.slice(idx);
  const visible = local.slice(0, 2);
  const rest = local.slice(2);
  return `${visible}${'*'.repeat(Math.max(rest.length, 3))}${domain}`;
}

export async function completeOAuthRegistration(formData: FormData) {
  const user = await getAuthUser();
  if (!user) redirect('/auth/login');

  const next = formData.get('next') as string;
  const safeNext = next && isInternalRoute(next) ? next : '/';

  const adopted = await adoptLegacyProfile(user.id, user.email ?? '');
  if (adopted?.registrationComplete) {
    revalidatePath('/', 'layout');
    redirect(safeNext);
  }

  const existing = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { registrationComplete: true },
  });
  if (existing?.registrationComplete) {
    redirect(safeNext);
  }

  const username = (formData.get('username') as string)?.toLowerCase().trim();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (formData.get('consent') !== 'true') {
    redirect('/auth/complete-registration?error=' + encodeURIComponent('You must agree to the Terms of Service and Privacy Policy before completing your account'));
  }

  if (!username || !/^[a-z0-9_]{3,20}$/.test(username)) {
    redirect('/auth/complete-registration?error=' + encodeURIComponent('Username must be 3-20 characters: lowercase letters, numbers, or underscores'));
  }

  if (!password || password.length < 8) {
    redirect('/auth/complete-registration?error=' + encodeURIComponent('Password must be at least 8 characters'));
  }

  if (password !== confirmPassword) {
    redirect('/auth/complete-registration?error=' + encodeURIComponent('Passwords do not match'));
  }

  const taken = await prisma.profile.findUnique({ where: { username } });
  if (taken) {
    redirect('/auth/complete-registration?error=' + encodeURIComponent('Username already taken'));
  }

  try {
    await auth.api.setPassword({
      body: { newPassword: password },
      headers: await headers(),
    });
  } catch {
    redirect('/auth/complete-registration?error=' + encodeURIComponent('Failed to set password. Please try again.'));
  }

  try {
    await prisma.profile.create({
      data: {
        userId: user.id,
        username,
        displayName: user.name ?? username,
        registrationComplete: true,
        consentAccepted: true,
        consentVersion: 'v1',
      },
    });
  } catch (dbErr) {
    console.error('[completeOAuthRegistration] Profile create FAILED:', dbErr);
    redirect('/auth/complete-registration?error=' + encodeURIComponent('Failed to create profile. Please try again.'));
  }

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

async function _getCurrentUser(): Promise<CurrentUser | null> {
  const user = await getAuthUser();
  if (!user) return null;

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase());

  const email = user.email ?? '';
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { username: true, displayName: true },
  });

  return {
    id: user.id,
    email: user.email ?? null,
    username: profile?.username ?? user.name?.toLowerCase() ?? email.split('@')[0] ?? '',
    avatarUrl: user.image,
    displayName: profile?.displayName ?? user.name ?? null,
    isAdmin: adminEmails.includes(email.toLowerCase()),
  };
}

export const getCurrentUser = cache(_getCurrentUser);
