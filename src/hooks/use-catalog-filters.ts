'use client';

/**
 * Client-side hook managing catalog page filters, sort, and pagination via
 * URL search params. Category config (endpoint, sort default, price bounds)
 * is derived from @/lib/config/category-config. Price bounds: min comes from
 * config or filter data; max is dynamic (data max, fallback 100000). Price
 * filters use `min`/`max` URL keys and are only applied on Apply.
 */
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { clamp } from '@/lib/utils';
import { SORT_OPTIONS, type FilterOptions } from '@/lib/constants';
import { getCategoryConfig, type CategoryConfig } from '@/lib/config/category-config';

interface CatalogFiltersOpts {
  category: CategoryConfig['slug'];
}

const FALLBACK_MAX = 100000;

function safeFloat(raw: string | null, fallback: number): number {
  const n = parseFloat(raw ?? '');
  return Number.isFinite(n) ? n : fallback;
}

export function useCatalogFilters({ category }: CatalogFiltersOpts) {
  const config = getCategoryConfig(category);
  if (!config) throw new Error(`Unknown category: ${category}`);

  const filtersEndpoint = `/api/${category}/filters`;
  const defaultSort = config.defaultSort;
  const fixedPriceMin = config.priceMin;
  const fixedPriceMax = config.priceMax;

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const q = searchParams.get('q') || '';
  const rawSort = searchParams.get('sort');
  const sort = rawSort && (SORT_OPTIONS as { value: string }[]).some((o) => o.value === rawSort) ? rawSort : defaultSort;

  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [PRICE_MIN, setPRICE_MIN] = useState(fixedPriceMin ?? 0);
  const [PRICE_MAX, setPRICE_MAX] = useState(fixedPriceMax ?? FALLBACK_MAX);
  const [priceMin, setPriceMin] = useState<number>(() =>
    fixedPriceMin != null ? fixedPriceMin : safeFloat(searchParams.get('min'), 0),
  );
  const [priceMax, setPriceMax] = useState<number>(() =>
    fixedPriceMax != null ? fixedPriceMax : safeFloat(searchParams.get('max'), FALLBACK_MAX),
  );

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
    let cancelled = false;
    fetch(filtersEndpoint)
      .then((r) => {
        if (!r.ok) throw new Error(`Filter request failed: ${r.status}`);
        return r.json();
      })
      .then((d: FilterOptions) => {
        if (cancelled) return;
        setFilterOptions(d);
        if (fixedPriceMin == null) {
          const dataMin = d.priceMin ?? 0;
          setPRICE_MIN(dataMin);
          setPriceMin((prev) => (prev > dataMin ? prev : dataMin));
        }
        if (fixedPriceMax == null) {
          const dataMax = d.priceMax ?? FALLBACK_MAX;
          setPRICE_MAX(dataMax);
          setPriceMax((prev) => (prev < dataMax ? prev : dataMax));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [filtersEndpoint, fixedPriceMin, fixedPriceMax]);

  const buildUrl = useCallback(
    (s: string, f: Record<string, string[]>, pMin: number, pMax: number, p: number) => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (s !== defaultSort) params.set('sort', s);
      if (p > 1) params.set('page', String(p));
      for (const [k, v] of Object.entries(f)) {
        if (k === 'min' || k === 'max') continue;
        for (const val of v) params.append(k, val);
      }
      if (pMin > PRICE_MIN) params.set('min', String(pMin));
      if (pMax < PRICE_MAX) params.set('max', String(pMax));
      const qs = params.toString();
      return `${pathname}${qs ? `?${qs}` : ''}`;
    },
    [pathname, q, defaultSort, PRICE_MIN, PRICE_MAX],
  );

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
    if (priceMin > PRICE_MIN) next.min = [String(priceMin)];
    else delete next.min;
    if (priceMax < PRICE_MAX) next.max = [String(priceMax)];
    else delete next.max;
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
    if (key === 'min') setPriceMin(PRICE_MIN);
    if (key === 'max') setPriceMax(PRICE_MAX);
    setApplied((prev) => {
      const u = { ...prev, [key]: (prev[key] || []).filter((v) => v !== val) };
      if (!u[key]?.length) delete u[key];
      setPending(u);
      setPage(1);
      const pMin = key === 'min' ? PRICE_MIN : priceMin;
      const pMax = key === 'max' ? PRICE_MAX : priceMax;
      push(sort, u, pMin, pMax, 1);
      return u;
    });
  }

  function handlePriceMinChange(v: number) { setPriceMin(v); }
  function handlePriceMaxChange(v: number) { setPriceMax(v); }

  function handlePriceMinInput(v: string) {
    const n = parseFloat(v.replace(/[^\d.]/g, ''));
    if (!Number.isFinite(n)) { setPriceMin(PRICE_MIN); return; }
    setPriceMin(clamp(n, PRICE_MIN, priceMax - 100));
  }

  function handlePriceMaxInput(v: string) {
    const n = parseFloat(v.replace(/[^\d.]/g, ''));
    if (!Number.isFinite(n)) { setPriceMax(PRICE_MAX); return; }
    setPriceMax(clamp(n, priceMin + 100, PRICE_MAX));
  }

  return {
    q, sort, filterOptions, filtersOpen, setFiltersOpen,
    PRICE_MIN, PRICE_MAX, priceMin, priceMax,
    pending, applied, activeCount,
    handleSortChange, toggleOption, applyAndClose, resetAndClose, removeFilter,
    handlePriceMinChange, handlePriceMaxChange, handlePriceMinInput, handlePriceMaxInput,
  };
}
