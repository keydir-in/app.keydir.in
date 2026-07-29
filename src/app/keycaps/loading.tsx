/**
 * Loading state for the keycaps catalog. Shows a 12-item product grid
 * skeleton with placeholder cards matching the catalog layout.
 */

import { ProductGridSkeleton } from '@/components/skeleton';

export default function KeycapsLoading() {
  return (
    <main className="catalog-page pt-28">
      <ProductGridSkeleton count={12} />
    </main>
  );
}
