'use client';

/**
 * Filter panel orchestrator — detects viewport width and renders either
 * DesktopFilterSidebar (dropdown) or MobileFilterDrawer (slide-out).
 * Shared only via props, never via conditional JSX.
 */

import { useState, useEffect } from 'react';
import DesktopFilterSidebar from '@/components/product/desktop-filter-sidebar';
import MobileFilterDrawer from '@/components/product/mobile-filter-drawer';

interface FilterOptions {
  priceMin: number;
  priceMax: number;
}

interface FilterPanelProps {
  filterOptions: FilterOptions | null;
  pending: Record<string, string[]>;
  applied: Record<string, string[]>;
  priceMin: number;
  priceMax: number;
  PRICE_MIN: number;
  PRICE_MAX: number;
  onToggle: (key: string, val: string) => void;
  onRemove: (key: string, val: string) => void;
  onApply: () => void;
  onReset: () => void;
  onPriceMinChange: (v: number) => void;
  onPriceMaxChange: (v: number) => void;
  onPriceMinInputChange: (v: string) => void;
  onPriceMaxInputChange: (v: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

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

export default function FilterPanel(props: FilterPanelProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');

  if (isMobile) {
    return (
      <MobileFilterDrawer
        filterOptions={props.filterOptions}
        pending={props.pending}
        applied={props.applied}
        priceMin={props.priceMin}
        priceMax={props.priceMax}
        PRICE_MIN={props.PRICE_MIN}
        PRICE_MAX={props.PRICE_MAX}
        onToggle={props.onToggle}
        onRemove={props.onRemove}
        onApply={props.onApply}
        onReset={props.onReset}
        onPriceMinChange={props.onPriceMinChange}
        onPriceMaxChange={props.onPriceMaxChange}
        onPriceMinInputChange={props.onPriceMinInputChange}
        onPriceMaxInputChange={props.onPriceMaxInputChange}
        onClose={props.onClose!}
        isOpen={props.isOpen ?? false}
      />
    );
  }

  return (
    <DesktopFilterSidebar
      filterOptions={props.filterOptions}
      pending={props.pending}
      applied={props.applied}
      priceMin={props.priceMin}
      priceMax={props.priceMax}
      PRICE_MIN={props.PRICE_MIN}
      PRICE_MAX={props.PRICE_MAX}
      onToggle={props.onToggle}
      onRemove={props.onRemove}
      onApply={props.onApply}
      onReset={props.onReset}
      onPriceMinChange={props.onPriceMinChange}
      onPriceMaxChange={props.onPriceMaxChange}
      onPriceMinInputChange={props.onPriceMinInputChange}
      onPriceMaxInputChange={props.onPriceMaxInputChange}
      onClose={props.onClose}
    />
  );
}
