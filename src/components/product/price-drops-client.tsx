'use client';

/**
 * PRICE DROPS grid client. Renders ProductCards with a drop badge in a
 * row-aligned responsive grid (exactly 2 rows, columns follow the viewport).
 */

import { useMemo } from 'react';
import { ProductCard } from './product-card';
import type { ProductCard as ProductCardType } from '@/types';
import { useGridColumns } from '@/hooks/use-grid-columns';

const ROWS = 2;

export function PriceDropsClient({ items }: { items: ProductCardType[] }) {
  const columns = useGridColumns();
  const visible = useMemo(() => items.slice(0, columns * ROWS), [items, columns]);

  return (
    <>
      <div className="lp-header">
        <div className="lp-header-text">
          <h2>PRICE <em>DROPS</em></h2>
          <p>Products that recently dropped in price across Indian vendors.</p>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="catalog-empty">
          <div className="catalog-empty-icon">📉</div>
          <div className="catalog-empty-title">No recent price drops</div>
          <p className="catalog-empty-desc">Check back after the next price scrape.</p>
        </div>
      ) : (
        <div className="lp-grid">
          {visible.map((item) => {
            const amount = item.originalPrice != null && item.lowestPrice != null
              ? item.originalPrice - item.lowestPrice
              : 0;
            const percent = item.originalPrice ? Math.round((amount / item.originalPrice) * 100) : 0;
            return (
              <ProductCard key={item.id} product={item} drop={{ amount, percent }} />
            );
          })}
        </div>
      )}
    </>
  );
}
