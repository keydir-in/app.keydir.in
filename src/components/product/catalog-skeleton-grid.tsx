/**
 * Catalog page skeleton grid wrapper. Renders the toolbar + a 12-card
 * ProductGridSkeleton inside the standard catalog page layout during initial
 * data loading, so the real toolbar/grid don't pop in and shift the layout.
 */

import { ProductGridSkeleton, SkeletonRectangle } from '@/components/skeleton';

export function CatalogSkeletonGrid() {
  return (
    <div className="catalog-page pt-28">
      <div className="catalog-toolbar">
        <SkeletonRectangle width={180} height={14} />
        <div className="catalog-controls">
          <SkeletonRectangle width={120} height={48} />
          <SkeletonRectangle width={160} height={48} />
        </div>
      </div>
      <ProductGridSkeleton count={12} />
    </div>
  );
}
