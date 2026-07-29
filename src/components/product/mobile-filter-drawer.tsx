'use client';

/**
 * Mobile filter drawer — slide-out panel from the right with accordion
 * sections, circular slider handles, full-width tappable rows, and a
 * sticky action footer. Used on viewports ≤ 767px.
 */

import { useState, useRef, useMemo, useEffect } from 'react';
import { clamp } from '@/lib/utils';
import { AVAILABILITY_MAP } from '@/lib/constants';
import { X, ChevronDown } from 'lucide-react';

interface FilterOptions {
  priceMin: number;
  priceMax: number;
}

interface MobileFilterDrawerProps {
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
  onClose: () => void;
  isOpen: boolean;
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

const SLIDER_PAD = 16;

export default function MobileFilterDrawer({
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
  isOpen,
}: MobileFilterDrawerProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    price: true,
    availability: true,
  });

  useEffect(() => {
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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function getPointerPct(e: React.PointerEvent | PointerEvent) {
    if (!sliderRef.current) return 0;
    const rect = sliderRef.current.getBoundingClientRect();
    const trackWidth = rect.width - SLIDER_PAD * 2;
    return clamp(((e.clientX - rect.left - SLIDER_PAD) / trackWidth) * 100, 0, 100);
  }

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

  const hasActivePrice = priceMin > PRICE_MIN || priceMax < PRICE_MAX;

  return (
    <>
      <div className="kb-drawer-backdrop" onClick={onClose} />
      <div className={`kb-drawer${isOpen ? ' open' : ''}`} ref={wrapRef}>
        <div className="kb-drawer-head">
          <span className="kb-drawer-title">Filters</span>
          <button type="button" className="kb-drawer-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {selectedChips.length > 0 && (
          <div className="kb-drawer-chips">
            {selectedChips.map((c) => (
              <span key={`${c.key}-${c.val}`} className="kb-drawer-chip">
                <span>{c.label}</span>
                <button type="button" className="kb-drawer-chip-x" onClick={() => onRemove(c.key, c.val)} aria-label={`Remove ${c.label}`}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="kb-drawer-body">

          <div className="kb-drawer-section">
            <button type="button" className="kb-drawer-section-head" onClick={() => toggleSection('price')}>
              <span>Price Range</span>
              {hasActivePrice && <span className="kb-drawer-dot" />}
              <ChevronDown size={16} className={`kb-drawer-chevron${openSections.price ? ' open' : ''}`} />
            </button>
            <div className={`kb-drawer-section-body${openSections.price ? ' open' : ''}`}>
              <div className="kb-drawer-section-inner">
                <div className="kb-drawer-price-val">
                  <span>{fmtPrice(priceMin)}</span>
                  <span className="kb-drawer-sep">—</span>
                  <span>{priceMax >= PRICE_MAX ? `${fmtPrice(PRICE_MAX)}+` : fmtPrice(priceMax)}</span>
                </div>
                <div
                  className="kb-drawer-slider"
                  ref={sliderRef}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerLeave={onPointerUp}
                >
                  <div className="kb-drawer-track-wrap">
                    <div className="kb-drawer-track">
                      <div className="kb-drawer-track-fill" style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }} />
                    </div>
                    <div className="kb-drawer-handle" style={{ left: `${minPct}%` }} onPointerDown={onPointerDown('min')} />
                    <div className="kb-drawer-handle" style={{ left: `${maxPct}%` }} onPointerDown={onPointerDown('max')} />
                  </div>
                </div>
                <div className="kb-drawer-inputs">
                  <div className="kb-drawer-input-wrap">
                    <span className="kb-drawer-input-prefix">₹</span>
                    <input type="text" className="kb-drawer-input" inputMode="numeric" value={priceMin.toLocaleString('en-IN')} onChange={(e) => onPriceMinInputChange(e.target.value)} aria-label="Minimum price" />
                  </div>
                  <span className="kb-drawer-sep">—</span>
                  <div className="kb-drawer-input-wrap">
                    <span className="kb-drawer-input-prefix">₹</span>
                    <input type="text" className="kb-drawer-input" inputMode="numeric" value={priceMax >= PRICE_MAX ? `${PRICE_MAX.toLocaleString('en-IN')}+` : priceMax.toLocaleString('en-IN')} onChange={(e) => onPriceMaxInputChange(e.target.value)} aria-label="Maximum price" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="kb-drawer-section">
            <button type="button" className="kb-drawer-section-head" onClick={() => toggleSection('availability')}>
              <span>Availability</span>
              {((pending.availability?.length || 0) + (applied.availability?.length || 0)) > 0 && <span className="kb-drawer-dot" />}
              <ChevronDown size={16} className={`kb-drawer-chevron${openSections.availability ? ' open' : ''}`} />
            </button>
            <div className={`kb-drawer-section-body${openSections.availability ? ' open' : ''}`}>
              <div className="kb-drawer-section-inner">
                {AVAILABILITY.map((a) => {
                  const active = (pending.availability || []).includes(a);
                  return (
                    <button key={a} type="button" className={`kb-drawer-row${active ? ' active' : ''}`} onClick={() => onToggle('availability', a)}>
                      <span className="kb-drawer-check">{active ? '☑' : '☐'}</span>
                      <span className="kb-drawer-row-label">{a}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        <div className="kb-drawer-foot">
          <button type="button" className="btn-secondary" onClick={onReset}>Reset</button>
          <button type="button" className="btn-primary" onClick={onApply}>Apply</button>
        </div>
      </div>
    </>
  );
}
