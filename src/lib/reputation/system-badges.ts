/**
 * System badge seed data — shared by prisma/seed.ts (deploy-time seeding)
 * and reputation/actions.ts (runtime safety net). Pure data, no deps.
 */

export const SYSTEM_BADGES = [
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
