import { prisma } from '@/lib/prisma';
import { getBannersForLocation } from '@/lib/admin/banner-actions';
import { CategoryContent } from '@/components/product/category-content';

export default async function KeycapsPage() {
  const [banners, totalCount] = await Promise.all([
    getBannersForLocation('keycaps'),
    prisma.product.count({ where: { productType: 'keycaps', status: 'active' } }),
  ]);

  return (
    <CategoryContent
      productType="keycap"
      displayName="Keycap Sets"
      emptyIcon="🔍"
      filtersEndpoint="/api/keycaps/filters"
      productsEndpoint="/api/keycaps"
      defaultSort="lowest"
      banners={banners}
      totalCount={totalCount}
    />
  );
}
