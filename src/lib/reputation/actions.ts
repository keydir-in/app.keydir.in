'use server';

/**
 * Server actions for the XP/reputation system, badges, and contribution management.
 * Handles XP awarding, rank badge syncing, contribution approval/rejection, and user moderation (ban/suspend).
 * Exports: ensureSystemBadges, syncRankBadge, syncCommunityMember, assignCommunityBadge, getProfileXP, getProfileRank, getUserBadges, getProfileStats, updateXP, setXP, createContribution, approveContribution, rejectContribution, adminDirectContribution, deleteContribution, getPendingContributions, getBadges, createBadge, updateBadge, deleteBadge, assignBadge, removeBadgeFromUser, suspendUser, banUser, liftBan, getActiveBan, getAllUsers, getUserActivityLog, reorderBadges, bulkDeleteBadges, duplicateBadge
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/admin-auth';
import { XP_VALUES, getRank, getBadgePriority } from '@/lib/reputation';
import type { ContributionType } from '@prisma/client';

// ═══ HELPERS ═══

async function ensureUserXP(profileId: string) {
  const existing = await prisma.userXP.findUnique({ where: { profileId } });
  if (existing) return existing;
  return prisma.userXP.create({ data: { profileId, xp: 0 } });
}

// ═══ SYSTEM BADGES ═══

const SYSTEM_BADGES = [
  { slug: 'community-member', name: 'Community Member', type: 'community', sortOrder: 0, icon: '', bgColor: '#FAFF00', textColor: '#111111', borderColor: '#111111', xpRequired: 0 },
  { slug: 'vendor', name: 'Vendor', type: 'community', sortOrder: 1, icon: '🏪', bgColor: '#00FF88', textColor: '#111111', borderColor: '#111111', xpRequired: 0 },
  { slug: 'builder', name: 'Builder', type: 'community', sortOrder: 2, icon: '🔧', bgColor: '#00CCFF', textColor: '#111111', borderColor: '#111111', xpRequired: 0 },
  { slug: 'moderator', name: 'Moderator', type: 'community', sortOrder: 3, icon: '🛡️', bgColor: '#AA00FF', textColor: '#FFFFFF', borderColor: '#111111', xpRequired: 0 },
  { slug: 'developer', name: 'Developer', type: 'community', sortOrder: 4, icon: '💻', bgColor: '#FF6600', textColor: '#111111', borderColor: '#111111', xpRequired: 0 },
  { slug: 'verified-store', name: 'Verified Store', type: 'community', sortOrder: 5, icon: '✅', bgColor: '#00FF88', textColor: '#111111', borderColor: '#111111', xpRequired: 0 },
  { slug: 'staff', name: 'Staff', type: 'community', sortOrder: 6, icon: '⭐', bgColor: '#FFD700', textColor: '#111111', borderColor: '#111111', xpRequired: 0 },
  { slug: 'sponsor', name: 'Sponsor', type: 'community', sortOrder: 7, icon: '💎', bgColor: '#FF3366', textColor: '#FFFFFF', borderColor: '#111111', xpRequired: 0 },
  { slug: 'rank-newbie', name: 'Newbie', type: 'rank', sortOrder: 10, icon: '', bgColor: '#FAFF00', textColor: '#111111', borderColor: '#111111', xpRequired: 0 },
  { slug: 'rank-member', name: 'Member', type: 'rank', sortOrder: 11, icon: '', bgColor: '#FAFF00', textColor: '#111111', borderColor: '#111111', xpRequired: 50 },
  { slug: 'rank-enthusiast', name: 'Enthusiast', type: 'rank', sortOrder: 12, icon: '', bgColor: '#FAFF00', textColor: '#111111', borderColor: '#111111', xpRequired: 150 },
  { slug: 'rank-contributor', name: 'Contributor', type: 'rank', sortOrder: 13, icon: '', bgColor: '#FAFF00', textColor: '#111111', borderColor: '#111111', xpRequired: 400 },
  { slug: 'rank-trusted-contributor', name: 'Trusted Contributor', type: 'rank', sortOrder: 14, icon: '', bgColor: '#FAFF00', textColor: '#111111', borderColor: '#111111', xpRequired: 800 },
  { slug: 'rank-expert', name: 'Expert', type: 'rank', sortOrder: 15, icon: '', bgColor: '#FAFF00', textColor: '#111111', borderColor: '#111111', xpRequired: 1500 },
  { slug: 'rank-veteran', name: 'Veteran', type: 'rank', sortOrder: 16, icon: '', bgColor: '#FAFF00', textColor: '#111111', borderColor: '#111111', xpRequired: 3000 },
  { slug: 'rank-elite', name: 'Elite', type: 'rank', sortOrder: 17, icon: '', bgColor: '#FAFF00', textColor: '#111111', borderColor: '#111111', xpRequired: 6000 },
];

let _badgesSeeded = false;

export async function ensureSystemBadges() {
  if (_badgesSeeded) return;

  // Cheap existence check instead of unconditionally running the upsert
  // transaction on every cold start (the module flag resets each one).
  const existing = await prisma.badge.count({
    where: { slug: { in: SYSTEM_BADGES.map((b) => b.slug) } },
  });
  if (existing === SYSTEM_BADGES.length) {
    _badgesSeeded = true;
    return;
  }

  await prisma.$transaction(
    SYSTEM_BADGES.map((b) =>
      prisma.badge.upsert({
        where: { slug: b.slug },
        update: { xpRequired: b.xpRequired, type: b.type },
        create: {
          slug: b.slug,
          name: b.name,
          type: b.type,
          sortOrder: b.sortOrder,
          icon: b.icon || null,
          bgColor: b.bgColor,
          textColor: b.textColor,
          borderColor: b.borderColor,
          xpRequired: b.xpRequired,
        },
      })
    )
  );
  _badgesSeeded = true;
}

export async function syncRankBadge(profileId: string) {
  const xp = await getProfileXP(profileId);

  const allRankBadges = await prisma.badge.findMany({
    where: { type: 'rank' },
    orderBy: { xpRequired: 'asc' },
  });

  if (allRankBadges.length === 0) return;

  let bestBadge = allRankBadges[0];
  for (const b of allRankBadges) {
    if (xp >= b.xpRequired) bestBadge = b;
  }

  const currentRankBadges = await prisma.userBadge.findMany({
    where: { profileId, badge: { type: 'rank' } },
  });

  const toRemove = currentRankBadges.filter(ub => ub.badgeId !== bestBadge.id);
  if (toRemove.length > 0) {
    await prisma.userBadge.deleteMany({ where: { id: { in: toRemove.map(ub => ub.id) } } });
  }

  const hasRank = currentRankBadges.some(ub => ub.badgeId === bestBadge.id);
  if (!hasRank) {
    await prisma.userBadge.create({ data: { profileId, badgeId: bestBadge.id } });
  }
}

export async function syncCommunityMember(profileId: string) {
  const badge = await prisma.badge.findUnique({ where: { slug: 'community-member' } });
  if (!badge) return;

  // Handle legacy 'system' type — update to 'community' if needed
  if (badge.type !== 'community') {
    await prisma.badge.update({ where: { id: badge.id }, data: { type: 'community' } });
  }

  const existing = await prisma.userBadge.findUnique({
    where: { profileId_badgeId: { profileId, badgeId: badge.id } },
  });

  if (!existing) {
    // Remove any other community badges before assigning default
    await prisma.userBadge.deleteMany({
      where: { profileId, badge: { type: 'community' } },
    });
    await prisma.userBadge.create({ data: { profileId, badgeId: badge.id } });
  }
}

export async function assignCommunityBadge(profileId: string, badgeId: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: 'not_authorized' as const };

  await prisma.userBadge.deleteMany({
    where: { profileId, badge: { type: 'community' } },
  });

  if (badgeId) {
    const badge = await prisma.badge.findUnique({ where: { id: badgeId } });
    if (!badge || badge.type !== 'community') return { error: 'invalid_badge' as const };
    await prisma.userBadge.create({ data: { profileId, badgeId } });
  }

  revalidatePath('/admin/users');
  revalidatePath('/profile/[username]', 'page');
  return { ok: true };
}

// ═══ XP & RANK ═══

export async function getProfileXP(profileId: string) {
  const xp = await prisma.userXP.findUnique({ where: { profileId } });
  return xp?.xp || 0;
}

export async function getProfileRank(profileId: string) {
  const xp = await getProfileXP(profileId);
  return getRank(xp);
}

export async function getUserBadges(profileId: string) {
  await ensureSystemBadges();

  const userBadges = await prisma.userBadge.findMany({
    where: { profileId },
    include: { badge: true },
  });

  return userBadges
    .filter(ub => ub.badge.visible)
    .sort((a, b) => getBadgePriority(a.badge.slug) - getBadgePriority(b.badge.slug));
}

export async function getProfileStats(username: string) {
  const profile = await prisma.profile.findUnique({
    where: { username },
    select: {
      id: true,
      _count: { select: { wishlist: true, collection: true, votes: true } },
    },
  });
  if (!profile) return null;

  const [xp, contributions, badges] = await Promise.all([
    getProfileXP(profile.id),
    prisma.contribution.count({ where: { profileId: profile.id, status: 'APPROVED' } }),
    getUserBadges(profile.id),
  ]);

  return {
    xp,
    rank: getRank(xp),
    wishlistCount: profile._count.wishlist,
    collectionCount: profile._count.collection,
    voteCount: profile._count.votes,
    contributionCount: contributions,
    badges,
  };
}

export async function updateXP(profileId: string, amount: number, reason: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: 'not_authorized' };

  const xp = await ensureUserXP(profileId);
  const newTotal = Math.max(0, xp.xp + amount);

  await prisma.userXP.update({ where: { profileId }, data: { xp: newTotal } });
  await prisma.activityLog.create({
    data: { profileId, action: 'admin_xp_adjust', details: `${amount > 0 ? '+' : ''}${amount} XP - ${reason}` },
  });

  await syncRankBadge(profileId);

  return { ok: true, newTotal, rank: getRank(newTotal) };
}

export async function setXP(profileId: string, amount: number) {
  const admin = await requireAdmin();
  if (!admin) return { error: 'not_authorized' };

  await ensureUserXP(profileId);
  const newTotal = Math.max(0, amount);

  await prisma.userXP.update({ where: { profileId }, data: { xp: newTotal } });
  await prisma.activityLog.create({
    data: { profileId, action: 'admin_xp_set', details: `Set XP to ${newTotal}` },
  });

  await syncRankBadge(profileId);

  return { ok: true, newTotal, rank: getRank(newTotal) };
}

// ═══ CONTRIBUTIONS ═══

export async function createContribution(data: {
  type: ContributionType;
  title: string;
  description?: string;
  xpOverride?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'auth_required' };

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return { error: 'auth_required' };

  const contribution = await prisma.contribution.create({
    data: {
      profileId: profile.id,
      type: data.type,
      title: data.title,
      description: data.description || null,
      xpAwarded: data.xpOverride ?? XP_VALUES[data.type],
      status: 'PENDING',
    },
  });

  return { ok: true, contributionId: contribution.id };
}

export async function approveContribution(contributionId: string, xpOverride?: number) {
  const admin = await requireAdmin();
  if (!admin) return { error: 'not_authorized' };

  const contribution = await prisma.contribution.findUnique({ where: { id: contributionId } });
  if (!contribution) return { error: 'not_found' };

  const xpToAward = xpOverride ?? contribution.xpAwarded;

  await prisma.contribution.update({
    where: { id: contributionId },
    data: {
      status: 'APPROVED',
      approvedById: admin.id,
      approvedAt: new Date(),
      xpAwarded: xpToAward,
    },
  });

  const xp = await ensureUserXP(contribution.profileId);
  const newTotal = xp.xp + xpToAward;

  await prisma.userXP.update({ where: { profileId: contribution.profileId }, data: { xp: newTotal } });
  await prisma.activityLog.create({
    data: {
      profileId: contribution.profileId,
      action: 'contribution_approved',
      details: `Approved "${contribution.title}" +${xpToAward} XP`,
    },
  });

  await syncRankBadge(contribution.profileId);

  revalidatePath('/admin/community');
  revalidatePath('/admin/users');
  return { ok: true, newTotal, rank: getRank(newTotal) };
}

export async function rejectContribution(contributionId: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: 'not_authorized' };

  await prisma.contribution.update({
    where: { id: contributionId },
    data: { status: 'REJECTED', approvedById: admin.id, approvedAt: new Date() },
  });

  revalidatePath('/admin/community');
  return { ok: true };
}

export async function adminDirectContribution(data: {
  profileId: string;
  type: ContributionType;
  title: string;
  description?: string;
  xpAwarded: number;
}) {
  const admin = await requireAdmin();
  if (!admin) return { error: 'not_authorized' as const };

  await prisma.contribution.create({
    data: {
      profileId: data.profileId,
      type: data.type,
      title: data.title,
      description: data.description || null,
      xpAwarded: data.xpAwarded,
      status: 'APPROVED',
      approvedById: admin.id,
      approvedAt: new Date(),
    },
  });

  const xp = await ensureUserXP(data.profileId);
  const newTotal = xp.xp + data.xpAwarded;

  await prisma.userXP.update({ where: { profileId: data.profileId }, data: { xp: newTotal } });
  await prisma.activityLog.create({
    data: {
      profileId: data.profileId,
      action: 'contribution_approved',
      details: `Approved "${data.title}" +${data.xpAwarded} XP`,
    },
  });

  await syncRankBadge(data.profileId);

  revalidatePath('/admin/users');
  revalidatePath('/profile/[username]', 'page');
  return { ok: true, newTotal, rank: getRank(newTotal) };
}

export async function deleteContribution(contributionId: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: 'not_authorized' as const };

  const contribution = await prisma.contribution.findUnique({ where: { id: contributionId } });
  if (!contribution) return { error: 'not_found' as const };

  if (contribution.status === 'APPROVED' && contribution.xpAwarded > 0) {
    const xp = await ensureUserXP(contribution.profileId);
    const newTotal = Math.max(0, xp.xp - contribution.xpAwarded);
    await prisma.userXP.update({ where: { profileId: contribution.profileId }, data: { xp: newTotal } });
    await syncRankBadge(contribution.profileId);
  }

  await prisma.contribution.delete({ where: { id: contributionId } });

  revalidatePath('/admin/users');
  revalidatePath('/profile/[username]', 'page');
  return { ok: true };
}

export async function getPendingContributions() {
  const admin = await requireAdmin();
  if (!admin) return [];

  return prisma.contribution.findMany({
    where: { status: 'PENDING' },
    include: { profile: { select: { username: true, displayName: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

// ═══ BADGES ═══

export async function getBadges() {
  return prisma.badge.findMany({ orderBy: { sortOrder: 'asc' } });
}

export async function createBadge(data: {
  name: string;
  slug: string;
  type?: string;
  description?: string;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  icon?: string;
  visible?: boolean;
  sortOrder?: number;
  xpRequired?: number;
}) {
  const admin = await requireAdmin();
  if (!admin) return { error: 'not_authorized' };

  const existing = await prisma.badge.findUnique({ where: { slug: data.slug } });
  if (existing) return { error: 'slug_exists' };

  const badge = await prisma.badge.create({
    data: {
      name: data.name,
      slug: data.slug,
      type: data.type || 'community',
      description: data.description || null,
      bgColor: data.bgColor || '#FAFF00',
      textColor: data.textColor || '#111111',
      borderColor: data.borderColor || '#111111',
      icon: data.icon || null,
      visible: data.visible ?? true,
      sortOrder: data.sortOrder ?? 0,
      xpRequired: data.xpRequired ?? 0,
    },
  });

  revalidatePath('/admin/badges');
  return { ok: true, badgeId: badge.id };
}

export async function updateBadge(badgeId: string, data: {
  name?: string;
  description?: string | null;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  icon?: string | null;
  visible?: boolean;
  sortOrder?: number;
  xpRequired?: number;
}) {
  const admin = await requireAdmin();
  if (!admin) return { error: 'not_authorized' };

  await prisma.badge.update({ where: { id: badgeId }, data });
  revalidatePath('/admin/badges');
  return { ok: true };
}

export async function deleteBadge(badgeId: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: 'not_authorized' };

  await prisma.userBadge.deleteMany({ where: { badgeId } });
  await prisma.badge.delete({ where: { id: badgeId } });
  revalidatePath('/admin/badges');
  return { ok: true };
}

export async function assignBadge(profileId: string, badgeId: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: 'not_authorized' };

  const existing = await prisma.userBadge.findUnique({
    where: { profileId_badgeId: { profileId, badgeId } },
  });
  if (existing) return { error: 'already_assigned' };

  await prisma.userBadge.create({
    data: { profileId, badgeId, assignedById: admin.id },
  });

  await prisma.activityLog.create({
    data: { profileId, action: 'badge_assigned', details: `Badge assigned by ${admin.username}` },
  });

  revalidatePath('/admin/users');
  revalidatePath('/admin/badges');
  return { ok: true };
}

export async function removeBadgeFromUser(profileId: string, badgeId: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: 'not_authorized' };

  const badge = await prisma.badge.findUnique({ where: { id: badgeId } });
  if (!badge) return { error: 'not_found' };
  if (badge.type === 'rank' || badge.type === 'system') return { error: 'cannot_remove_system_badge' };

  await prisma.userBadge.deleteMany({ where: { profileId, badgeId } });
  await prisma.activityLog.create({
    data: { profileId, action: 'badge_removed', details: `Badge removed by ${admin.username}` },
  });

  revalidatePath('/admin/users');
  revalidatePath('/admin/badges');
  return { ok: true };
}

// ═══ BANS ═══

export async function suspendUser(profileId: string, reason: string, durationDays?: number) {
  const admin = await requireAdmin();
  if (!admin) return { error: 'not_authorized' };

  await prisma.banHistory.create({
    data: {
      profileId,
      adminId: admin.id,
      reason,
      type: 'suspend',
      status: 'ACTIVE',
      expiresAt: durationDays ? new Date(Date.now() + durationDays * 86400000) : null,
    },
  });

  await prisma.activityLog.create({
    data: { profileId, action: 'suspended', details: `Suspended by ${admin.username}: ${reason}` },
  });

  revalidatePath('/admin/users');
  revalidatePath('/profile/[username]', 'page');
  return { ok: true };
}

export async function banUser(profileId: string, reason: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: 'not_authorized' };

  await prisma.banHistory.create({
    data: { profileId, adminId: admin.id, reason, type: 'ban', status: 'ACTIVE' },
  });

  await prisma.activityLog.create({
    data: { profileId, action: 'banned', details: `Banned by ${admin.username}: ${reason}` },
  });

  revalidatePath('/admin/users');
  revalidatePath('/profile/[username]', 'page');
  return { ok: true };
}

export async function liftBan(banId: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: 'not_authorized' };

  await prisma.banHistory.update({
    where: { id: banId },
    data: { status: 'LIFTED', liftedAt: new Date() },
  });

  revalidatePath('/admin/users');
  return { ok: true };
}

export async function getActiveBan(profileId: string) {
  return prisma.banHistory.findFirst({
    where: { profileId, status: 'ACTIVE' },
    include: { admin: { select: { username: true } } },
  });
}

export async function getAllUsers() {
  const admin = await requireAdmin();
  if (!admin) return [];

  return prisma.profile.findMany({
    include: {
      userXp: true,
      _count: { select: { contributions: true, userBadges: true, votes: true, collection: true, wishlist: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserActivityLog(profileId: string, limit = 50) {
  const admin = await requireAdmin();
  if (!admin) return [];

  return prisma.activityLog.findMany({
    where: { profileId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

// ═══ BADGE BATCH ACTIONS ═══

export async function reorderBadges(orderedIds: string[]) {
  const admin = await requireAdmin();
  if (!admin) return { error: 'not_authorized' as const };

  await prisma.$transaction(
    orderedIds.map((id, i) => prisma.badge.update({ where: { id }, data: { sortOrder: i } }))
  );

  revalidatePath('/admin/badges');
  return { ok: true };
}

export async function bulkDeleteBadges(ids: string[]) {
  const admin = await requireAdmin();
  if (!admin) return { error: 'not_authorized' as const };

  await prisma.userBadge.deleteMany({ where: { badgeId: { in: ids } } });
  await prisma.badge.deleteMany({ where: { id: { in: ids } } });

  revalidatePath('/admin/badges');
  return { ok: true };
}

export async function duplicateBadge(badgeId: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: 'not_authorized' as const };

  const source = await prisma.badge.findUnique({ where: { id: badgeId } });
  if (!source) return { error: 'not_found' as const };

  const badge = await prisma.badge.create({
    data: {
      name: `${source.name} (Copy)`,
      slug: `${source.slug}-copy-${Date.now()}`,
      description: source.description,
      bgColor: source.bgColor,
      textColor: source.textColor,
      borderColor: source.borderColor,
      icon: source.icon,
      visible: source.visible,
      sortOrder: source.sortOrder + 1,
      type: source.type,
    },
  });

  revalidatePath('/admin/badges');
  return { ok: true, badgeId: badge.id };
}
