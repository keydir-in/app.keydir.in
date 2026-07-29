/**
 * Compare page loading skeleton that recreates the comparison matrix
 * layout: header row, product image cards, section labels, and
 * attribute rows across multiple product columns.
 */

import { Skeleton, SkeletonRectangle } from './primitives';

export function ComparePageSkeleton() {
  return (
    <div className="compare-page" aria-hidden="true">
      <div className="product-breadcrumb">
        <SkeletonRectangle width={100} height={10} />
      </div>

      <div className="compare-header mb-4">
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="skeleton-badge" style={{ width: 80, height: 32 }} />
          ))}
        </div>
      </div>

      <div className="cmp-content">
        <div className="cmp-scroll-wrap">
          <div className="cmp-matrix" style={{ gridTemplateColumns: '160px repeat(3, 1fr)' }}>
            <div className="cmp-header-row" style={{ gridColumn: '1 / -1' }}>
              <div className="cmp-matrix-row" style={{ gridTemplateColumns: '160px repeat(3, 1fr)' }}>
                <div className="cmp-header-label">
                  <SkeletonRectangle width={60} height={12} />
                </div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="cmp-header-product">
                    <SkeletonRectangle width="80%" height={14} />
                  </div>
                ))}
              </div>
            </div>

            <div className="cmp-card-row" style={{ gridColumn: '1 / -1' }}>
              <div className="cmp-matrix-row" style={{ gridTemplateColumns: '160px repeat(3, 1fr)' }}>
                <div className="cmp-label-cell">
                  <SkeletonRectangle width={80} height={12} />
                </div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="cmp-card">
                    <Skeleton className="skeleton-img" style={{ aspectRatio: '4/3', marginBottom: 12 }} />
                    <SkeletonRectangle width="70%" height={14} className="mb-2" />
                    <SkeletonRectangle width="50%" height={12} />
                  </div>
                ))}
              </div>
            </div>

            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="cmp-section" style={{ gridColumn: '1 / -1' }}>
                <SkeletonRectangle width={100} height={12} />
              </div>
            ))}

            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="cmp-row" style={{ gridColumn: '1 / -1', gridTemplateColumns: '160px repeat(3, 1fr)' }}>
                <div className="cmp-row-label">
                  <SkeletonRectangle width={100} height={12} />
                </div>
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="cmp-cell">
                    <SkeletonRectangle width="70%" height={12} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
