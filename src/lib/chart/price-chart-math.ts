/**
 * Price chart utilities for multi-vendor price history visualization.
 * Provides point formatting, timeline building, vendor grouping, dense series construction, and tooltip data.
 * Exports: PricePoint, buildUnifiedTimeline, buildVendorGroups, buildDenseSeries, segmentDense, getTooltipData.
 */

import { toNum } from '@/lib/utils';

export interface PricePoint {
  price: number;
  recordedAt: Date;
  vendor?: string;
  stockStatus?: string;
}

const FALLBACK_PALETTE = [
  '#00FF6A', '#00E5FF', '#A855F7', '#FAFF00', '#FF3FA4', '#FF6B00', '#3B82F6',
];

const VENDOR_COLOR_MAP: Record<string, string> = {
  URX: '#00FF6A',
  XTRO: '#00E5FF',
  RYUGEAR: '#A855F7',
  KEYDIR: '#FAFF00',
  STACKKART: '#3B82F6',
  GENESIS: '#FF6B00',
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function toDateKey(d: Date): number {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt.getTime();
}

export function buildUnifiedTimeline(history: PricePoint[]): number[] {
  const dateSet = new Set<number>();
  for (const p of history) {
    dateSet.add(toDateKey(new Date(p.recordedAt)));
  }
  return Array.from(dateSet).sort((a, b) => a - b);
}

interface VendorGroup {
  vendor: string;
  points: PricePoint[];
  color: { line: string; area: string };
}

export function buildVendorGroups(
  filteredHistory: PricePoint[],
  vendorColors: Record<string, string>,
): VendorGroup[] {
  const map = new Map<string, PricePoint[]>();
  for (const p of filteredHistory) {
    const name = p.vendor || 'Unknown';
    if (!map.has(name)) map.set(name, []);
    map.get(name)!.push(p);
  }

  let fallbackIndex = 0;
  return Array.from(map.entries()).map(([vendor, points]) => {
    const configured = vendorColors[vendor] || VENDOR_COLOR_MAP[vendor];
    let hex: string;
    if (configured && /^#[0-9a-fA-F]{6}$/.test(configured)) {
      hex = configured;
    } else {
      hex = FALLBACK_PALETTE[fallbackIndex % FALLBACK_PALETTE.length];
      fallbackIndex++;
    }

    return {
      vendor,
      points: points.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()),
      color: { line: hex, area: hexToRgba(hex, 0.08) },
    };
  });
}

interface DensePoint {
  dateIndex: number;
  price: number;
  stockStatus?: string;
}

export function buildDenseSeries(
  group: VendorGroup,
  dateKeyToIndex: Map<number, number>,
): (DensePoint | null)[] {
  const dense: (DensePoint | null)[] = new Array(dateKeyToIndex.size).fill(null);
  for (const p of group.points) {
    const key = toDateKey(new Date(p.recordedAt));
    const idx = dateKeyToIndex.get(key);
    const price = toNum(p.price);
    if (idx !== undefined && price > 0) {
      dense[idx] = { dateIndex: idx, price, stockStatus: p.stockStatus };
    }
  }
  return dense;
}

export function segmentDense(dense: (DensePoint | null)[]): DensePoint[][] {
  const segments: DensePoint[][] = [];
  let current: DensePoint[] = [];
  for (const pt of dense) {
    if (pt) {
      current.push(pt);
    } else {
      if (current.length > 0) {
        segments.push(current);
        current = [];
      }
    }
  }
  if (current.length > 0) segments.push(current);
  return segments;
}

interface TooltipVendor {
  vendor: string;
  price: number;
  color: string;
  y: number;
  stockStatus?: string;
  recordedAt?: Date;
}

export function getTooltipData(
  denseSeries: { vendor: string; dense: (DensePoint | null)[]; color: { line: string } }[],
  dateIndex: number,
  date: Date,
  toY: (p: number) => number,
): TooltipVendor[] {
  const vendors: TooltipVendor[] = [];
  for (const s of denseSeries) {
    const pt = s.dense[dateIndex];
    if (pt && pt.price > 0) {
      vendors.push({
        vendor: s.vendor,
        price: pt.price,
        color: s.color.line,
        y: toY(pt.price),
        stockStatus: pt.stockStatus,
        recordedAt: date,
      });
    }
  }
  vendors.sort((a, b) => b.price - a.price);
  return vendors;
}
