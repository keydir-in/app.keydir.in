/**
 * Gamification and reputation system: XP rank ladder (Newbie → Elite),
 * badge priorities, per-contribution-type XP values, and getRank().
 */
import type { ContributionType } from '@prisma/client';

const RANKS = [
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

// ═══ BADGE PRIORITY ═══
// 1 = Community Member (system, auto)
// 2 = Rank badge (rank, auto)
// 3 = System badges (admin, mod)
// 4 = Vendor/Builder/Brand
// 5 = Custom

const BADGE_PRIORITY: Record<string, number> = {
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
