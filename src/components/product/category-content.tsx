'use client';

/**
 * Category page content wrapper that manages filtering, sorting, and
 * product listing via custom hooks. Composes Navbar, HeroBanner,
 * FilterPanel, ProductCards, Pagination, and Footer into a complete
 * catalog page.
 */

import { Navbar } from '@/components/layout/navbar';
import { SubmitProductCTA } from '@/components/layout/submit-product-cta';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product/product-card';
import { EmptyCategory } from '@/components/product/empty-category';
import { HeroBanner } from '@/components/banner/hero-banner';
import FilterPanel from '@/components/product/filter-panel';
import { Pagination } from '@/components/ui/pagination';
import { ProductGridSkeleton } from '@/components/skeleton';
import { SORT_OPTIONS, type Banner } from '@/lib/constants';
import type { SortOption } from '@/types';
import { useCatalogFilters } from '@/hooks/use-catalog-filters';
import { useProductListing } from '@/hooks/use-product-listing';

interface CategoryContentProps {
  productType: string;
  displayName: string;
  emptyIcon: string;
  filtersEndpoint: string;
  productsEndpoint: string;
  defaultSort?: SortOption;
  priceMin?: number;
  priceMax?: number;
  banners?: Banner[];
  totalCount?: number;
}

export function CategoryContent({
  productType,
  displayName,
  emptyIcon,
  filtersEndpoint,
  productsEndpoint,
  defaultSort = 'popular',
  priceMin: fixedPriceMin,
  priceMax: fixedPriceMax,
  banners = [],
  totalCount = 0,
}: CategoryContentProps) {
  const filters = useCatalogFilters({
    filtersEndpoint,
    defaultSort,
    fixedPriceMin,
    fixedPriceMax,
  });

  const { products, total, page, setPage, totalPages, loading } = useProductListing({
    productsEndpoint,
    q: filters.q,
    sort: filters.sort as SortOption,
    applied: filters.applied,
  });

  const sortLabel = SORT_OPTIONS.find((o) => o.value === filters.sort)?.label || 'Lowest Price';

  return (
    <div className="catalog-layout">
      <Navbar />
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>{displayName}</h1>
      {banners.length > 0 && <HeroBanner banners={banners} />}
      <div className="catalog-page">
        {totalCount === 0 ? (
          <EmptyCategory category={displayName} />
        ) : (
          <>
            <div className="catalog-toolbar">
              <div className="catalog-stats">
                <span>{total} {displayName}{displayName.endsWith('s') ? '' : 's'}</span>
                <span className="catalog-stats-sep">·</span>
                <span>Sorted by {sortLabel}</span>
              </div>
              <div className="catalog-controls">
                <button type="button" className={`catalog-filter-btn${filters.filtersOpen ? ' active' : ''}`} onClick={() => filters.setFiltersOpen(!filters.filtersOpen)}>
                  <span className="catalog-filter-icon">⚙</span>
                  <span>Filters</span>
                  {filters.activeCount > 0 && <span className="catalog-filter-count">{filters.activeCount}</span>}
                </button>
                {filters.filtersOpen && filters.filterOptions && (
                  <FilterPanel
                    filterOptions={filters.filterOptions}
                    pending={filters.pending}
                    applied={filters.applied}
                    priceMin={filters.priceMin}
                    priceMax={filters.priceMax}
                    PRICE_MIN={filters.PRICE_MIN}
                    PRICE_MAX={filters.PRICE_MAX}
                    onToggle={filters.toggleOption}
                    onRemove={(k, v) => filters.removeFilter(k, v, filters.sort, setPage)}
                    onApply={() => filters.applyAndClose(filters.sort, setPage)}
                    onReset={() => filters.resetAndClose(filters.sort, setPage)}
                    onPriceMinChange={filters.handlePriceMinChange}
                    onPriceMaxChange={filters.handlePriceMaxChange}
                    onPriceMinInputChange={filters.handlePriceMinInput}
                    onPriceMaxInputChange={filters.handlePriceMaxInput}
                    onClose={() => filters.setFiltersOpen(false)}
                    isOpen={filters.filtersOpen}
                  />
                )}
                <select value={filters.sort} onChange={(e) => { filters.handleSortChange(e.target.value, setPage); }} className="catalog-sort-select catalog-sort-desktop" aria-label="Sort products">
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select value={filters.sort} onChange={(e) => { filters.handleSortChange(e.target.value, setPage); }} className="catalog-sort-select catalog-sort-mobile" aria-label="Sort products">
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
          </div>

            {loading ? (
              <div className="catalog-product-area">
                <ProductGridSkeleton count={12} />
              </div>
            ) : products.length === 0 ? (
              <div className="catalog-empty">
                <div className="catalog-empty-icon">{emptyIcon}</div>
                <div className="catalog-empty-title">No {displayName} Found</div>
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

      <SubmitProductCTA productType={productType} />

      <Footer />
    </div>
  );
}
