/**
 * Product card loading skeleton placeholder. Provides listing and
 * profile variants with image, text, and metadata shimmer elements.
 * Also exports ProductGridSkeleton for rendering multiple card skeletons.
 */

import { Skeleton, SkeletonRectangle } from './primitives';

export function ProductCardSkeleton({ variant = 'listing' }: { variant?: 'listing' | 'profile' }) {
  if (variant === 'profile') {
    return (
      <div className="profile-product-card" aria-hidden="true">
        <div className="profile-product-link">
          <Skeleton className="skeleton-img profile-product-img" />
          <div className="profile-product-info">
            <SkeletonRectangle width={60} height={10} className="mb-1" />
            <SkeletonRectangle width="80%" height={14} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-card skeleton-card" aria-hidden="true">
      <div className="product-card-img-wrap">
        <Skeleton className="skeleton-img product-card-img" />
      </div>
      <div className="product-card-body">
        <SkeletonRectangle width="70%" height={16} className="mb-2" />
        <div className="product-card-meta">
          <SkeletonRectangle width={80} height={14} />
          <SkeletonRectangle width={40} height={12} />
        </div>
        <SkeletonRectangle width="50%" height={12} className="mt-2" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="catalog-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
