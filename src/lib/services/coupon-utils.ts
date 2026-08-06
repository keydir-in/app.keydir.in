/**
 * Pure vendor-coupon helpers: validation, activation rules, ordering.
 * No prisma import so client components can use these safely.
 */
export const COUPON_DISCOUNT_TYPES = ['percentage', 'fixed', 'shipping'] as const;
export type CouponDiscountType = (typeof COUPON_DISCOUNT_TYPES)[number];

export interface CouponInput {
  id?: string;
  code: string;
  title: string;
  description: string;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string;
  enabled: boolean;
  priority: number;
  affiliateLink: string;
}

/**
 * A coupon is active when it is enabled and inside its validity window.
 * Used by both the public product page and the admin preview so the two
 * always agree.
 */
export function isCouponActive(
  c: { enabled?: boolean; startDate?: Date | string | null; endDate?: Date | string | null },
  now: Date = new Date(),
): boolean {
  if (c.enabled === false) return false;
  if (c.startDate && new Date(c.startDate) > now) return false;
  if (c.endDate && new Date(c.endDate) < now) return false;
  return true;
}

export function sortCouponsByPriority<T extends { priority?: number | null; discountValue?: number | null }>(a: T, b: T): number {
  const pa = a.priority ?? 0;
  const pb = b.priority ?? 0;
  if (pa !== pb) return pb - pa;
  return (b.discountValue ?? 0) - (a.discountValue ?? 0);
}

export interface DisplayCoupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  enabled: boolean;
  title?: string | null;
  description?: string | null;
  priority?: number | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  affiliateLink?: string | null;
  minimumOrderAmount?: number;
  expiryDate?: Date | string | null;
  couponUrl?: string | null;
  source: 'vendor' | 'product';
}

/**
 * Merges a vendor's active coupons in front of a product's own coupons, so
 * every product automatically inherits vendor-wide promotions. Sorted so the
 * highest-priority active coupon comes first.
 */
export function mergeVendorCoupons(
  productCoupons: Array<Omit<DisplayCoupon, 'source'>>,
  vendorCoupons: Array<Omit<DisplayCoupon, 'source'>>,
  now: Date = new Date(),
): DisplayCoupon[] {
  const product = productCoupons.map((c) => ({ ...c, source: 'product' as const }));
  const vendor = vendorCoupons.filter((c) => isCouponActive(c, now)).map((c) => ({ ...c, source: 'vendor' as const }));
  return [...vendor, ...product].sort(sortCouponsByPriority);
}

export interface BestDeal {
  finalPrice: number;
  couponCode: string | null;
}

type DealCoupon = {
  code: string;
  discountType: string;
  discountValue: number;
  enabled?: boolean;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  expiryDate?: Date | string | null;
};

/**
 * Shared price resolver: the lowest final payable price (regular vs best active
 * coupon, whichever is lower) plus the winning coupon code. Single source of
 * truth for every surface that shows a price — listing cards, product hero,
 * vendor cards, and compare all route through this so they never disagree.
 */
export function resolveBestDeal(totalPrice: number, coupons: DealCoupon[], now: Date = new Date()): BestDeal {
  let best: BestDeal = { finalPrice: totalPrice, couponCode: null };
  for (const c of coupons) {
    if (!isCouponActive({ enabled: c.enabled, startDate: c.startDate, endDate: c.endDate ?? c.expiryDate }, now)) continue;
    let after: number;
    if (c.discountType === 'percentage') after = Math.round(totalPrice * (1 - c.discountValue / 100));
    else if (c.discountType === 'flat' || c.discountType === 'fixed') after = totalPrice - c.discountValue;
    else continue;
    if (after < best.finalPrice) best = { finalPrice: Math.max(0, after), couponCode: c.code };
  }
  return best;
}

export function validateCoupons(coupons: CouponInput[]): string | null {
  for (const c of coupons) {
    if (!c.code.trim()) return 'Coupon code is required';
    if (!COUPON_DISCOUNT_TYPES.includes(c.discountType as CouponDiscountType)) return 'Invalid discount type';
    if (c.discountValue < 0) return `Discount value cannot be negative (${c.code})`;
    if (c.startDate && c.endDate && new Date(c.endDate) < new Date(c.startDate)) {
      return `End date must be after start date (${c.code})`;
    }
  }
  return null;
}
