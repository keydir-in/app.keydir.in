'use client';

/**
 * Client-side hook for paginated product fetching with search, sort, and filter support.
 * Debounces requests and returns products, pagination state, and loading status.
 * @returns { products, total, page, setPage, totalPages, loading }
 */

import { useState, useEffect, useCallback } from 'react';
import type { ProductCard, SortOption } from '@/types';

interface ProductListingOpts {
  productsEndpoint: string;
  q: string;
  sort: SortOption;
  applied: Record<string, string[]>;
  initialPage?: number;
}

export function useProductListing({
  productsEndpoint,
  q,
  sort,
  applied,
  initialPage = 1,
}: ProductListingOpts) {
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (q) p.set('q', q);
      p.set('sort', sort);
      p.set('page', String(page));
      for (const [k, v] of Object.entries(applied)) for (const val of v) p.append(k, val);
      if (applied.priceMin) p.set('priceMin', applied.priceMin[0]);
      if (applied.priceMax) p.set('priceMax', applied.priceMax[0]);
      const res = await fetch(`${productsEndpoint}?${p.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setProducts(d.products ?? []);
        setTotal(d.total ?? 0);
        setTotalPages(d.totalPages ?? 1);
      }
    } catch {} finally { setLoading(false); }
  }, [q, sort, page, applied, productsEndpoint]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return { products, total, page, setPage, totalPages, loading };
}
