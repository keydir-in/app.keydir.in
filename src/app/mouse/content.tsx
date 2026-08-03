import { prisma } from '@/lib/prisma';
import { getBannersForLocation } from '@/lib/admin/banner-actions';
import { CategoryContent } from '@/components/product/category-content';

export default async function MousePage() {
  const [banners, totalCount] = await Promise.all([
    getBannersForLocation('mouse'),
    prisma.product.count({ where: { productType: 'mouse', status: 'active' } }),
  ]);

  return (
    <CategoryContent
      productType="mouse"
      displayName="Mice"
      emptyIcon="🔍"
      filtersEndpoint="/api/mouse/filters"
      productsEndpoint="/api/mouse"
      defaultSort="lowest"
      banners={banners}
      totalCount={totalCount}
    />
  );
}
