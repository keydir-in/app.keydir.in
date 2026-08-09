/**
 * Full product page loading skeleton that mirrors the complete page
 * layout: hero image, price block, specs, community section, stat cards,
 * spec groups, and vendor cards.
 */

import { Skeleton, SkeletonText, SkeletonRectangle, SkeletonBadge, SkeletonButton } from './primitives';

export function ProductPageSkeleton() {
  return (
    <div className="product-page" aria-hidden="true">
      <SkeletonRectangle width={200} height={12} className="mb-8" />
      
      <div className="product-hero">
        <div className="product-hero-image">
          <Skeleton className="skeleton-img product-hero-image-card" style={{ aspectRatio: '4/3' }} />
        </div>
        <div className="product-hero-info">
          <SkeletonRectangle width="60%" height={32} className="mb-3" />
          <div className="product-hero-price-block mb-3">
            <SkeletonRectangle width={120} height={10} className="mb-1" />
            <SkeletonRectangle width={180} height={36} />
          </div>
          <div className="product-hero-specs">
            {/* heroFields has exactly 4 per category; ProductHeroSpecs filters
                empty ones so the real count is 0–4. 4 matches the common case. */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="product-hero-spec-row">
                <SkeletonRectangle width={120} height={12} />
                <SkeletonRectangle width={100} height={12} />
              </div>
            ))}
          </div>
          <div className="product-hero-overview">
            <SkeletonRectangle width={120} height={10} className="mb-2" />
            <SkeletonText lines={3} />
          </div>
          <div className="product-hero-community mt-4">
            <SkeletonRectangle width={120} height={10} className="mb-3" />
            <div className="product-hero-vote-cards">
              <Skeleton className="skeleton-card" style={{ height: 80 }} />
              <Skeleton className="skeleton-card" style={{ height: 80 }} />
            </div>
          </div>
        </div>
      </div>

      <div className="product-hero-stats mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="product-stat-card">
            <SkeletonRectangle width={80} height={10} className="mb-2" />
            <SkeletonRectangle width={100} height={24} />
          </div>
        ))}
      </div>

      <div className="spec-groups">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="spec-module">
            <div className="spec-module-head">
              <SkeletonRectangle width={120} height={12} />
            </div>
            <div className="spec-module-body">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="spec-row">
                  <SkeletonRectangle width={120} height={12} />
                  <SkeletonRectangle width={100} height={12} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="vendor-cards mt-8">
        <SkeletonRectangle width={150} height={16} className="mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="vendor-row">
            <div className="vendor-row-grid">
              <div className="vendor-row-logo">
                <SkeletonRectangle width={72} height={72} />
              </div>
              <div className="vendor-row-info">
                <SkeletonRectangle width={140} height={16} />
                <SkeletonRectangle width={110} height={10} />
                <SkeletonRectangle width={90} height={22} />
              </div>
              <div className="vendor-row-price-block">
                <SkeletonRectangle width={110} height={20} />
                <SkeletonBadge />
              </div>
              <div className="vendor-row-actions">
                <SkeletonRectangle width={60} height={10} />
                <SkeletonButton />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
