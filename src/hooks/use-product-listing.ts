'use client';

/**
 * Client-side hook for paginated product fetching with search, sort, and
 * filter support. Maps catalog URL keys (min/max) to the API's priceMin/
 * priceMax contract. Caches responses in a small LRU so revisiting a page
 * or toggling filters doesn't refetch. Never clears the grid on refetch
 * (no-flicker), and exposes an error state with a retry callback.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { ProductCard, SortOption } from '@/types';
import type { CategoryConfig } from '@/lib/config/category-config';

interface ProductListingOpts {
  category: CategoryConfig['slug'];
  q: string;
  sort: SortOption;
  applied: Record<string, string[]>;
}

interface ListingData {
  products: ProductCard[];
  total: number;
  totalPages: number;
}

// ponytail: module-level LRU, fine for a single catalog browsing session;
// swap for a shared store if other pages need the same cache.
const CACHE_LIMIT = 60;
const responseCache = new Map<string, ListingData>();

export function useProductListing({ category, q, sort, applied }: ProductListingOpts) {
  const productsEndpoint = `/api/${category}`;
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);

  const fetchProducts = useCallback(async () => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    p.set('sort', sort);
    p.set('page', String(page));
    for (const [k, v] of Object.entries(applied)) {
      if (k === 'min') p.set('priceMin', v[0]);
      else if (k === 'max') p.set('priceMax', v[0]);
      else for (const val of v) p.append(k, val);
    }
    const url = `${productsEndpoint}?${p.toString()}`;
    const seq = ++requestSeq.current;

    const cached = responseCache.get(url);
    if (cached) {
      setProducts(cached.products);
      setTotal(cached.total);
      setTotalPages(cached.totalPages);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const d = await res.json();
      if (seq !== requestSeq.current) return;
      const data: ListingData = {
        products: d.products ?? [],
        total: d.total ?? 0,
        totalPages: d.totalPages ?? 1,
      };
      responseCache.set(url, data);
      if (responseCache.size > CACHE_LIMIT) {
        responseCache.delete(responseCache.keys().next().value!);
      }
      setProducts(data.products);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setError(null);
    } catch {
      if (seq !== requestSeq.current) return;
      setError('Failed to load products. Please try again.');
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [productsEndpoint, q, sort, page, applied]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return { products, total, page, setPage, totalPages, loading, error, retry: fetchProducts };
}
