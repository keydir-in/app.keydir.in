/**
 * Cached product listing fetcher, shared by the catalog page (server-rendered
 * initial grid) and the NDJSON API route. Two cooperating layers:
 *
 * - The outer Cache Components scope (`"use cache"`) applies the `catalog`
 *   cacheLife profile and the shared `catalog-listings` tag. The profile's
 *   stale time is published to the browser via `x-nextjs-stale-time`, so the
 *   client router cache treats repeat category visits as fresh for the same
 *   window. The tag keeps on-demand revalidation working against this layer.
 *
 * - The inner unstable_cache wrapper keeps the durable cross-request Data
 *   Cache entry that actually deduplicates DB work. The default `"use cache"`
 *   handler is per-instance in-memory — on serverless it would otherwise
 *   re-run the query on every request that lands on a cold instance.
 *
 * Both layers share the same tag, so one revalidateTag call from the
 * revalidation endpoint evicts the entry from both caches.
 */
import { unstable_cache, cacheLife, cacheTag } from 'next/cache';
import { fetchProductListings } from '@/lib/services/product-service';
import { prisma } from '@/lib/prisma';
import type { SpecFilterConfig } from '@/lib/services/spec-filter-builder';

export const CACHE_SECONDS = 60;

// Revalidate endpoint evicts every category listing on scraped updates via
// this tag, so stale grids never outlive a data write even if path
// revalidation misses the cached entry.
export const CATALOG_LISTINGS_TAG = 'catalog-listings';

const rawListings = unstable_cache(
  (productType: string, qs: string, specConfig: SpecFilterConfig) =>
    fetchProductListings(productType, new URLSearchParams(qs), specConfig, {
      includeUserVotes: false,
    }),
  ['catalog-listings'],
  { revalidate: CACHE_SECONDS, tags: [CATALOG_LISTINGS_TAG] },
);

export async function cachedListings(
  productType: string,
  qs: string,
  specConfig: SpecFilterConfig,
) {
  'use cache';
  cacheLife('catalog');
  cacheTag(CATALOG_LISTINGS_TAG);
  return rawListings(productType, qs, specConfig);
}

const rawActiveProductCount = unstable_cache(
  (productType: string) =>
    prisma.product.count({ where: { productType, status: 'active' } }),
  ['active-product-count'],
  { revalidate: CACHE_SECONDS, tags: [CATALOG_LISTINGS_TAG] },
);

export async function cachedActiveProductCount(productType: string): Promise<number> {
  'use cache';
  cacheLife('catalog');
  cacheTag(CATALOG_LISTINGS_TAG);
  return rawActiveProductCount(productType);
}