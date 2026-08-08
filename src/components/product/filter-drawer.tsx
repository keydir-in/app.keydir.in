'use client';

/**
 * Mobile filter drawer — renders FilterPanel inside a slide-out panel from
 * the right with backdrop, close button, and body scroll lock. Used on
 * viewports ≤ 767px.
 */
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import FilterPanel, { type FilterPanelProps } from './filter-panel';
import { useDismiss } from '@/hooks/use-dismiss';

export default function FilterDrawer(props: FilterPanelProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  useDismiss(wrapRef, props.onClose, { ignoreSelector: '.catalog-filter-btn' });

  useEffect(() => {
    if (props.isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [props.isOpen]);

  return (
    <>
      <div className="kb-drawer-backdrop" onClick={props.onClose} />
      <div className={`kb-drawer${props.isOpen ? ' open' : ''}`} ref={wrapRef}>
        <div className="kb-drawer-head">
          <span className="kb-drawer-title">Filters</span>
          <button type="button" className="kb-drawer-close" onClick={props.onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <FilterPanel {...props} variant="drawer" />
      </div>
    </>
  );
}
