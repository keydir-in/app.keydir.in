/**
 * Shared cache tags + invalidation helpers for the Next.js data cache.
 * unstable_cache stores each entry under tags chosen at wrapper-construction
 * time, so per-item invalidation is achieved by giving each slug its own
 * wrapper instance (memoized by perSlugCache) carrying its own tag.
 */
import { revalidateTag, unstable_cache } from 'next/cache';

export const CACHE = {
  /** Per-product tag, e.g. `product:akko-5075b-plus`. Invalidated on price/spec/image changes. */
  product: (slug: string) => `product:${slug}`,
  /** Per-product sound-test list tag. */
  soundTests: (slug: string) => `sound-test:${slug}`,
  /** Global "active switches" picker list. */
  switchOptions: 'switch-options',
  /** Category filter data (brands/vendors/specs/price range). */
  filters: 'filters',
  /** Coarse tag attached to every product detail entry. Routine vendor/coupon
   * mutations invalidate the affected products precisely (per slug); this tag
   * is the escape hatch for global data fixes. */
  productDetailAll: 'product-detail',
};

/**
 * Hard-expire data-cache entries by tag. `{ expire: 0 }` is the non-deprecated
 * immediate-expiration form of revalidateTag for route handlers and server
 * actions. Scripts (run-cron.mjs, check-variants.ts) run outside the Next
 * runtime where revalidateTag throws, so they are skipped.
 */
export function invalidateTags(...tags: string[]) {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
}

/**
 * Memoized per-slug unstable_cache wrapper. unstable_cache tags are fixed at
 * construction, so one wrapper per slug lets each cached entry carry its own
 * invalidation tag while reusing a single callback. `extraTags` are attached
 * to every entry (e.g. the coarse `product-detail` tag) so global
 * invalidations stay possible without giving up precise per-slug ones.
 * The wrapper map is bounded by the product catalog size and additionally
 * capped: evicting a wrapper is safe because the data cache and its tags
 * live in the Next.js Data Cache, not here.
 */
const WRAPPER_CACHE_LIMIT = 1024;

export function perSlugCache<A extends unknown[], T>(
  keyPrefix: string,
  revalidate: number,
  tagFor: (slug: string) => string,
  cb: (slug: string, ...args: A) => Promise<T>,
  extraTags: string[] = [],
): (slug: string, ...args: A) => Promise<T> {
  const wrappers = new Map<string, (slug: string, ...args: A) => Promise<T>>();
  return (slug, ...args) => {
    const cacheKey = `${keyPrefix}:${slug}`;
    let wrapped = wrappers.get(cacheKey);
    if (!wrapped) {
      wrapped = unstable_cache(cb, [keyPrefix, slug], {
        revalidate,
        tags: [tagFor(slug), ...extraTags],
      });
      wrappers.set(cacheKey, wrapped);
      if (wrappers.size > WRAPPER_CACHE_LIMIT) {
        const oldest = wrappers.keys().next().value;
        if (oldest !== undefined) wrappers.delete(oldest);
      }
    }
    return wrapped(slug, ...args);
  };
}
