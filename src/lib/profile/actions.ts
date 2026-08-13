'use server';

/**
 * Server actions for user profile management and product interactions.
 * Handles profile CRUD, username lookup, wishlist/collection toggles, and product voting with XP sync.
 * Exports: getMyProfileUsername, ensureProfile, getProfileByUsername, getCollectionForProfile, getCurrentUser, isAuthenticated, updateProfile, toggleWishlist, toggleCollection, removeFromWishlist, removeFromCollection, voteOnProduct
 */

import { cache } from 'react';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSupabaseUser } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/utils';
import { syncRankBadge } from '@/lib/reputation/actions';
import { CACHE, invalidateTags } from '@/lib/cache';

async function _getCurrentUserAndProfile() {
  const user = await getSupabaseUser();
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
  // Collection is fetched separately (getCollectionForProfile) and joined
  // into the profile page's parallel batch — bundling it here serialized the
  // whole collection query before every other profile query could start.
  return prisma.profile.findUnique({
    where: { username },
    include: {
      _count: { select: { wishlist: true, collection: true } },
    },
  });
}

export async function getCollectionForProfile(profileId: string) {
  return prisma.collection.findMany({
    where: { profileId },
    include: {
      product: {
        // The profile-variant ProductCard only renders
        // slug/name/image/brand/productType — no price is shown for
        // owned items, so only the columns the card renders are selected.
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          productType: true,
          brand: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// cache() dedupes concurrent same-username lookups within one request
// (mirrors getCurrentUserAndProfile below) — zero-cost guard against a
// future duplicate call.
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

  // The profile page renders website/github/discord/monkeytype as raw <a href>.
  // Only http(s) is safe — a `javascript:` or `data:` scheme turns a profile
  // visit into stored XSS, so silently drop anything else at write time.
  const safeHttp = (val: string | null): string | null => {
    if (!val) return null;
    const t = val.trim();
    if (/^https?:\/\//i.test(t) && t.length <= 2048) return val;
    return null;
  };

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      displayName,
      bio,
      github: safeHttp(cleanUrl(github, PREFIXES.github)),
      discord: safeHttp(cleanUrl(discord, PREFIXES.discord)),
      reddit: cleanUrl(reddit, PREFIXES.reddit),
      monkeytype: safeHttp(cleanUrl(monkeytype, PREFIXES.monkeytype)),
      website: safeHttp(website),
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
  revalidatePath(`/profile/${profile.username}`);
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

  const { isVotingEligible, checkAndGrantReward } = await import('@/lib/auth/actions');
  const eligibility = await isVotingEligible(user.id);
  if (!eligibility.eligible) {
    return { error: 'voting_locked' };
  }

  // Self-heal the one-time credit reward for eligible users who connected
  // their providers before the reward existed (grant normally fires on login).
  await checkAndGrantReward(user.id);

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
    const newTotal = Math.max(0, (xp?.xp ?? 0) + xpDelta);
    if (xp) {
      await prisma.userXP.update({ where: { profileId: profile.id }, data: { xp: newTotal } });
    } else {
      await prisma.userXP.create({ data: { profileId: profile.id, xp: newTotal } });
    }
    await syncRankBadge(profile.id);
  }

  // The vote mutation above is complete. The product detail cache embeds
  // public vote tallies, so stale it now; the profile/catalog paths below
  // keep their existing behavior. Only the aggregate counts live in the
  // shared cache — never this user's vote.
  const votedProduct = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });
  if (votedProduct?.slug) {
    invalidateTags(CACHE.product(votedProduct.slug));
    revalidatePath(`/products/${votedProduct.slug}`);
  }

  revalidatePath('/keyboards');
  revalidatePath('/products');
  revalidatePath(`/profile/${profile.username}`);
  return { success: true };
}
