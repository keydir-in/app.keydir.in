'use client';

/**
 * Desktop filter sidebar — accordion-based filter panel with dual-handle
 * price range slider, stacked checkboxes, selected chips, and apply/reset.
 * Rendered as an absolutely-positioned dropdown below the filter button.
 * Uses kb-sidebar-* classes exclusively — never shares markup with mobile.
 */

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { clamp } from '@/lib/utils';
import { AVAILABILITY_MAP } from '@/lib/constants';

interface FilterOptions {
  priceMin: number;
  priceMax: number;
}

interface DesktopFilterSidebarProps {
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
}

const AVAILABILITY = ['in_stock', 'preorder', 'group_buy', 'coming_soon', 'out_of_stock'].map((k) => AVAILABILITY_MAP[k].label);

function fmtPrice(n: number): string {
  return '₹' + n.toLocaleString('en-IN');
}

function pctToVal(pct: number, PRICE_MIN: number, PRICE_MAX: number) {
  return Math.round(PRICE_MIN + (pct / 100) * (PRICE_MAX - PRICE_MIN));
}

function valToPct(val: number, PRICE_MIN: number, PRICE_MAX: number) {
  return ((val - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
}

export default function DesktopFilterSidebar({
  pending,
  applied,
  priceMin,
  priceMax,
  PRICE_MIN,
  PRICE_MAX,
  onToggle,
  onRemove,
  onApply,
  onReset,
  onPriceMinChange,
  onPriceMaxChange,
  onPriceMinInputChange,
  onPriceMaxInputChange,
  onClose,
}: DesktopFilterSidebarProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    price: true,
    availability: true,
  });

  useEffect(() => {
    if (!onClose) return;
    const close = onClose;
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (target instanceof HTMLElement && target.closest('.catalog-filter-btn')) return;
      if (wrapRef.current && !wrapRef.current.contains(target)) close();
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const SLIDER_PAD = 24;

  const getPointerPct = useCallback((e: React.PointerEvent | PointerEvent) => {
    if (!sliderRef.current) return 0;
    const rect = sliderRef.current.getBoundingClientRect();
    const trackWidth = rect.width - SLIDER_PAD * 2;
    return clamp(((e.clientX - rect.left - SLIDER_PAD) / trackWidth) * 100, 0, 100);
  }, []);

  function onPointerDown(handle: 'min' | 'max') {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(handle);
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const p = getPointerPct(e);
    const v = pctToVal(p, PRICE_MIN, PRICE_MAX);
    if (dragging === 'min') onPriceMinChange(clamp(v, PRICE_MIN, priceMax - 100));
    else onPriceMaxChange(clamp(v, priceMin + 100, PRICE_MAX));
  }

  function onPointerUp() { setDragging(null); }

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const minPct = valToPct(priceMin, PRICE_MIN, PRICE_MAX);
  const maxPct = valToPct(priceMax, PRICE_MIN, PRICE_MAX);

  const selectedChips = useMemo(() => {
    const chips: { key: string; val: string; label: string }[] = [];
    for (const [k, vals] of Object.entries(applied)) {
      for (const v of vals) {
        let label = v;
        if (k === 'priceMin') label = `Min ₹${parseInt(v).toLocaleString('en-IN')}`;
        else if (k === 'priceMax') label = `Max ₹${parseInt(v).toLocaleString('en-IN')}`;
        else if (k === 'availability') label = v;
        chips.push({ key: k, val: v, label });
      }
    }
    return chips;
  }, [applied]);

  return (
    <div className="kb-sidebar-wrap" ref={wrapRef}>
      <div className="kb-sidebar">
        <div className="kb-sidebar-head">
          <span className="kb-sidebar-title">Filters</span>
        </div>

        <div className="kb-sidebar-body">

          {/* ── Price Range ── */}
          <div className="kb-sidebar-section">
            <button type="button" className="kb-sidebar-section-trigger" onClick={() => toggleSection('price')}>
              <span className="kb-sidebar-section-label">Price Range</span>
              <span className={`kb-sidebar-chevron${openSections.price ? ' open' : ''}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
              </span>
            </button>
            <div className={`kb-sidebar-section-body${openSections.price ? ' open' : ''}`}>
              <div className="kb-sidebar-section-inner">
                <div className="kb-sidebar-price-display">
                  <span>{fmtPrice(priceMin)}</span>
                  <span className="kb-sidebar-price-sep">—</span>
                  <span>{priceMax >= PRICE_MAX ? `${fmtPrice(PRICE_MAX)}+` : fmtPrice(priceMax)}</span>
                </div>
                <div
                  className="kb-sidebar-slider"
                  ref={sliderRef}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerLeave={onPointerUp}
                >
                  <div className="kb-sidebar-track-wrap">
                    <div className="kb-sidebar-track">
                      <div className="kb-sidebar-track-fill" style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }} />
                    </div>
                    <div className="kb-sidebar-handle" style={{ left: `${minPct}%` }} onPointerDown={onPointerDown('min')} />
                    <div className="kb-sidebar-handle" style={{ left: `${maxPct}%` }} onPointerDown={onPointerDown('max')} />
                  </div>
                </div>
                <div className="kb-sidebar-inputs">
                  <div className="kb-sidebar-input-wrap">
                    <span className="kb-sidebar-input-prefix">₹</span>
                    <input type="text" className="kb-sidebar-input" inputMode="numeric" value={priceMin.toLocaleString('en-IN')} onChange={(e) => onPriceMinInputChange(e.target.value)} aria-label="Minimum price" />
                  </div>
                  <span className="kb-sidebar-price-sep">—</span>
                  <div className="kb-sidebar-input-wrap">
                    <span className="kb-sidebar-input-prefix">₹</span>
                    <input type="text" className="kb-sidebar-input" inputMode="numeric" value={priceMax >= PRICE_MAX ? `${PRICE_MAX.toLocaleString('en-IN')}+` : priceMax.toLocaleString('en-IN')} onChange={(e) => onPriceMaxInputChange(e.target.value)} aria-label="Maximum price" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Availability ── */}
          <div className="kb-sidebar-section">
            <button type="button" className="kb-sidebar-section-trigger" onClick={() => toggleSection('availability')}>
              <span className="kb-sidebar-section-label">Availability</span>
              <span className={`kb-sidebar-chevron${openSections.availability ? ' open' : ''}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
              </span>
            </button>
            <div className={`kb-sidebar-section-body${openSections.availability ? ' open' : ''}`}>
              <div className="kb-sidebar-section-inner">
                {AVAILABILITY.map((a) => {
                  const active = (pending.availability || []).includes(a);
                  return (
                    <button key={a} type="button" className={`kb-sidebar-option${active ? ' active' : ''}`} onClick={() => onToggle('availability', a)}>
                      <span className="kb-sidebar-check">{active ? '☑' : '☐'}</span>
                      <span className="kb-sidebar-option-label">{a}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* ── Selected chips ── */}
        {selectedChips.length > 0 && (
          <div className="kb-sidebar-chips">
            <div className="kb-sidebar-chips-header">Selected</div>
            <div className="kb-sidebar-chips-items">
              {selectedChips.map((c) => (
                <span key={`${c.key}-${c.val}`} className="kb-sidebar-chip">
                  <span>{c.label}</span>
                  <button type="button" className="kb-sidebar-chip-x" onClick={() => onRemove(c.key, c.val)} aria-label={`Remove ${c.label}`}>×</button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="kb-sidebar-foot">
          <button type="button" className="btn-secondary" onClick={onReset}>Reset</button>
          <button type="button" className="btn-primary" onClick={onApply}>Apply</button>
        </div>
      </div>
    </div>
  );
}
