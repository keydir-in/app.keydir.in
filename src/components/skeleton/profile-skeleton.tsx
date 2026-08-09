/**
 * Profile page loading skeleton. Mirrors the final profile page structure
 * 1:1 — hero (square avatar, name + actions, handle, badges, meta, socials),
 * stats row, tab bar, and collection grid — so there is no layout shift
 * when the real data loads.
 */

import { Skeleton, SkeletonRectangle } from './primitives';
import { ProductCardSkeleton } from './product-card-skeleton';

export function ProfileHeaderSkeleton() {
  return (
    <div className="profile-hero" aria-hidden="true">
      <div className="profile-hero-left">
        <Skeleton className="skeleton-rectangle" style={{ width: 180, height: 180 }} />
      </div>
      <div className="profile-hero-right">
        <div className="profile-hero-top">
          <SkeletonRectangle width={240} height={38} />
          <div className="profile-hero-actions">
            <Skeleton className="skeleton-button" style={{ width: 110, height: 28 }} />
            <Skeleton className="skeleton-button" style={{ width: 78, height: 28 }} />
          </div>
        </div>
        <div className="profile-hero-handle">
          <SkeletonRectangle width={150} height={14} />
        </div>
        <div className="profile-hero-badges">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="skeleton-badge" style={{ width: 76, height: 28 }} />
          ))}
        </div>
        <div className="profile-hero-meta">
          <SkeletonRectangle width={220} height={14} />
        </div>
        <div className="profile-hero-socials">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="skeleton-rectangle" style={{ width: 36, height: 36 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="profile-stats-row" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="profile-stat-box">
          <Skeleton style={{ width: 64, height: 30, margin: '0 auto 8px' }} />
          <Skeleton style={{ width: 48, height: 12, margin: '0 auto' }} />
        </div>
      ))}
    </div>
  );
}

export function ProfileGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="profile-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} variant="profile" />
      ))}
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="profile-page">
      <div className="profile-container">
        <ProfileHeaderSkeleton />
        <StatsSkeleton />
        <div className="profile-tabs" aria-hidden="true">
          <div className="profile-tab-bar">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} style={{ height: 48, flex: 1 }} />
            ))}
          </div>
          <div className="profile-tab-content">
            <ProfileGridSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
