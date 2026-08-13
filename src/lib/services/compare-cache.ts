/**
 * Cached compare-page product fetcher. Same hybrid as catalog-listings.ts:
 * an outer Cache Components scope (`"use cache"` + `catalog` cacheLife +
 * `catalog-listings` tag) over a durable unstable_cache entry keyed by the
 * slug set + category. The page was the one uncached data path left; user
 * votes/collections are still fetched live per request and never enter this
 * cache.
 */
import { unstable_cache, cacheLife, cacheTag } from 'next/cache';
import { findProductsForCompare } from '@/lib/repositories/product-repository';
import { CATALOG_LISTINGS_TAG } from '@/lib/services/catalog-listings';

const rawCompareProducts = unstable_cache(
  (slugs: string[], productType: string) => findProductsForCompare(slugs, productType),
  ['compare-products'],
  { revalidate: 60, tags: [CATALOG_LISTINGS_TAG] },
);

export async function cachedCompareProducts(slugs: string[], productType: string) {
  'use cache';
  cacheLife('catalog');
  cacheTag(CATALOG_LISTINGS_TAG);
  return rawCompareProducts(slugs, productType);
}