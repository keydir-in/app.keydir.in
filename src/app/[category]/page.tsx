/**
 * Dynamic catalog page for all categories (keyboards, keycaps, switches,
 * mouse). Resolves category config from the URL segment for SEO metadata
 * and renders a Suspense boundary with a skeleton grid fallback while the
 * server-fetched content component loads.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import CategoryContentPage from './content';
import { CatalogSkeletonGrid } from '@/components/product/catalog-skeleton-grid';
import { getCategoryConfig, CATEGORY_SLUGS } from '@/lib/config/category-config';

interface Props {
  params: Promise<{ category: string }>;
}

export const revalidate = 300;

export function generateStaticParams() {
  return CATEGORY_SLUGS.map((category) => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const config = getCategoryConfig(category);
  if (!config) return {};

  const url = `https://app.keydir.in/${category}`;
  return {
    title: config.seo.title,
    description: config.seo.description,
    openGraph: {
      title: config.seo.ogTitle,
      description: config.seo.ogDescription,
      url,
    },
    twitter: {
      title: config.seo.ogTitle,
      description: config.seo.ogDescription,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  if (!getCategoryConfig(category)) notFound();

  return (
    <Suspense fallback={<CatalogSkeletonGrid />}>
      <CategoryContentPage category={category} />
    </Suspense>
  );
}
