'use client';

/**
 * Price history chart. Custom pixel-accurate SVG styled as a financial
 * terminal: near-black panel, thin grid, glow lines with markers, change
 * indicators, crosshair + custom tooltip (stock/coupon/last-updated),
 * summary modules, segmented time range, and hover/click legend chips.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatPrice, toNum, formatDate, formatDateShort } from '@/lib/utils';
import {
  buildUnifiedTimeline, buildVendorGroups, buildDenseSeries, segmentDense, getTooltipData,
  type PricePoint,
} from '@/lib/chart/price-chart-math';

interface PriceHistoryChartProps {
  history: PricePoint[];
  vendorColors?: Record<string, string>;
  coupons?: Record<string, string>;
}

type TimeRange = '30D' | '3M' | '6M' | '1Y' | 'ALL';

const TIME_RANGES: { label: string; value: TimeRange; days: number | null }[] = [
  { label: '30D', value: '30D', days: 30 },
  { label: '3M', value: '3M', days: 90 },
  { label: '6M', value: '6M', days: 180 },
  { label: '1Y', value: '1Y', days: 365 },
  { label: 'ALL', value: 'ALL', days: null },
];

const CHART_H = 460;
const PAD = { l: 64, r: 20, t: 26, b: 42 };
const NICE_STEPS = [50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000];
const MAX_TICKS = 6;

interface TooltipVendorView {
  vendor: string;
  price: number;
  color: string;
  y: number;
  stockStatus: string | null;
  recordedAt: Date | null;
}
interface TooltipState {
  x: number;
  y: number;
  date: Date;
  vendors: TooltipVendorView[];
}

function niceStep(range: number): number {
  const raw = range / (MAX_TICKS - 1);
  return NICE_STEPS.find((n) => n >= raw) ?? NICE_STEPS[NICE_STEPS.length - 1];
}

function formatAxisDate(d: Date, range: TimeRange): string {
  if (range === '1Y' || range === 'ALL') {
    return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }).toUpperCase();
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function PriceHistoryChart({ history, vendorColors = {}, coupons = {} }: PriceHistoryChartProps) {
  const [activeRange, setActiveRange] = useState<TimeRange>('6M');
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [focused, setFocused] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(0);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const filteredHistory = useMemo(() => {
    const range = TIME_RANGES.find((r) => r.value === activeRange);
    if (!range?.days) return history;
    const cutoff = new Date(now - range.days * 24 * 60 * 60 * 1000);
    const filtered = history.filter((h) => new Date(h.recordedAt) >= cutoff);
    return filtered.length > 0 ? filtered : history;
  }, [history, activeRange, now]);

  const vendorGroups = useMemo(
    () => buildVendorGroups(filteredHistory, vendorColors),
    [filteredHistory, vendorColors]
  );

  const unifiedDates = useMemo(() => buildUnifiedTimeline(filteredHistory), [filteredHistory]);

  const dateKeyToIndex = useMemo(() => {
    const map = new Map<number, number>();
    unifiedDates.forEach((d, i) => map.set(d, i));
    return map;
  }, [unifiedDates]);

  const denseSeries = useMemo(
    () =>
      vendorGroups.map((group) => ({
        vendor: group.vendor,
        color: group.color,
        dense: buildDenseSeries(group, dateKeyToIndex),
      })),
    [vendorGroups, dateKeyToIndex]
  );

  const changeIdx = useMemo(() => {
    const map = new Map<string, Set<number>>();
    for (const s of denseSeries) {
      const set = new Set<number>();
      let prevPrice: number | null = null;
      for (const pt of s.dense) {
        if (pt) {
          if (prevPrice !== null && pt.price !== prevPrice) set.add(pt.dateIndex);
          prevPrice = pt.price;
        }
      }
      map.set(s.vendor, set);
    }
    return map;
  }, [denseSeries]);

  const { yMin, yMax } = useMemo(() => {
    let min = Infinity, max = 0;
    for (const h of filteredHistory) {
      const p = toNum(h.price);
      if (p < min) min = p;
      if (p > max) max = p;
    }
    if (!isFinite(min)) min = 0;
    const span = Math.max(max - min, 400);
    const lo = min - span * 0.12;
    const hi = max + span * 0.12;
    const step = niceStep(hi - lo);
    const yMin = Math.max(0, Math.floor(lo / step) * step);
    const yMax = Math.max(yMin + step * (MAX_TICKS - 1), Math.ceil(hi / step) * step);
    return { yMin, yMax };
  }, [filteredHistory]);

  const yRange = Math.max(yMax - yMin, 1);
  const chartW = Math.max(width - PAD.l - PAD.r, 0);
  const chartH = CHART_H - PAD.t - PAD.b;

  const toXUnified = useCallback(
    (dateIndex: number) => PAD.l + (dateIndex / Math.max(unifiedDates.length - 1, 1)) * chartW,
    [unifiedDates.length, chartW]
  );

  const toY = useCallback(
    (p: number) => PAD.t + chartH - ((p - yMin) / yRange) * chartH,
    [yMin, yRange, chartH]
  );

  const ticks = useMemo(() => {
    const step = niceStep(yMax - yMin);
    const list: number[] = [];
    for (let v = yMin; v <= yMax + step / 2; v += step) list.push(v);
    if (list[list.length - 1] !== yMax) list.push(yMax);
    return list;
  }, [yMin, yMax]);

  const xLabels = useMemo(() => {
    const maxLabels = Math.max(2, Math.floor(chartW / 110));
    if (unifiedDates.length <= maxLabels) {
      return unifiedDates.map((d, i) => ({ i, label: formatAxisDate(new Date(d), activeRange) }));
    }
    const step = Math.max(1, Math.floor((unifiedDates.length - 1) / (maxLabels - 1)));
    const labels: { i: number; label: string }[] = [];
    for (let i = 0; i < unifiedDates.length; i += step) {
      labels.push({ i, label: formatAxisDate(new Date(unifiedDates[i]), activeRange) });
    }
    const last = unifiedDates.length - 1;
    if (labels[labels.length - 1].i !== last) {
      labels.push({ i: last, label: formatAxisDate(new Date(unifiedDates[last]), activeRange) });
    }
    return labels;
  }, [unifiedDates, activeRange, chartW]);

  const summary = useMemo(() => {
    let min = Infinity, max = 0, sum = 0;
    for (const h of filteredHistory) {
      const p = toNum(h.price);
      if (p < min) min = p;
      if (p > max) max = p;
      sum += p;
    }
    const count = filteredHistory.length;
    const last = history.reduce<PricePoint | null>((best, h) => {
      const t = new Date(h.recordedAt).getTime();
      return !best || t > new Date(best.recordedAt).getTime() ? h : best;
    }, null);
    return {
      lowest: isFinite(min) ? min : null,
      highest: count ? max : null,
      average: count ? Math.round(sum / count) : null,
      current: last ? toNum(last.price) : null,
      updated: last ? new Date(last.recordedAt) : null,
    };
  }, [filteredHistory, history]);

  const visibleVendors = useMemo(
    () => denseSeries.filter((s) => !hidden.has(s.vendor)),
    [denseSeries, hidden]
  );
  const sparse = filteredHistory.length > 0 && filteredHistory.length < 6;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const el = svgRef.current;
      if (!el || unifiedDates.length === 0) return;
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const ratio = (mouseX - PAD.l) / chartW;
      if (ratio < -0.03 || ratio > 1.03) {
        setTooltip(null);
        return;
      }
      const idx = Math.max(0, Math.min(unifiedDates.length - 1, Math.round(ratio * (unifiedDates.length - 1))));
      const date = new Date(unifiedDates[idx]);
      const x = toXUnified(idx);
      const vendors = getTooltipData(denseSeries, idx, date, toY)
        .filter((v) => !hidden.has(v.vendor))
        .map((v) => ({
          vendor: v.vendor,
          price: v.price,
          color: v.color,
          y: v.y,
          stockStatus: v.stockStatus ?? null,
          recordedAt: v.recordedAt ?? null,
        }));
      setTooltip({ x, y: mouseY, date, vendors });
    },
    [unifiedDates, denseSeries, chartW, toXUnified, toY, hidden]
  );

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  const toggleVendor = useCallback((v: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  }, []);

  if (history.length === 0) {
    return <div className="spec-empty">No price history available yet.</div>;
  }

  return (
    <div className="price-chart-container">
      <div className="price-chart-summary">
        <div className="pcs-mod">
          <span className="pcs-label">LOWEST</span>
          <span className="pcs-value">{summary.lowest != null ? formatPrice(summary.lowest) : '—'}</span>
        </div>
        <div className="pcs-mod">
          <span className="pcs-label">HIGHEST</span>
          <span className="pcs-value">{summary.highest != null ? formatPrice(summary.highest) : '—'}</span>
        </div>
        <div className="pcs-mod">
          <span className="pcs-label">AVERAGE</span>
          <span className="pcs-value">{summary.average != null ? formatPrice(summary.average) : '—'}</span>
        </div>
        <div className="pcs-mod pcs-mod--live">
          <span className="pcs-label">CURRENT</span>
          <span className="pcs-value">{summary.current != null ? formatPrice(summary.current) : '—'}</span>
        </div>
        <div className="pcs-mod pcs-mod--wide">
          <span className="pcs-label">UPDATED</span>
          <span className="pcs-value pcs-value--date">
            {summary.updated
              ? formatDateShort(new Date(summary.updated)).toUpperCase()
              : '—'}
          </span>
        </div>
      </div>

      <div className="price-chart-toolbar">
        <div className="price-chart-seg" role="group" aria-label="Time range">
          {TIME_RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              className={activeRange === r.value ? 'is-active' : ''}
              onClick={() => setActiveRange(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="price-chart-wrap" ref={wrapRef}>
        {width > 0 && (
          <svg
            ref={svgRef}
            width={width}
            height={CHART_H}
            className="price-chart-svg"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <filter id="pc-blur" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" />
              </filter>
            </defs>

            <g key={activeRange} className="pc-render">
              {ticks.map((v) => (
                <g key={v}>
                  <line x1={PAD.l} y1={toY(v)} x2={width - PAD.r} y2={toY(v)} className="pc-grid-h" />
                  <text x={PAD.l - 10} y={toY(v) + 4} className="pc-ylabel">
                    {formatPrice(v)}
                  </text>
                </g>
              ))}

              {xLabels.map((l) => (
                <g key={l.i}>
                  <line x1={toXUnified(l.i)} y1={PAD.t} x2={toXUnified(l.i)} y2={PAD.t + chartH} className="pc-grid-v" />
                  <text x={toXUnified(l.i)} y={CHART_H - 14} className="pc-xlabel">
                    {l.label}
                  </text>
                </g>
              ))}

              {visibleVendors.map(({ vendor, dense, color }) => {
                const segments = segmentDense(dense);
                const dim = focused !== null && focused !== vendor;
                const chg = changeIdx.get(vendor);
                return (
                  <g key={vendor} className={dim ? 'pc-line-group is-dim' : 'pc-line-group'}>
                    {segments.map((seg, si) => {
                      const pts = seg.map((pt) => `${toXUnified(pt.dateIndex)},${toY(pt.price)}`).join(' ');
                      return (
                        <g key={si}>
                          <polyline className="pc-line-glow" points={pts} stroke={color.line} filter="url(#pc-blur)" />
                          <polyline className="pc-line" points={pts} stroke={color.line} />
                        </g>
                      );
                    })}
                    {dense.map((pt, i) =>
                      pt ? (
                        <g key={i}>
                          <circle
                            cx={toXUnified(pt.dateIndex)}
                            cy={toY(pt.price)}
                            className={chg && chg.has(pt.dateIndex) ? 'pc-pt is-chg' : 'pc-pt'}
                            fill={color.line}
                            stroke="var(--dark-card-bg)"
                            strokeWidth={1.5}
                          />
                          {chg && chg.has(pt.dateIndex) && (
                            <line
                              className="pc-pt-tick"
                              x1={toXUnified(pt.dateIndex)}
                              y1={toY(pt.price) + 6}
                              x2={toXUnified(pt.dateIndex)}
                              y2={toY(pt.price) + 11}
                              stroke={color.line}
                            />
                          )}
                        </g>
                      ) : null
                    )}
                  </g>
                );
              })}

              {tooltip && tooltip.vendors.length > 0 && (
                <g className="pc-crosshair">
                  <line x1={tooltip.x} y1={PAD.t} x2={tooltip.x} y2={PAD.t + chartH} className="pc-crosshair-v" />
                  {tooltip.vendors.map((v) => (
                    <g key={v.vendor}>
                      <line x1={PAD.l} y1={v.y} x2={width - PAD.r} y2={v.y} className="pc-crosshair-h" />
                      <circle cx={tooltip.x} cy={v.y} className="pc-hover-pt" fill={v.color} stroke="var(--dark-card-bg)" strokeWidth={2} />
                    </g>
                  ))}
                </g>
              )}
            </g>
          </svg>
        )}

        <div className="price-chart-vignette" />

        {sparse && (
          <div className="price-chart-empty-overlay">
            <p>More historical pricing data will appear as additional price updates are collected.</p>
          </div>
        )}

        {vendorGroups.length > 0 && visibleVendors.length === 0 && (
          <div className="price-chart-empty-overlay">
            <p>All series hidden — toggle a vendor in the legend.</p>
          </div>
        )}

        {tooltip && width > 0 && (
          <div
            className="price-chart-tooltip"
            style={{
              left: tooltip.x,
              top: Math.min(Math.max(tooltip.y - 8, 8), CHART_H - 170),
              transform: tooltip.x > width - 210 ? 'translateX(-100%)' : 'translateX(-50%)',
            }}
          >
            <div className="pc-tooltip-head">
              <span className="pc-tooltip-date">{formatDate(tooltip.date)}</span>
              <span className="pc-tooltip-range">{activeRange}</span>
            </div>
            {tooltip.vendors.map((v) => (
              <div key={v.vendor} className="pc-tooltip-row">
                <span className="pc-tooltip-swatch" style={{ background: v.color, boxShadow: `0 0 8px ${v.color}` }} />
                <div className="pc-tooltip-top">
                  <span className="pc-tooltip-name">{v.vendor}</span>
                  <span className="pc-tooltip-price" style={{ color: v.color }}>{formatPrice(v.price)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {vendorGroups.length > 0 && (
        <div className="price-chart-legend">
          {vendorGroups.map(({ vendor, color }) => {
            const isHidden = hidden.has(vendor);
            const isFocused = focused === vendor && !isHidden;
            return (
              <button
                key={vendor}
                type="button"
                className={`pch-chip${isFocused ? ' is-focused' : ''}${isHidden ? ' is-hidden' : ''}`}
                style={{ ['--chip-color' as string]: color.line }}
                onClick={() => toggleVendor(vendor)}
                onMouseEnter={() => setFocused(vendor)}
                onMouseLeave={() => setFocused(null)}
                aria-pressed={!isHidden}
              >
                <span className="pch-swatch" style={{ background: color.line, boxShadow: `0 0 8px ${color.line}` }} />
                <span className="pch-name">{vendor}</span>
                {coupons[vendor] && <span className="pch-coupon">🏷</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
