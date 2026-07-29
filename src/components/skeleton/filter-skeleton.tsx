/**
 * Filter panel loading skeleton that mirrors the price range slider,
 * availability chip columns, selected filters area, and action buttons
 * of the catalog filter panel.
 */

import { Skeleton, SkeletonRectangle } from './primitives';

export function FilterPanelSkeleton() {
  return (
    <div className="kb-explorer-wrap" aria-hidden="true">
      <div className="kb-explorer">
        <div className="kb-explorer-header">
          <SkeletonRectangle width={60} height={14} />
        </div>
        <div className="kb-explorer-options">
          <div className="kb-filter-columns">
            <div className="kb-explorer-group">
              <div className="kb-explorer-group-label">
                <SkeletonRectangle width={80} height={10} />
              </div>
              <div className="kb-price-display">
                <SkeletonRectangle width={80} height={14} />
                <SkeletonRectangle width={20} height={14} />
                <SkeletonRectangle width={80} height={14} />
              </div>
              <Skeleton className="skeleton-rectangle" style={{ width: '100%', height: 8, marginTop: 8 }} />
              <div className="kb-price-inputs flex gap-2 mt-2">
                <SkeletonRectangle width={100} height={32} />
                <SkeletonRectangle width={100} height={32} />
              </div>
            </div>
            <div className="kb-explorer-group">
              <div className="kb-explorer-group-label">
                <SkeletonRectangle width={80} height={10} />
              </div>
              <div className="kb-explorer-chips-col">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="skeleton-chip" style={{ width: '100%', height: 32, marginBottom: 4 }} />
                ))}
              </div>
            </div>
          </div>
          <div className="kb-filter-selected">
            <SkeletonRectangle width={60} height={10} className="mb-2" />
            <SkeletonRectangle width={100} height={24} />
          </div>
          <div className="kb-filter-actions flex gap-2">
            <SkeletonRectangle width={80} height={36} />
            <SkeletonRectangle width={80} height={36} />
          </div>
        </div>
      </div>
    </div>
  );
}
