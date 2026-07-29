/**
 * Catalog page skeleton grid wrapper. Renders a 12-card ProductGridSkeleton
 * inside the standard catalog page layout during initial data loading.
 */

import { ProductGridSkeleton } from '@/components/skeleton';

export function CatalogSkeletonGrid() {
  return (
    <div className="catalog-page pt-28">
      <ProductGridSkeleton count={12} />
    </div>
  );
}
