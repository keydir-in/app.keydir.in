/**
 * Search bar and dropdown loading skeletons. SearchBarSkeleton renders
 * the input field shimmer, while SearchDropdownSkeleton shows grouped
 * product and vendor result placeholders.
 */

import { SkeletonRectangle } from './primitives';

export function SearchBarSkeleton() {
  return (
    <div className="nav-search-wrap" aria-hidden="true">
      <SkeletonRectangle width={380} height={34} />
    </div>
  );
}

export function SearchDropdownSkeleton() {
  return (
    <div className="nav-search-dropdown" aria-hidden="true">
      <div className="nav-search-group">
        <div className="nav-search-group-label">PRODUCTS</div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="nav-search-item">
            <SkeletonRectangle width={28} height={28} />
            <div className="nav-search-item-text">
              <SkeletonRectangle width={120} height={12} className="mb-1" />
              <SkeletonRectangle width={60} height={10} />
            </div>
          </div>
        ))}
      </div>
      <div className="nav-search-group">
        <div className="nav-search-group-label">VENDORS</div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="nav-search-item">
            <div className="nav-search-item-text">
              <SkeletonRectangle width={100} height={12} className="mb-1" />
              <SkeletonRectangle width={50} height={10} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
