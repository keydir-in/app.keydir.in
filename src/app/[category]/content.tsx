/**
 * Server-side content for catalog categories: fetches banners and the active
 * product count, then renders the client CategoryContent with the resolved
 * config slug.
 */
import { prisma } from '@/lib/prisma';
import { getBannersForLocation } from '@/lib/admin/banner-actions';
import { getCategoryConfig } from '@/lib/config/category-config';
import { CategoryContent } from '@/components/product/category-content';

export default async function CategoryContentPage({ category }: { category: string }) {
  const config = getCategoryConfig(category);
  if (!config) return null;

  const [banners, totalCount] = await Promise.all([
    getBannersForLocation(config.slug),
    prisma.product.count({ where: { productType: config.slug, status: 'active' } }),
  ]);

  return (
    <CategoryContent
      category={config.slug}
      banners={banners}
      totalCount={totalCount}
    />
  );
}
