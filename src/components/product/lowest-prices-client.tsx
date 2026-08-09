'use client';

/**
 * Lowest prices client-side interactive component. Provides product
 * type filter tabs (All, Keyboards, Switches, Keycaps, Mouse) and
 * renders ProductCards in a responsive grid.
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ProductCard } from './product-card';
import type { ProductCard as ProductCardType } from '@/types';
import { useGridColumns } from '@/hooks/use-grid-columns';

const TYPE_FILTERS = [
  { slug: 'all', label: 'All' },
  { slug: 'keyboards', label: 'Keyboards' },
  { slug: 'switches', label: 'Switches' },
  { slug: 'keycaps', label: 'Keycaps' },
  { slug: 'mouse', label: 'Mouse' },
];

const ROWS = 2;

export function LowestPricesClient({ items }: { items: ProductCardType[] }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const columns = useGridColumns();

  const visible = useMemo(() => {
    const filtered = activeFilter === 'all' ? items : items.filter((item) => item.productType === activeFilter);
    return filtered.slice(0, columns * ROWS);
  }, [items, activeFilter, columns]);

  return (
    <>
      <div className="lp-header">
        <div className="lp-header-text">
          <h2>RECENT <em>ADDITIONS</em></h2>
          <p>Stay up to date with the latest additions to the KeyDir database.</p>
        </div>
        <Link href="/keyboards" className="btn-secondary">VIEW ALL →</Link>
      </div>

      <div className="lp-filters">
        {TYPE_FILTERS.map((cat) => (
          <button
            key={cat.slug}
            className={`lp-filter-btn ${activeFilter === cat.slug ? 'active' : ''}`}
            onClick={() => setActiveFilter(cat.slug)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="lp-grid">
        {visible.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </>
  );
}
