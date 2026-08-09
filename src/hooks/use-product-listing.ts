'use client';

/**
 * Client-side hook for paginated product fetching with search, sort, and
 * filter support. The listing API streams NDJSON (metadata line, then one
 * product per line); this hook parses it incrementally and appends products
 * to the grid as they arrive, so the top products paint first instead of
 * waiting for the full page. Caches page responses in a small LRU so
 * revisiting a page or toggling filters doesn't refetch. Page is driven by
 * the `page` URL search param; navigating to a page replaces the grid.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ProductCard, SortOption } from '@/types';
import type { CategoryConfig } from '@/lib/config/category-config';
import { useGridColumns } from '@/hooks/use-grid-columns';

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
  pageSize: number;
}

interface StreamMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const DEFAULT_PAGE_SIZE = 25;

const ROWS_PER_PAGE = 5;

// ponytail: module-level LRU, fine for a single catalog browsing session;
// swap for a shared store if other pages need the same cache.
const CACHE_LIMIT = 60;
const responseCache = new Map<string, ListingData>();

function parseLine(line: string, onMeta: (m: StreamMeta) => void, onProducts: (batch: ProductCard[]) => void) {
  const obj = JSON.parse(line);
  if (obj && typeof obj.total === 'number' && obj.pageSize != null) onMeta(obj as StreamMeta);
  else onProducts([obj as ProductCard]);
}

async function readStreamed(
  res: Response,
  onMeta: (m: StreamMeta) => void,
  onProducts: (batch: ProductCard[]) => void,
) {
  if (!res.body) {
    for (const line of (await res.text()).split('\n')) {
      if (line.trim()) parseLine(line, onMeta, onProducts);
    }
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl = buffer.indexOf('\n');
    while (nl !== -1) {
      const line = buffer.slice(0, nl);
      if (line.trim()) parseLine(line, onMeta, onProducts);
      buffer = buffer.slice(nl + 1);
      nl = buffer.indexOf('\n');
    }
  }
  if (buffer.trim()) parseLine(buffer, onMeta, onProducts);
}

export function useProductListing({ category, q, sort, applied }: ProductListingOpts) {
  const columns = useGridColumns();
  const pageSize = columns * ROWS_PER_PAGE;
  const productsEndpoint = `/api/${category}`;
  const searchParams = useSearchParams();
  const rawPage = Number.parseInt(searchParams.get('page') || '1', 10);
  const pageFromUrl = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
  const [page, setPage] = useState(pageFromUrl);
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(pageFromUrl);
  }, [pageFromUrl]);

  const fetchPage = useCallback(
    async (targetPage: number) => {
      const p = new URLSearchParams();
      if (q) p.set('q', q);
      p.set('sort', sort);
      p.set('page', String(targetPage));
      p.set('pageSize', String(pageSize));
      for (const [k, v] of Object.entries(applied)) {
        if (k === 'min') p.set('priceMin', v[0]);
        else if (k === 'max') p.set('priceMax', v[0]);
        else for (const val of v) p.append(k, val);
      }
      const url = `${productsEndpoint}?${p.toString()}`;
      const seq = ++requestSeq.current;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const cached = responseCache.get(url);
      if (cached) {
        setProducts(cached.products);
        setTotal(cached.total);
        setTotalPages(cached.totalPages);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error || `Request failed: ${res.status}`);
        }

        let replaced = false;
        const collected: ProductCard[] = [];
        let meta: StreamMeta = { total: 0, page: targetPage, pageSize: DEFAULT_PAGE_SIZE, totalPages: 1 };

        const onMeta = (m: StreamMeta) => {
          if (seq !== requestSeq.current) return;
          meta = m;
          setTotal(m.total);
          setTotalPages(m.totalPages);
          setPage(m.page);
        };
        const onProducts = (batch: ProductCard[]) => {
          if (seq !== requestSeq.current) return;
          collected.push(...batch);
          if (!replaced) {
            replaced = true;
            setProducts(batch);
          } else {
            setProducts((prev) => [...prev, ...batch]);
          }
        };

        await readStreamed(res, onMeta, onProducts);

        if (seq !== requestSeq.current) return;
        if (targetPage === 1 && !replaced) setProducts([]);
        responseCache.set(url, {
          products: collected,
          total: meta.total,
          totalPages: meta.totalPages,
          pageSize: meta.pageSize,
        });
        if (responseCache.size > CACHE_LIMIT) {
          responseCache.delete(responseCache.keys().next().value!);
        }
        setError(null);
      } catch {
        if (seq !== requestSeq.current || controller.signal.aborted) return;
        setError('Failed to load products. Please try again.');
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    },
    [productsEndpoint, q, sort, applied, pageSize],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPage(page);
    const controller = abortRef.current;
    return () => controller?.abort();
  }, [fetchPage, page]);

  const prevColumns = useRef(columns);
  useEffect(() => {
    if (prevColumns.current !== columns) {
      prevColumns.current = columns;
      setPage(1);
    }
  }, [columns]);

  const retry = useCallback(() => {
    fetchPage(page);
  }, [fetchPage, page]);

  return {
    products,
    total,
    page,
    setPage,
    totalPages,
    pageSize,
    loading,
    error,
    retry,
  };
}
