/**
 * Loading state for catalog pages. Shows a 12-item product grid skeleton
 * with placeholder cards matching the catalog layout.
 */

import { HeroBannerSkeleton, ProductGridSkeleton } from '@/components/skeleton';

export default function CategoryLoading() {
  return (
    <div className="catalog-layout">
      <HeroBannerSkeleton />
      <main className="catalog-page pt-28">
        <ProductGridSkeleton count={25} />
      </main>
    </div>
  );
}
