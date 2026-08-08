'use client';

/**
 * Shared filter panel core. Renders price range slider, availability
 * checkboxes, selected chips, and apply/reset actions. Used by both the
 * desktop sidebar and mobile drawer shells via the `variant` prop; shared
 * markup uses kb-filter-* classes, per-variant layout is handled in CSS.
 */
import { useState, useRef, useMemo, useCallback } from 'react';
import { clamp } from '@/lib/utils';
import { AVAILABILITY_KEYS, AVAILABILITY_MAP } from '@/lib/constants';

export interface FilterPanelProps {
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

interface FilterPanelCoreProps extends FilterPanelProps {
  variant: 'sidebar' | 'drawer';
}

const AVAILABILITY = AVAILABILITY_KEYS.map((k) => AVAILABILITY_MAP[k].label);

function fmtPrice(n: number): string {
  return '₹' + n.toLocaleString('en-IN');
}

function pctToVal(pct: number, PRICE_MIN: number, PRICE_MAX: number) {
  return Math.round(PRICE_MIN + (pct / 100) * (PRICE_MAX - PRICE_MIN));
}

function valToPct(val: number, PRICE_MIN: number, PRICE_MAX: number) {
  return ((val - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
}

const CHEVRON_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export default function FilterPanel({
  variant,
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
}: FilterPanelCoreProps) {
  const isDrawer = variant === 'drawer';
  const SLIDER_PAD = isDrawer ? 16 : 24;
  const sliderRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    price: true,
    availability: true,
  });

  const getPointerPct = useCallback((e: React.PointerEvent | PointerEvent) => {
    if (!sliderRef.current) return 0;
    const rect = sliderRef.current.getBoundingClientRect();
    const trackWidth = rect.width - SLIDER_PAD * 2;
    return clamp(((e.clientX - rect.left - SLIDER_PAD) / trackWidth) * 100, 0, 100);
  }, [SLIDER_PAD]);

  function onPointerDown(handle: 'min' | 'max') {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(handle);
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const v = pctToVal(getPointerPct(e), PRICE_MIN, PRICE_MAX);
    if (dragging === 'min') onPriceMinChange(clamp(v, PRICE_MIN, priceMax - 100));
    else onPriceMaxChange(clamp(v, priceMin + 100, PRICE_MAX));
  }

  function onPointerUp() { setDragging(null); }

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const minPct = valToPct(priceMin, PRICE_MIN, PRICE_MAX);
  const maxPct = valToPct(priceMax, PRICE_MIN, PRICE_MAX);
  const hasActivePrice = priceMin > PRICE_MIN || priceMax < PRICE_MAX;

  const selectedChips = useMemo(() => {
    const chips: { key: string; val: string; label: string }[] = [];
    for (const [k, vals] of Object.entries(applied)) {
      for (const v of vals) {
        let label = v;
        if (k === 'min') label = `Min ₹${parseInt(v, 10).toLocaleString('en-IN')}`;
        else if (k === 'max') label = `Max ₹${parseInt(v, 10).toLocaleString('en-IN')}`;
        else if (k === 'availability') label = v;
        chips.push({ key: k, val: v, label });
      }
    }
    return chips;
  }, [applied]);

  const chips = selectedChips.length > 0 && (
    <div className="kb-filter-chips">
      {!isDrawer && <div className="kb-filter-chips-header">Selected</div>}
      <div className="kb-filter-chips-items">
        {selectedChips.map((c) => (
          <span key={`${c.key}-${c.val}`} className="kb-filter-chip">
            <span>{c.label}</span>
            <button type="button" className="kb-filter-chip-x" onClick={() => onRemove(c.key, c.val)} aria-label={`Remove ${c.label}`}>×</button>
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`kb-filter kb-filter--${variant}`}>
      {isDrawer && chips}

      <div className="kb-filter-body">
        {/* ── Price Range ── */}
        <div className="kb-filter-section">
          <button type="button" className="kb-filter-section-trigger" onClick={() => toggleSection('price')}>
            <span className="kb-filter-section-label">Price Range</span>
            {isDrawer && hasActivePrice && <span className="kb-filter-dot" />}
            <span className={`kb-filter-chevron${openSections.price ? ' open' : ''}`}>{CHEVRON_ICON}</span>
          </button>
          <div className={`kb-filter-section-body${openSections.price ? ' open' : ''}`}>
            <div className="kb-filter-section-inner">
              <div className="kb-filter-price-display">
                <span>{fmtPrice(priceMin)}</span>
                <span className="kb-filter-sep">—</span>
                <span>{priceMax >= PRICE_MAX ? `${fmtPrice(PRICE_MAX)}+` : fmtPrice(priceMax)}</span>
              </div>
              <div
                className="kb-filter-slider"
                ref={sliderRef}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
              >
                <div className="kb-filter-track-wrap">
                  <div className="kb-filter-track">
                    <div className="kb-filter-track-fill" style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }} />
                  </div>
                  <div className="kb-filter-handle" style={{ left: `${minPct}%` }} onPointerDown={onPointerDown('min')} />
                  <div className="kb-filter-handle" style={{ left: `${maxPct}%` }} onPointerDown={onPointerDown('max')} />
                </div>
              </div>
              <div className="kb-filter-inputs">
                <div className="kb-filter-input-wrap">
                  <span className="kb-filter-input-prefix">₹</span>
                  <input type="text" className="kb-filter-input" inputMode="numeric" value={priceMin.toLocaleString('en-IN')} onChange={(e) => onPriceMinInputChange(e.target.value)} aria-label="Minimum price" />
                </div>
                <span className="kb-filter-sep">—</span>
                <div className="kb-filter-input-wrap">
                  <span className="kb-filter-input-prefix">₹</span>
                  <input type="text" className="kb-filter-input" inputMode="numeric" value={priceMax >= PRICE_MAX ? `${PRICE_MAX.toLocaleString('en-IN')}+` : priceMax.toLocaleString('en-IN')} onChange={(e) => onPriceMaxInputChange(e.target.value)} aria-label="Maximum price" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Availability ── */}
        <div className="kb-filter-section">
          <button type="button" className="kb-filter-section-trigger" onClick={() => toggleSection('availability')}>
            <span className="kb-filter-section-label">Availability</span>
            {isDrawer && ((pending.availability?.length || 0) + (applied.availability?.length || 0)) > 0 && <span className="kb-filter-dot" />}
            <span className={`kb-filter-chevron${openSections.availability ? ' open' : ''}`}>{CHEVRON_ICON}</span>
          </button>
          <div className={`kb-filter-section-body${openSections.availability ? ' open' : ''}`}>
            <div className="kb-filter-section-inner">
              {AVAILABILITY.map((a) => {
                const active = (pending.availability || []).includes(a);
                return (
                  <button key={a} type="button" className={`kb-filter-option${active ? ' active' : ''}`} onClick={() => onToggle('availability', a)}>
                    <span className="kb-filter-check">{active ? '☑' : '☐'}</span>
                    <span className="kb-filter-option-label">{a}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {!isDrawer && chips}

      {/* ── Actions ── */}
      <div className="kb-filter-foot">
        <button type="button" className="btn-secondary" onClick={onReset}>Reset</button>
        <button type="button" className="btn-primary" onClick={onApply}>Apply</button>
      </div>
    </div>
  );
}
