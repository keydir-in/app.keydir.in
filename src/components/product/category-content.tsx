'use client';

/**
 * Category page content wrapper that manages filtering, sorting, and
 * product listing via custom hooks. Category config is resolved from
 * @/lib/config/category-config; a viewport check picks the desktop sidebar
 * or mobile drawer for the shared filter panel.
 */
import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { SubmitProductCTA } from '@/components/layout/submit-product-cta';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product/product-card';
import { EmptyCategory } from '@/components/product/empty-category';
import { HeroBanner } from '@/components/banner/hero-banner';
import FilterSidebar from '@/components/product/filter-sidebar';
import FilterDrawer from '@/components/product/filter-drawer';
import { Pagination } from '@/components/ui/pagination';
import { ProductGridSkeleton } from '@/components/skeleton';
import { SORT_OPTIONS, type Banner } from '@/lib/constants';
import type { SortOption } from '@/types';
import { useCatalogFilters } from '@/hooks/use-catalog-filters';
import { useProductListing } from '@/hooks/use-product-listing';
import { getCategoryConfig, type CategoryConfig } from '@/lib/config/category-config';

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

interface CategoryContentProps {
  category: CategoryConfig['slug'];
  banners?: Banner[];
  totalCount?: number;
}

export function CategoryContent({ category, banners = [], totalCount = 0 }: CategoryContentProps) {
  const config = getCategoryConfig(category);
  if (!config) throw new Error(`Unknown category: ${category}`);

  const filters = useCatalogFilters({ category });

  const { products, total, page, setPage, totalPages, loading, error, retry } = useProductListing({
    category,
    q: filters.q,
    sort: filters.sort as SortOption,
    applied: filters.applied,
  });

  const isMobile = useMediaQuery('(max-width: 767px)');

  const filterProps = {
    pending: filters.pending,
    applied: filters.applied,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
    PRICE_MIN: filters.PRICE_MIN,
    PRICE_MAX: filters.PRICE_MAX,
    onToggle: filters.toggleOption,
    onRemove: (k: string, v: string) => filters.removeFilter(k, v, filters.sort, setPage),
    onApply: () => filters.applyAndClose(filters.sort, setPage),
    onReset: () => filters.resetAndClose(filters.sort, setPage),
    onPriceMinChange: filters.handlePriceMinChange,
    onPriceMaxChange: filters.handlePriceMaxChange,
    onPriceMinInputChange: filters.handlePriceMinInput,
    onPriceMaxInputChange: filters.handlePriceMaxInput,
    onClose: () => filters.setFiltersOpen(false),
    isOpen: filters.filtersOpen,
  };

  const sortLabel = SORT_OPTIONS.find((o) => o.value === filters.sort)?.label || 'Lowest Price';
  const showSkeleton = loading && products.length === 0;

  return (
    <div className="catalog-layout">
      <Navbar />
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>{config.displayName}</h1>
      {banners.length > 0 && <HeroBanner banners={banners} />}
      <div className="catalog-page">
        {totalCount === 0 ? (
          <EmptyCategory category={config.displayName} />
        ) : (
          <>
            <div className="catalog-toolbar">
              <div className="catalog-stats">
                <span>{total} {config.displayName}</span>
                <span className="catalog-stats-sep">·</span>
                <span>Sorted by {sortLabel}</span>
              </div>
              <div className="catalog-controls">
                <button type="button" className={`catalog-filter-btn${filters.filtersOpen ? ' active' : ''}`} onClick={() => filters.setFiltersOpen(!filters.filtersOpen)}>
                  <span className="catalog-filter-icon">⚙</span>
                  <span>Filters</span>
                  {filters.activeCount > 0 && <span className="catalog-filter-count">{filters.activeCount}</span>}
                </button>
                {filters.filtersOpen && (isMobile ? <FilterDrawer {...filterProps} /> : <FilterSidebar {...filterProps} />)}
                <select value={filters.sort} onChange={(e) => { filters.handleSortChange(e.target.value, setPage); }} className="catalog-sort-select catalog-sort-desktop" aria-label="Sort products">
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select value={filters.sort} onChange={(e) => { filters.handleSortChange(e.target.value, setPage); }} className="catalog-sort-select catalog-sort-mobile" aria-label="Sort products">
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {error ? (
              <div className="catalog-empty">
                <div className="catalog-empty-icon">⚠️</div>
                <div className="catalog-empty-title">Something went wrong</div>
                <p className="catalog-empty-desc">{error}</p>
                <button type="button" onClick={retry} className="btn-secondary">Try Again</button>
              </div>
            ) : showSkeleton ? (
              <div className="catalog-product-area">
                <ProductGridSkeleton count={12} />
              </div>
            ) : products.length === 0 ? (
              <div className="catalog-empty">
                <div className="catalog-empty-icon">{config.emptyIcon}</div>
                <div className="catalog-empty-title">No {config.displayName} Found</div>
                <p className="catalog-empty-desc">Try adjusting your search or filters.</p>
                <button type="button" onClick={() => filters.resetAndClose(filters.sort, setPage)} className="btn-secondary">Clear Filters</button>
              </div>
            ) : (
              <div className="catalog-product-area">
                <div className="catalog-grid">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                <Pagination page={page} totalPages={totalPages} />
              </div>
            )}
          </>
        )}
      </div>

      <SubmitProductCTA productType={config.submitType} />

      <Footer />
    </div>
  );
}
