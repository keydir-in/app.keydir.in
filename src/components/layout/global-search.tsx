'use client';

/**
 * Global search component in the navbar with expand/collapse input,
 * debounced API search, and grouped dropdown results for products,
 * vendors, and brands.
 * Exports: GlobalSearch
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import Image from 'next/image';
import MagnifierIcon from '@/components/product/magnifier-icon';

interface SearchResult {
  products: { name: string; slug: string; image: string | null; brand: string | null; category: string | null; categorySlug: string | null }[];
  vendors: { name: string; slug: string }[];
  brands: { name: string; slug: string }[];
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setResults(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        if (!query) setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [query]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        if (!query) inputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, query]);

  function expand() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleChange(value: string) {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(value), 250);
  }

  function handleClear() {
    setQuery('');
    setResults(null);
    inputRef.current?.focus();
  }

  function collapse() {
    if (!query) setOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/keyboards?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
      setQuery('');
    }
  }

  function navigate(href: string) {
    router.push(href);
    setOpen(false);
    setQuery('');
  }

  const hasResults = results && (results.products.length > 0 || results.vendors.length > 0 || results.brands.length > 0);

  return (
    <div ref={wrapRef} className={`nav-search-wrap${open ? ' expanded' : ''}`}>
      {!open ? (
        <button className="nav-search-toggle" onClick={expand} aria-label="Search">
          <MagnifierIcon size={18} strokeWidth={1.5} />
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="nav-search">
          <Search className="nav-search-icon" size={15} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={collapse}
            placeholder="Search keyboards..."
            aria-label="Search keyboards"
          />
          {query && (
            <button type="button" className="nav-search-clear" onClick={handleClear} tabIndex={-1}>×</button>
          )}
        </form>
      )}

      {open && query.length >= 2 && (
        <div className="nav-search-dropdown">
          {loading && <div className="nav-search-loading">Searching...</div>}

          {!loading && !hasResults && (
            <div className="nav-search-empty">No results for &quot;{query}&quot;</div>
          )}

          {!loading && hasResults && (
            <>
              {results.products.length > 0 && (
                <div className="nav-search-group">
                  <div className="nav-search-group-label">PRODUCTS</div>
                  {results.products.map((p) => (
                    <button
                      key={p.slug}
                      className="nav-search-item"
                      onMouseDown={(e) => { e.preventDefault(); navigate(`/products/${p.slug}`); }}
                    >
                      <div className="nav-search-item-img">
                        {p.image ? (
                          <Image src={p.image} alt={p.name} width={28} height={28} />
                        ) : (
                          <span>⌨</span>
                        )}
                      </div>
                      <div className="nav-search-item-text">
                        <span className="nav-search-item-name">{p.name}</span>
                        <span className="nav-search-item-meta">{p.category ?? 'Product'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.vendors.length > 0 && (
                <div className="nav-search-group">
                  <div className="nav-search-group-label">VENDORS</div>
                  {results.vendors.map((v) => (
                    <button
                      key={v.slug}
                      className="nav-search-item"
                      onMouseDown={(e) => { e.preventDefault(); navigate(`/keyboards?vendor=${encodeURIComponent(v.name)}`); }}
                    >
                      <div className="nav-search-item-text">
                        <span className="nav-search-item-name">{v.name}</span>
                        <span className="nav-search-item-meta">Vendor</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.brands.length > 0 && (
                <div className="nav-search-group">
                  <div className="nav-search-group-label">BRANDS</div>
                  {results.brands.map((b) => (
                    <button
                      key={b.slug}
                      className="nav-search-item"
                      onMouseDown={(e) => { e.preventDefault(); navigate(`/keyboards?brand=${encodeURIComponent(b.name)}`); }}
                    >
                      <div className="nav-search-item-text">
                        <span className="nav-search-item-name">{b.name}</span>
                        <span className="nav-search-item-meta">Brand</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
