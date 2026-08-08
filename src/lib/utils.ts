/**
 * Shared utility helpers for the Keydir app.
 * Exports: formatPrice(), toNum(), clamp(), getBestCoupon(), slugify(),
 * formatDate(), formatCouponDiscount(), unique(), extractJsonArray().
 */

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

type CouponInput = { discountType: string; discountValue: number; enabled?: boolean };

export function getBestCoupon<T extends CouponInput>(coupons: T[], basePrice: number): T | null {
  let best: T | null = null;
  let bestPrice = Infinity;
  for (const c of coupons) {
    if (c.enabled === false) continue;
    let price = basePrice;
    switch (c.discountType) {
      case 'percentage': price = basePrice - basePrice * (c.discountValue / 100); break;
      case 'flat':
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

export function formatDate(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatDateShort(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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
