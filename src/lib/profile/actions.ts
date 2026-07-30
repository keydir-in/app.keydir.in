'use server';

/**
 * Server actions for user profile management and product interactions.
 * Handles profile CRUD, username lookup, wishlist/collection toggles, and product voting with XP sync.
 * Exports: getMyProfileUsername, ensureProfile, getProfileByUsername, getCurrentUser, isAuthenticated, updateProfile, toggleWishlist, toggleCollection, removeFromWishlist, removeFromCollection, voteOnProduct
 */

import { cache } from 'react';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/utils';
import { syncRankBadge } from '@/lib/reputation/actions';

async function _getCurrentUserAndProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  return { user, profile };
}

export const getCurrentUserAndProfile = cache(_getCurrentUserAndProfile);

export async function getMyProfileUsername(): Promise<string | null> {
  const { profile } = await getCurrentUserAndProfile();
  return profile?.username ?? null;
}

export async function ensureProfile() {
  const { user } = await getCurrentUserAndProfile();
  if (!user) redirect('/auth/login');

  const existing = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (existing) return existing;

  const username = user.user_metadata?.username || slugify(user.email?.split('@')[0] || 'user');

  const profile = await prisma.profile.create({
    data: {
      userId: user.id,
      username,
      displayName: user.user_metadata?.full_name || user.user_metadata?.username || null,
    },
  });

  return profile;
}

async function _getProfileByUsername(username: string) {
  return prisma.profile.findUnique({
    where: { username },
    include: {
      wishlist: {
        include: {
          product: {
            include: {
              brand: { select: { name: true } },
              vendorProducts: {
                select: { effectivePrice: true },
                orderBy: { effectivePrice: 'asc' },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      collection: {
        include: {
          product: {
            include: {
              brand: { select: { name: true } },
              vendorProducts: {
                select: { effectivePrice: true },
                orderBy: { effectivePrice: 'asc' },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { wishlist: true, collection: true } },
    },
  });
}

export const getProfileByUsername = cache(_getProfileByUsername);

export async function getCurrentUser() {
  const { profile } = await getCurrentUserAndProfile();
  return profile;
}

export async function isAuthenticated(): Promise<boolean> {
  const { user } = await getCurrentUserAndProfile();
  return !!user;
}

export async function updateProfile(formData: FormData) {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user || !profile) redirect('/auth/login');

  const displayName = (formData.get('displayName') as string) || null;
  const bio = (formData.get('bio') as string) || null;
  const github = (formData.get('github') as string) || null;
  const discord = (formData.get('discord') as string) || null;
  const reddit = (formData.get('reddit') as string) || null;
  const monkeytype = (formData.get('monkeytype') as string) || null;
  const website = (formData.get('website') as string) || null;

  const PREFIXES = {
    github: 'https://github.com/',
    reddit: 'https://www.reddit.com/u/',
    discord: 'https://discord.com/users/',
    monkeytype: 'https://monkeytype.com/profile/',
  } as const;

  function cleanUrl(val: string | null, prefix: string): string | null {
    if (!val) return null;
    return val === prefix ? null : val;
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      displayName,
      bio,
      github: cleanUrl(github, PREFIXES.github),
      discord: cleanUrl(discord, PREFIXES.discord),
      reddit: cleanUrl(reddit, PREFIXES.reddit),
      monkeytype: cleanUrl(monkeytype, PREFIXES.monkeytype),
      website,
    },
  });

  revalidatePath(`/profile/${profile.username}`);
  redirect(`/profile/${profile.username}`);
}

export async function toggleWishlist(productId: string) {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user || !profile) redirect('/auth/login');

  const existing = await prisma.wishlist.findUnique({
    where: { profileId_productId: { profileId: profile.id, productId } },
  });

  if (existing) {
    await prisma.wishlist.delete({ where: { id: existing.id } });
  } else {
    await prisma.wishlist.create({ data: { profileId: profile.id, productId } });
  }

  revalidatePath('/products');
}

export async function toggleCollection(productId: string) {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user || !profile) redirect('/auth/login');

  const existing = await prisma.collection.findUnique({
    where: { profileId_productId: { profileId: profile.id, productId } },
  });

  if (existing) {
    await prisma.collection.delete({ where: { id: existing.id } });
  } else {
    await prisma.collection.create({ data: { profileId: profile.id, productId } });
  }

  revalidatePath('/products');
}

export async function removeFromWishlist(wishlistId: string) {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user || !profile) redirect('/auth/login');

  await prisma.wishlist.deleteMany({
    where: { id: wishlistId, profileId: profile.id },
  });

  revalidatePath(`/profile/${profile.username}`);
}

export async function removeFromCollection(collectionId: string) {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user || !profile) redirect('/auth/login');

  await prisma.collection.deleteMany({
    where: { id: collectionId, profileId: profile.id },
  });

  revalidatePath(`/profile/${profile.username}`);
}

export async function voteOnProduct(
  productId: string,
  type: 'upvote' | 'downvote'
): Promise<{ success?: boolean; error?: string }> {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user || !profile) return { error: 'auth_required' };

  const { isVotingEligible } = await import('@/lib/auth/actions');
  const eligibility = await isVotingEligible(user.id);
  if (!eligibility.eligible) {
    return { error: 'voting_locked' };
  }

  const existing = await prisma.vote.findUnique({
    where: { profileId_productId: { profileId: profile.id, productId } },
  });

  let xpDelta = 0;

  if (existing) {
    if (existing.type === type) {
      await prisma.vote.delete({ where: { id: existing.id } });
      xpDelta = -5;
    } else {
      await prisma.vote.update({ where: { id: existing.id }, data: { type } });
      xpDelta = 5;
    }
  } else {
    await prisma.vote.create({ data: { profileId: profile.id, productId, type } });
    xpDelta = 5;
  }

  if (xpDelta !== 0) {
    const xp = await prisma.userXP.findUnique({ where: { profileId: profile.id } });
    if (xp) {
      const newTotal = Math.max(0, xp.xp + xpDelta);
      await prisma.userXP.update({ where: { profileId: profile.id }, data: { xp: newTotal } });
      await syncRankBadge(profile.id);
    }
  }

  revalidatePath('/keyboards');
  revalidatePath('/products');
  return { success: true };
}
