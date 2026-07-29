/**
 * Gamification and reputation system: XP rank ladder (Newbie → Elite),
 * badge definitions and priorities, per-contribution-type XP values,
 * and helper functions getRank(), getNextRank(), getBadgePriority().
 */
import type { ContributionType } from '@prisma/client';

export const RANKS = [
  { name: 'Newbie', min: 0, max: 49 },
  { name: 'Member', min: 50, max: 149 },
  { name: 'Enthusiast', min: 150, max: 399 },
  { name: 'Contributor', min: 400, max: 799 },
  { name: 'Trusted Contributor', min: 800, max: 1499 },
  { name: 'Expert', min: 1500, max: 2999 },
  { name: 'Veteran', min: 3000, max: 5999 },
  { name: 'Elite', min: 6000, max: Infinity },
] as const;

export type RankName = (typeof RANKS)[number]['name'];

export function getRank(xp: number): RankName {
  for (const rank of RANKS) {
    if (xp <= rank.max) return rank.name;
  }
  return 'Elite';
}

export function getNextRank(xp: number): { name: RankName; xpNeeded: number } | null {
  for (const rank of RANKS) {
    if (xp < rank.min) return { name: rank.name, xpNeeded: rank.min - xp };
    if (xp <= rank.max) {
      const nextIdx = RANKS.indexOf(rank) + 1;
      if (nextIdx < RANKS.length) return { name: RANKS[nextIdx].name, xpNeeded: RANKS[nextIdx].min - xp };
      return null;
    }
  }
  return null;
}

// ═══ BADGE HELPERS ═══

export const RANK_SLUGS: Record<RankName, string> = {
  'Newbie': 'rank-newbie',
  'Member': 'rank-member',
  'Enthusiast': 'rank-enthusiast',
  'Contributor': 'rank-contributor',
  'Trusted Contributor': 'rank-trusted-contributor',
  'Expert': 'rank-expert',
  'Veteran': 'rank-veteran',
  'Elite': 'rank-elite',
};

export const RANK_BADGE_DEFAULTS: Record<RankName, { bgColor: string; textColor: string; borderColor: string; icon: string }> = {
  'Newbie':            { bgColor: '#FAFF00', textColor: '#111111', borderColor: '#111111', icon: '' },
  'Member':            { bgColor: '#FAFF00', textColor: '#111111', borderColor: '#111111', icon: '' },
  'Enthusiast':        { bgColor: '#FAFF00', textColor: '#111111', borderColor: '#111111', icon: '' },
  'Contributor':       { bgColor: '#FAFF00', textColor: '#111111', borderColor: '#111111', icon: '' },
  'Trusted Contributor': { bgColor: '#FAFF00', textColor: '#111111', borderColor: '#111111', icon: '' },
  'Expert':            { bgColor: '#FAFF00', textColor: '#111111', borderColor: '#111111', icon: '' },
  'Veteran':           { bgColor: '#FAFF00', textColor: '#111111', borderColor: '#111111', icon: '' },
  'Elite':             { bgColor: '#FAFF00', textColor: '#111111', borderColor: '#111111', icon: '' },
};

// ═══ BADGE PRIORITY ═══
// 1 = Community Member (system, auto)
// 2 = Rank badge (rank, auto)
// 3 = System badges (admin, mod)
// 4 = Vendor/Builder/Brand
// 5 = Custom

export const BADGE_PRIORITY: Record<string, number> = {
  'community-member': 1,
  // rank badges: 2 (handled dynamically)
  'admin': 3,
  'moderator': 3,
  'vendor': 4,
  'builder': 4,
  'brand': 4,
};

export function getBadgePriority(slug: string): number {
  if (slug.startsWith('rank-')) return 2;
  return BADGE_PRIORITY[slug] ?? 5;
}

export const XP_VALUES: Record<ContributionType, number> = {
  ADD_PRODUCT: 5,
  UPDATE_PRICE: 2,
  EDIT_SPECS: 3,
  REPORT_VENDOR: 2,
  UPLOAD_IMAGES: 2,
  FIX_PRODUCT_INFO: 3,
  ADD_VENDOR: 3,
  ADD_BRAND: 3,
  DOCUMENTATION: 2,
  BUG_FIX: 5,
  FEATURE_DEV: 10,
  DB_CLEANUP: 2,
  OTHER: 1,
};

export const CONTRIBUTION_TYPE_LABELS: Record<ContributionType, string> = {
  ADD_PRODUCT: 'Product Added',
  UPDATE_PRICE: 'Price Update',
  EDIT_SPECS: 'Specification Fix',
  REPORT_VENDOR: 'Vendor Reported',
  UPLOAD_IMAGES: 'Image Added',
  FIX_PRODUCT_INFO: 'Product Info Fix',
  ADD_VENDOR: 'Vendor Added',
  ADD_BRAND: 'Brand Added',
  DOCUMENTATION: 'Documentation',
  BUG_FIX: 'Bug Fix',
  FEATURE_DEV: 'Feature Development',
  DB_CLEANUP: 'Database Cleanup',
  OTHER: 'Other',
};

export const CONTRIBUTION_TYPE_ICONS: Record<ContributionType, string> = {
  ADD_PRODUCT: '📦',
  UPDATE_PRICE: '💰',
  EDIT_SPECS: '✏️',
  REPORT_VENDOR: '🚨',
  UPLOAD_IMAGES: '📸',
  FIX_PRODUCT_INFO: '🔧',
  ADD_VENDOR: '🏪',
  ADD_BRAND: '🏷️',
  DOCUMENTATION: '📄',
  BUG_FIX: '🐛',
  FEATURE_DEV: '⚡',
  DB_CLEANUP: '🗄️',
  OTHER: '📋',
};
