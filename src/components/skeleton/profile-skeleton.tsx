/**
 * Profile page loading skeleton. Renders avatar, display name, badges,
 * stats row, bio text, tab bar, and a grid of product card placeholders
 * matching the profile page layout.
 */

import { Skeleton, SkeletonText, SkeletonRectangle, SkeletonCircle } from './primitives';

export function ProfilePageSkeleton() {
  return (
    <div className="profile-page" aria-hidden="true">
      <div className="profile-hero">
        <div className="profile-hero-left">
          <SkeletonCircle size={120} />
        </div>
        <div className="profile-hero-right">
          <SkeletonRectangle width={200} height={28} className="mb-2" />
          <SkeletonRectangle width={120} height={14} className="mb-3" />
          <div className="flex gap-2 mb-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="skeleton-badge" style={{ width: 60, height: 24 }} />
            ))}
          </div>
          <div className="profile-stats-row">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="profile-stat-box">
                <SkeletonRectangle width={60} height={24} className="mb-1" />
                <SkeletonRectangle width={40} height={10} />
              </div>
            ))}
          </div>
          <SkeletonText lines={2} className="mt-3" />
        </div>
      </div>

      <div className="profile-tabs">
        <div className="profile-tab-bar">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="skeleton-rectangle" style={{ width: 100, height: 36 }} />
          ))}
        </div>
        <div className="profile-tab-content">
          <div className="profile-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="profile-product-card">
                <Skeleton className="skeleton-img profile-product-img" />
                <div className="profile-product-info">
                  <SkeletonRectangle width={60} height={10} className="mb-1" />
                  <SkeletonRectangle width="80%" height={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
