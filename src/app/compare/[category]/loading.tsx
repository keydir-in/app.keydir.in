/**
 * Loading state for the compare page. Shows a skeleton layout matching
 * the comparison table and product cards.
 */

import { ComparePageSkeleton } from '@/components/skeleton';

export default function CompareLoading() {
  return (
    <main className="page-body">
      <ComparePageSkeleton />
    </main>
  );
}
