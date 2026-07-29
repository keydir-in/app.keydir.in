/**
 * Keyboards catalog page. Renders a Suspense boundary with a skeleton grid
 * fallback while the server-fetched KeyboardsContent component loads.
 * Data fetching (filtering, sorting, pagination) is handled in the content child.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import KeyboardsContent from './content';
import { CatalogSkeletonGrid } from '@/components/product/catalog-skeleton-grid';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Mechanical Keyboards — Compare Prices | KeyDir',
  description: 'Browse mechanical keyboards from Indian vendors. Compare prices, layouts, switch types, and availability. Find the best keyboard deals in India.',
  openGraph: {
    title: 'Mechanical Keyboards — KeyDir',
    description: 'Browse mechanical keyboards from Indian vendors. Compare prices, layouts, and switch types.',
    url: 'https://app.keydir.in/keyboards',
  },
  twitter: {
    title: 'Mechanical Keyboards — KeyDir',
    description: 'Browse mechanical keyboards from Indian vendors. Compare prices, layouts, and switch types.',
  },
};

export default function KeyboardsPage() {
  return (
    <Suspense fallback={<CatalogSkeletonGrid />}>
      <KeyboardsContent />
    </Suspense>
  );
}
