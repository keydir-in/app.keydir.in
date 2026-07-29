/**
 * Keycaps catalog page. Renders a Suspense boundary with a skeleton grid
 * fallback while the server-fetched KeycapsContent component loads.
 * Data fetching (filtering, sorting, pagination) is handled in the content child.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import KeycapsContent from './content';
import { CatalogSkeletonGrid } from '@/components/product/catalog-skeleton-grid';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Keycaps — Compare Prices | KeyDir',
  description: 'Browse keycap sets from Indian vendors. Compare prices, profiles, materials, and compatibility. Find the perfect keycaps for your mechanical keyboard.',
  openGraph: {
    title: 'Keycaps — KeyDir',
    description: 'Browse keycap sets from Indian vendors. Compare prices, profiles, materials, and compatibility.',
    url: 'https://app.keydir.in/keycaps',
  },
  twitter: {
    title: 'Keycaps — KeyDir',
    description: 'Browse keycap sets from Indian vendors. Compare prices, profiles, materials, and compatibility.',
  },
};

export default function KeycapsPage() {
  return (
    <Suspense fallback={<CatalogSkeletonGrid />}>
      <KeycapsContent />
    </Suspense>
  );
}
