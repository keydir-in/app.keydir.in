import { prisma } from '@/lib/prisma';
import { getBannersForLocation } from '@/lib/admin/banner-actions';
import { CategoryContent } from '@/components/product/category-content';

export default async function KeyboardsPage() {
  const [banners, totalCount] = await Promise.all([
    getBannersForLocation('keyboards'),
    prisma.product.count({ where: { productType: 'keyboards', status: 'active' } }),
  ]);

  return (
    <CategoryContent
      productType="keyboard"
      displayName="Keyboards"
      emptyIcon="⌨"
      filtersEndpoint="/api/keyboards/filters"
      productsEndpoint="/api/products"
      defaultSort="lowest"
      priceMin={1499}
      priceMax={19999}
      banners={banners}
      totalCount={totalCount}
    />
  );
}
