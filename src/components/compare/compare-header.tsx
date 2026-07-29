'use client';

/**
 * Compare page header with product search, add/remove controls, and
 * differences toggle. Provides a debounced search dropdown to find and
 * add products to the comparison tray.
 * Exports: CompareHeader
 */

import { X, Plus, Search } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface SearchResult {
  name: string;
  slug: string;
  image: string | null;
  brand: string | null;
  category: string;
  categorySlug: string;
}

interface Props {
  productSlugs: string[];
  onAdd: (slug: string) => void;
  onRemove: (slug: string) => void;
  onClear: () => void;
  onlyDiff: boolean;
  onOnlyDiffChange: (v: boolean) => void;
  title: string;
  titleHighlight: string;
  categoryFilter: string;
  addLabel: string;
  searchPlaceholder: string;
  emptyMessage: string;
  maxMessage: string;
  noResultsMessage: string;
}

export function CompareHeader({
  productSlugs,
  onAdd,
  onClear,
  onlyDiff,
  onOnlyDiffChange,
  title,
  titleHighlight,
  categoryFilter,
  addLabel,
  searchPlaceholder,
  emptyMessage,
  maxMessage,
  noResultsMessage,
}: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const atMax = productSlugs.length >= 4;

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query || query.length < 2) {
      debounceRef.current = setTimeout(() => setResults([]), 0);
    } else {
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          const filtered = data.products.filter(
            (p: SearchResult) => p.category === categoryFilter && !productSlugs.includes(p.slug)
          );
          setResults(filtered.slice(0, 6));
        } catch { setResults([]); }
      }, 200);
    }
    return () => clearTimeout(debounceRef.current);
  }, [query, productSlugs, categoryFilter]);

  function select(slug: string) {
    onAdd(slug);
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  const addBtn = (
    <div className="compare-search-wrap">
      <button
        className="btn-primary btn-sm"
        disabled={atMax}
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
      >
        <Plus size={14} /> {addLabel}
      </button>

      {open && (
        <div className="compare-search-dropdown">
          <div className="compare-search-input-wrap">
            <Search size={14} className="compare-search-icon" />
            <input
              ref={inputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="compare-search-input"
              onBlur={() => setTimeout(() => { if (!query) setOpen(false); }, 200)}
              aria-label="Search products to compare"
            />
            <button onClick={() => { setOpen(false); setQuery(''); setResults([]); }} className="compare-search-close">
              <X size={14} />
            </button>
          </div>
          {results.length > 0 && (
            <div className="compare-search-results">
              {results.map((r) => (
                <button
                  key={r.slug}
                  className="compare-search-item"
                  onMouseDown={() => select(r.slug)}
                >
                  {r.image && (
                    <Image src={r.image} alt="" width={32} height={32} className="compare-search-item-img" unoptimized />
                  )}
                  <div className="compare-search-item-info">
                    <span className="compare-search-item-name">{r.name}</span>
                    {r.brand && <span className="compare-search-item-brand">{r.brand}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
          {query.length >= 2 && results.length === 0 && (
            <div className="compare-search-empty">{noResultsMessage}</div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="compare-header">
      <div className="compare-header-top">
        <div>
          <h1 className="page-hero-title" style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', marginBottom: '.5rem' }}>
            {title} <span className="text-[var(--yellow)]">{titleHighlight}</span>
          </h1>
        </div>
        <div className="compare-header-actions">
          <button
            className={`btn-secondary btn-sm${onlyDiff ? ' active' : ''}`}
            onClick={() => onOnlyDiffChange(!onlyDiff)}
          >
            Differences
          </button>
          {productSlugs.length > 0 && (
            <button onClick={onClear} className="btn-secondary btn-sm">
              <X size={14} /> Clear All
            </button>
          )}
          {addBtn}
        </div>
      </div>

      {productSlugs.length === 0 && (
        <div className="compare-empty">
          <p>{emptyMessage}</p>
        </div>
      )}


      {atMax && (
        <div className="compare-max-notice">
          {maxMessage}
        </div>
      )}
    </div>
  );
}
