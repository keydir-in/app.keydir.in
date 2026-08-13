/**
 * Cached fetchers for the homepage's data-driven sections (Price Drops,
 * Lowest Prices). Same hybrid pattern as catalog-listings.ts:
 *
 * - Outer Cache Components scope (`"use cache"`) applies the `catalog`
 *   cacheLife profile and the shared `catalog-listings` tag.
 * - Inner unstable_cache wrapper holds the durable Data Cache entry.
 *
 * The homepage wraps these sections in `<Suspense>`, which under
 * `cacheComponents` excludes the subtree from the parent's cached scope, so
 * without this wrapper the (heavy) queries would re-run on every page view.
 */
import { unstable_cache, cacheLife, cacheTag } from 'next/cache';
import { fetchLowestPrices, fetchPriceDrops } from '@/lib/services/product-service';
import { CATALOG_LISTINGS_TAG } from '@/lib/services/catalog-listings';
import type { ProductCard } from '@/types';

const rawPriceDrops = unstable_cache(
  (take: number) => fetchPriceDrops(take),
  ['home-price-drops'],
  { revalidate: 300, tags: [CATALOG_LISTINGS_TAG] },
);

export async function cachedPriceDrops(take = 12): Promise<ProductCard[]> {
  'use cache';
  cacheLife('catalog');
  cacheTag(CATALOG_LISTINGS_TAG);
  return rawPriceDrops(take);
}

const rawLowestPrices = unstable_cache(
  () => fetchLowestPrices(),
  ['home-lowest-prices'],
  { revalidate: 300, tags: [CATALOG_LISTINGS_TAG] },
);

export async function cachedLowestPrices(): Promise<ProductCard[]> {
  'use cache';
  cacheLife('catalog');
  cacheTag(CATALOG_LISTINGS_TAG);
  return rawLowestPrices();
}