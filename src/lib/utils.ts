/**
 * Shared utility helpers for the Keydir app.
 * Exports: cn(), formatPrice(), toNum(), clamp(), computeEffectivePrice(),
 * getBestCoupon(), slugify(), timeAgo(), formatDate(), formatCouponDiscount(),
 * availability/legacy converters, unique(), extractJsonArray(), uploadFile().
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return parseFloat(v);
  if (v && typeof v === 'object' && 'toNumber' in v) return (v as { toNumber(): number }).toNumber();
  return 0;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function computeEffectivePrice(totalPrice: number, coupons: { discountType: string; discountValue: number; enabled: boolean }[]): number {
  let best = totalPrice;
  for (const c of coupons) {
    if (!c.enabled) continue;
    let after: number;
    if (c.discountType === 'percentage') {
      after = Math.round(totalPrice * (1 - c.discountValue / 100));
    } else if (c.discountType === 'flat') {
      after = totalPrice - c.discountValue;
    } else {
      continue;
    }
    if (after < best) best = after;
  }
  return Math.max(0, best);
}

type CouponInput = { discountType: string; discountValue: number; enabled?: boolean };

export function getBestCoupon<T extends CouponInput>(coupons: T[], basePrice: number): T | null {
  let best: T | null = null;
  let bestPrice = Infinity;
  for (const c of coupons) {
    if (c.enabled === false) continue;
    let price = basePrice;
    switch (c.discountType) {
      case 'percentage': price = basePrice - basePrice * (c.discountValue / 100); break;
      case 'fixed': price = basePrice - c.discountValue; break;
    }
    if (price < bestPrice) { bestPrice = price; best = c; }
  }
  return best;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function availabilityToLegacy(a: string): string {
  const map: Record<string, string> = {
    IN_STOCK: 'in_stock',
    PREORDER: 'preorder',
    GROUP_BUY: 'group_buy',
    COMING_SOON: 'coming_soon',
    OUT_OF_STOCK: 'out_of_stock',
  };
  return map[a] || 'in_stock';
}

export function legacyToAvailability(status: string): 'IN_STOCK' | 'PREORDER' | 'GROUP_BUY' | 'COMING_SOON' | 'OUT_OF_STOCK' {
  const map: Record<string, 'IN_STOCK' | 'PREORDER' | 'GROUP_BUY' | 'COMING_SOON' | 'OUT_OF_STOCK'> = {
    in_stock: 'IN_STOCK',
    preorder: 'PREORDER',
    group_buy: 'GROUP_BUY',
    coming_soon: 'COMING_SOON',
    out_of_stock: 'OUT_OF_STOCK',
  };
  return map[status] || 'IN_STOCK';
}

export function formatDate(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatCouponDiscount(coupon: { discountType: string; discountValue: number }): string {
  if (coupon.discountType === 'percentage') return `${coupon.discountValue}% OFF`;
  if (coupon.discountType === 'fixed' || coupon.discountType === 'flat') return `${formatPrice(coupon.discountValue)} OFF`;
  if (coupon.discountType === 'shipping' || coupon.discountType === 'free_shipping') return 'FREE SHIPPING';
  return 'FREE SHIPPING';
}

export function unique<T>(arr: (T | null | undefined)[]): T[] {
  return [...new Set(arr.filter((v): v is T => v != null && v !== ''))];
}

export function extractJsonArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.filter((v): v is string => typeof v === 'string');
  return [];
}

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
}

export async function uploadFile(file: File, dir?: string): Promise<UploadResult> {
  const fd = new FormData();
  fd.append('file', file);
  if (dir) fd.append('dir', dir);
  const r = await fetch('/api/upload', { method: 'POST', body: fd });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Upload failed');
  return d;
}
