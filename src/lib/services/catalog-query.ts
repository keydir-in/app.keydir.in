/**
 * Pure helpers for building the catalog listing API query string. Shared by
 * the client hook (useProductListing) and the server (catalog page) so the
 * server-rendered initial listing uses exactly the query the client would
 * fetch — the seeded data is only reused when both strings match.
 */
import type { SortOption } from '@/types';
import { SORT_OPTIONS } from '@/lib/constants';

// Matches the client's default first fetch: columns(5) * ROWS_PER_PAGE(5).
export const DEFAULT_CATALOG_PAGE_SIZE = 25;

export interface ListingParams {
  q?: string;
  sort: SortOption;
  page: number;
  pageSize: number;
  applied: Record<string, string[]>;
}

export function buildListingParams({
  q,
  sort,
  page,
  pageSize,
  applied,
}: ListingParams): URLSearchParams {
  const p = new URLSearchParams();
  if (q) p.set('q', q);
  p.set('sort', sort);
  p.set('page', String(page));
  p.set('pageSize', String(pageSize));
  for (const [k, v] of Object.entries(applied)) {
    if (k === 'min') p.set('priceMin', v[0]);
    else if (k === 'max') p.set('priceMax', v[0]);
    else for (const val of v) p.append(k, val);
  }
  return p;
}

export interface ListingSeed {
  query: string;
  products: import('@/types').ProductCard[];
  total: number;
  totalPages: number;
  pageSize: number;
}

export function buildListingQuery(params: ListingParams): string {
  return buildListingParams(params).toString();
}

/**
 * Builds the same listing query string the client hook would fetch for the
 * given Next.js search params. The server page renders its initial grid from
 * this so the seeded data lines up with the client's first fetch.
 */
export function buildListingQueryFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
  defaultSort: SortOption,
  pageSize: number = DEFAULT_CATALOG_PAGE_SIZE,
): string {
  const q = typeof searchParams.q === 'string' ? searchParams.q : '';
  const rawSort = searchParams.sort;
  const sort =
    typeof rawSort === 'string' && (SORT_OPTIONS as { value: string }[]).some((o) => o.value === rawSort)
      ? (rawSort as SortOption)
      : defaultSort;
  const rawPage = typeof searchParams.page === 'string' ? Number.parseInt(searchParams.page, 10) : 1;
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;

  const applied: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === 'q' || key === 'sort' || key === 'page') continue;
    applied[key] = Array.isArray(value) ? value : value != null ? [value] : [];
  }

  return buildListingQuery({ q, sort, page, pageSize, applied });
}
