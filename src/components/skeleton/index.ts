/**
 * Barrel export for all skeleton loading-state components. Re-exports
 * primitives and page-level skeletons (product, compare, hero, profile,
 * and admin editor).
 */

export { Skeleton, SkeletonText, SkeletonCircle, SkeletonRectangle, SkeletonBadge, SkeletonButton } from './primitives';
export { ProductCardSkeleton, ProductGridSkeleton } from './product-card-skeleton';
export { ProductPageSkeleton } from './product-page-skeleton';
export { ComparePageSkeleton } from './compare-page-skeleton';
export { HeroBannerSkeleton, HeroContentSkeleton } from './hero-skeleton';
export { ProfilePageSkeleton, ProfileHeaderSkeleton, StatsSkeleton, ProfileGridSkeleton } from './profile-skeleton';
