/**
 * Price history chart loading skeleton. Renders shimmers for the time
 * range selector bar, the main chart area, and the vendor legend below.
 */

import { Skeleton, SkeletonRectangle } from './primitives';

export function PriceHistoryChartSkeleton() {
  return (
    <div className="price-chart-container" aria-hidden="true">
      <div className="price-chart-range-bar">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="skeleton-rectangle" style={{ flex: 1, height: 40 }} />
        ))}
      </div>
      <div className="price-chart-wrap">
        <Skeleton className="skeleton-rectangle" style={{ width: '100%', height: 320 }} />
      </div>
      <div className="price-chart-legend">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="price-chart-legend-item">
            <SkeletonRectangle width={12} height={3} />
            <SkeletonRectangle width={60} height={10} />
          </div>
        ))}
      </div>
    </div>
  );
}
