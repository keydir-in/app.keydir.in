/**
 * Hero section loading skeletons. HeroBannerSkeleton renders a full-width
 * image shimmer, while HeroContentSkeleton mimics the text, buttons, and
 * card layout of the homepage hero.
 */

import { Skeleton, SkeletonRectangle } from './primitives';

export function HeroBannerSkeleton() {
  return (
    <div className="hero-banner" aria-hidden="true">
      <Skeleton className="skeleton-img" style={{ width: '100%', height: '100%' }} />
      <div className="hero-banner-overlay" />
    </div>
  );
}

export function HeroContentSkeleton() {
  return (
    <div className="hero-grid" aria-hidden="true">
      <div className="hero-left">
        <SkeletonRectangle width={120} height={28} className="mb-4" />
        <SkeletonRectangle width="90%" height={48} className="mb-2" />
        <SkeletonRectangle width="70%" height={48} className="mb-4" />
        <SkeletonRectangle width="60%" height={16} className="mb-2" />
        <SkeletonRectangle width="80%" height={16} className="mb-6" />
        <div className="flex gap-3">
          <SkeletonRectangle width={120} height={44} />
          <SkeletonRectangle width={120} height={44} />
        </div>
      </div>
      <div className="hero-right">
        <Skeleton className="skeleton-card" style={{ width: 340, height: 280 }} />
      </div>
    </div>
  );
}
