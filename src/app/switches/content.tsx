import { prisma } from '@/lib/prisma';
import { getBannersForLocation } from '@/lib/admin/banner-actions';
import { CategoryContent } from '@/components/product/category-content';

export default async function SwitchesPage() {
  const [banners, totalCount] = await Promise.all([
    getBannersForLocation('switches'),
    prisma.product.count({ where: { productType: 'switches', status: 'active' } }),
  ]);

  return (
    <CategoryContent
      productType="switch"
      displayName="Switches"
      emptyIcon="🔍"
      filtersEndpoint="/api/switches/filters"
      productsEndpoint="/api/switches"
      banners={banners}
      totalCount={totalCount}
    />
  );
}
