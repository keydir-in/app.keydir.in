/**
 * Mouse catalog page. Renders a Suspense boundary with a skeleton grid
 * fallback while the server-fetched MouseContent component loads.
 * Data fetching (filtering, sorting, pagination) is handled in the content child.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import MouseContent from './content';
import { CatalogSkeletonGrid } from '@/components/product/catalog-skeleton-grid';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Gaming & Productivity Mice — Compare Prices | KeyDir',
  description: 'Browse gaming and productivity mice from Indian vendors. Compare prices, sensor types, weight, connectivity, and find the best deals.',
  openGraph: {
    title: 'Gaming & Productivity Mice — KeyDir',
    description: 'Browse gaming and productivity mice from Indian vendors. Compare prices, sensor types, weight, and connectivity.',
    url: 'https://app.keydir.in/mouse',
  },
  twitter: {
    title: 'Gaming & Productivity Mice — KeyDir',
    description: 'Browse gaming and productivity mice from Indian vendors. Compare prices, sensor types, weight, and connectivity.',
  },
};

export default function MousePage() {
  return (
    <Suspense fallback={<CatalogSkeletonGrid />}>
      <MouseContent />
    </Suspense>
  );
}
