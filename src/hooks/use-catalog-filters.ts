'use client';

/**
 * Client-side hook managing catalog page filters, sort, and pagination via URL search params.
 * Fetches available filter options, handles price range, and syncs state with the URL.
 * @returns Filter state, handlers, and URL-synced query/sort values.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { clamp } from '@/lib/utils';
import { SORT_OPTIONS, type FilterOptions } from '@/lib/constants';

interface CatalogFiltersOpts {
  filtersEndpoint: string;
  defaultSort: string;
  fixedPriceMin?: number;
  fixedPriceMax?: number;
}

export function useCatalogFilters({
  filtersEndpoint,
  defaultSort,
  fixedPriceMin,
  fixedPriceMax,
}: CatalogFiltersOpts) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const q = searchParams.get('q') || '';
  const rawSort = searchParams.get('sort');
  const sort = rawSort && (SORT_OPTIONS as { value: string }[]).some((o) => o.value === rawSort) ? rawSort : defaultSort;

  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [PRICE_MIN, setPRICE_MIN] = useState(fixedPriceMin ?? 0);
  const [PRICE_MAX, setPRICE_MAX] = useState(fixedPriceMax ?? Infinity);
  const [priceMin, setPriceMin] = useState<number>(() => {
    if (fixedPriceMin != null) return fixedPriceMin;
    const v = searchParams.get('priceMin');
    return v ? parseInt(v, 10) : 0;
  });
  const [priceMax, setPriceMax] = useState<number>(() => {
    if (fixedPriceMax != null) return fixedPriceMax;
    const v = searchParams.get('priceMax');
    return v ? parseInt(v, 10) : Infinity;
  });

  const [pending, setPending] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const key of searchParams.keys()) {
      if (key === 'q' || key === 'sort' || key === 'page') continue;
      init[key] = searchParams.getAll(key);
    }
    return init;
  });
  const [applied, setApplied] = useState<Record<string, string[]>>(pending);

  const activeCount = Object.values(applied).reduce((n, a) => n + a.length, 0);

  useEffect(() => {
    fetch(filtersEndpoint)
      .then((r) => r.json())
      .then((d: FilterOptions) => {
        setFilterOptions(d);
        if (fixedPriceMin == null) {
          setPRICE_MIN(d.priceMin);
          setPriceMin((prev) => prev || d.priceMin);
        }
        if (fixedPriceMax == null) {
          setPRICE_MAX(d.priceMax);
          setPriceMax((prev) => prev || d.priceMax);
        }
      })
      .catch(() => {});
  }, [filtersEndpoint, fixedPriceMin, fixedPriceMax]);

  const buildUrl = useCallback((s: string, f: Record<string, string[]>, pMin: number, pMax: number, p: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (s !== defaultSort) params.set('sort', s);
    if (p > 1) params.set('page', String(p));
    for (const [k, v] of Object.entries(f)) for (const val of v) params.append(k, val);
    if (pMin > PRICE_MIN) params.set('priceMin', String(pMin));
    if (pMax < PRICE_MAX) params.set('priceMax', String(pMax));
    const qs = params.toString();
    return `${pathname}${qs ? `?${qs}` : ''}`;
  }, [pathname, q, defaultSort, PRICE_MIN, PRICE_MAX]);

  const push = useCallback((s: string, f: Record<string, string[]>, pMin: number, pMax: number, p: number) => {
    router.push(buildUrl(s, f, pMin, pMax, p), { scroll: false });
  }, [router, buildUrl]);

  function handleSortChange(s: string, setPage: (p: number) => void) {
    setPage(1);
    push(s, applied, priceMin, priceMax, 1);
  }

  function toggleOption(key: string, val: string) {
    setPending((prev) => {
      const cur = prev[key] || [];
      return { ...prev, [key]: cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val] };
    });
  }

  function applyAndClose(sort: string, setPage: (p: number) => void) {
    const next = { ...pending };
    if (priceMin > PRICE_MIN) next.priceMin = [String(priceMin)];
    else delete next.priceMin;
    if (priceMax < PRICE_MAX) next.priceMax = [String(priceMax)];
    else delete next.priceMax;
    setApplied(next);
    setPage(1);
    push(sort, next, priceMin, priceMax, 1);
    setFiltersOpen(false);
  }

  function resetAndClose(sort: string, setPage: (p: number) => void) {
    setPending({}); setApplied({});
    setPriceMin(PRICE_MIN); setPriceMax(PRICE_MAX);
    setPage(1);
    push(sort, {}, PRICE_MIN, PRICE_MAX, 1);
    setFiltersOpen(false);
  }

  function removeFilter(key: string, val: string, sort: string, setPage: (p: number) => void) {
    if (key === 'priceMin') setPriceMin(PRICE_MIN);
    if (key === 'priceMax') setPriceMax(PRICE_MAX);
    setApplied((prev) => {
      const u = { ...prev, [key]: (prev[key] || []).filter((v) => v !== val) };
      if (!u[key]?.length) delete u[key];
      setPending(u);
      setPage(1);
      const pMin = key === 'priceMin' ? PRICE_MIN : priceMin;
      const pMax = key === 'priceMax' ? PRICE_MAX : priceMax;
      push(sort, u, pMin, pMax, 1);
      return u;
    });
  }

  function handlePriceMinChange(v: number) { setPriceMin(v); }
  function handlePriceMaxChange(v: number) { setPriceMax(v); }
  function handlePriceMinInput(v: string) {
    const n = parseInt(v.replace(/\D/g, ''), 10);
    if (!isNaN(n)) setPriceMin(clamp(n, PRICE_MIN, priceMax - 100));
  }
  function handlePriceMaxInput(v: string) {
    const n = parseInt(v.replace(/\D/g, ''), 10);
    if (!isNaN(n)) setPriceMax(clamp(n, priceMin + 100, PRICE_MAX));
  }

  return {
    q, sort, filterOptions, filtersOpen, setFiltersOpen,
    PRICE_MIN, PRICE_MAX, priceMin, priceMax,
    pending, applied, activeCount,
    handleSortChange, toggleOption, applyAndClose, resetAndClose, removeFilter,
    handlePriceMinChange, handlePriceMaxChange, handlePriceMinInput, handlePriceMaxInput,
  };
}
