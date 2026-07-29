/**
 * Switches catalog page. Renders a Suspense boundary with a skeleton grid
 * fallback while the server-fetched SwitchesContent component loads.
 * Data fetching (filtering, sorting, pagination) is handled in the content child.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import SwitchesContent from './content';
import { CatalogSkeletonGrid } from '@/components/product/catalog-skeleton-grid';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Mechanical Keyboard Switches — Compare Prices | KeyDir',
  description: 'Browse mechanical keyboard switches from Indian vendors. Compare linear, tactile, and clicky switches by price, actuation force, and type.',
  openGraph: {
    title: 'Mechanical Keyboard Switches — KeyDir',
    description: 'Browse mechanical keyboard switches from Indian vendors. Compare linear, tactile, and clicky switches.',
    url: 'https://app.keydir.in/switches',
  },
  twitter: {
    title: 'Mechanical Keyboard Switches — KeyDir',
    description: 'Browse mechanical keyboard switches from Indian vendors. Compare linear, tactile, and clicky switches.',
  },
};

export default function SwitchesPage() {
  return (
    <Suspense fallback={<CatalogSkeletonGrid />}>
      <SwitchesContent />
    </Suspense>
  );
}
