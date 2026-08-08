'use client';

/**
 * Desktop filter sidebar — renders FilterPanel inside a dropdown shell that
 * is absolutely positioned below the filter button. Closes on outside click
 * or Escape.
 */
import { useRef } from 'react';
import FilterPanel, { type FilterPanelProps } from './filter-panel';
import { useDismiss } from '@/hooks/use-dismiss';

export default function FilterSidebar(props: FilterPanelProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  useDismiss(wrapRef, props.onClose, { ignoreSelector: '.catalog-filter-btn' });

  return (
    <div className="kb-sidebar-wrap" ref={wrapRef}>
      <div className="kb-sidebar">
        <div className="kb-sidebar-head">
          <span className="kb-sidebar-title">Filters</span>
        </div>
        <FilterPanel {...props} variant="sidebar" />
      </div>
    </div>
  );
}
