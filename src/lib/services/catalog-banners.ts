/**
 * Banner queries for public pages, shared by the home page, category pages,
 * and compare pages. `queryBannersForLocation` computes a "today" window from
 * `new Date()` for scheduled start/end dates, so the public read is wrapped in
 * the same two-layer hybrid as catalog-listings: an outer Cache Components
 * scope ("use cache" + catalog cacheLife + the shared `banners` tag) makes the
 * time-sensitive computation legal during prerendering and caches it, and the
 * inner unstable_cache keeps a durable cross-request Data Cache entry.
 *
 * Admin banner CRUD invalidates the `banners` tag so edits publish immediately
 * instead of waiting out the time-based TTL.
 */
import { cacheLife, cacheTag, unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export const BANNERS_TAG = 'banners';

export async function queryBannersForLocation(location: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return prisma.banner.findMany({
    where: {
      status: 'active',
      displayRule: { not: 'mobile' },
      locations: { some: { location } },
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: todayStart } }] }],
    },
    orderBy: { priority: 'asc' },
    select: {
      id: true,
      title: true,
      desktopImage: true,
      mobileImage: true,
      linkUrl: true,
      linkType: true,
      openNewTab: true,
      bannerType: true,
      displayRule: true,
    },
  });
}

const rawBanners = unstable_cache(
  (location: string) => queryBannersForLocation(location),
  ['banners'],
  { revalidate: 300, tags: [BANNERS_TAG] },
);

export async function cachedBannersForLocation(location: string) {
  'use cache';
  cacheLife('catalog');
  cacheTag(BANNERS_TAG);
  return rawBanners(location);
}