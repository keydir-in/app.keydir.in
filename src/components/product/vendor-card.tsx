'use client';

/**
 * Vendor pricing card displaying price, shipping, availability, and
 * coupon details for a single vendor. Shows the vendor's highest-priority
 * active coupon, product coupons, variant options, savings for the
 * cheapest vendor, and a buy CTA.
 */

import { useState } from 'react';
import { formatPrice, toNum, formatCouponDiscount, getBestCoupon, timeAgo } from '@/lib/utils';
import { isCouponActive, sortCouponsByPriority } from '@/lib/services/coupon-utils';
import { AvailabilityBadge } from '@/components/shared/availability-badge';
import type { VendorProductWithVendor } from '@/types';

interface VendorCardProps {
  vendorProduct: VendorProductWithVendor;
}

function variantFields(v: { color: string[] | null; switches: string[] | null; keycaps: string[] | null }) {
  const fields: { label: string; values: string[] }[] = [];
  if (v.color?.length) fields.push({ label: 'Base Color', values: v.color });
  if (v.switches?.length) fields.push({ label: 'Switch', values: v.switches });
  if (v.keycaps?.length) fields.push({ label: 'Keycaps', values: v.keycaps });
  return fields;
}

/** Cheapest priced variant, preferring in-stock ones (fallback: any variant). */
function pickLowestVariant(variants: NonNullable<VendorProductWithVendor['variants']>) {
  const priced = variants.filter((v) => toNum(v.price) > 0);
  if (priced.length === 0) return null;
  const available = priced.filter((v) => v.stockStatus && v.stockStatus !== 'out_of_stock' && v.stockStatus !== 'discontinued');
  const pool = available.length > 0 ? available : priced;
  return [...pool].sort((a, b) => toNum(a.price) - toNum(b.price))[0] ?? null;
}

interface CouponLineProps {
  code: string;
  discount: string;
  discountType: string;
  copied: boolean;
  onCopy: () => void;
}

function CouponLine({ code, discount, discountType, copied, onCopy }: CouponLineProps) {
  return (
    <button
      type="button"
      className="vendor-card-coupon"
      onClick={onCopy}
    >
      <span className="vendor-card-coupon-code">{code}</span>
      <span className="vendor-card-coupon-right">
        <span className={`vendor-card-coupon-discount ${discountType}`}>
          {copied ? '✓ COPIED' : discount}
        </span>
      </span>
    </button>
  );
}

export function VendorCard({ vendorProduct: vp }: VendorCardProps) {
  const [showAllCoupons, setShowAllCoupons] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [variantsOpen, setVariantsOpen] = useState(false);
  const [variantsEverOpened, setVariantsEverOpened] = useState(false);
  const availability = vp.availability || vp.stockStatus || 'in_stock';
  const link = vp.vendor.affiliateLink || vp.vendorUrl;
  const shipping = vp.shippingIncluded
    ? 'Shipping Included'
    : toNum(vp.shippingCost) > 0
      ? `Shipping ${formatPrice(toNum(vp.shippingCost))}`
      : 'Free Shipping';
  // Variants sorted by current price ascending (real prices first, zero-price
  // placeholders last); ties broken alphabetically by name.
  const rank = (p: number) => (p > 0 ? p : Infinity);
  const variants = [...(vp.variants ?? [])].sort(
    (a, b) =>
      rank(toNum(a.price)) - rank(toNum(b.price)) || (a.name || '').localeCompare(b.name || ''),
  );
  const hasVariants = variants.length > 0;
  const lowestVariant = hasVariants ? pickLowestVariant(variants) : null;
  const allCoupons = (vp.coupons ?? []).filter((c) => c.enabled);
  const bestCoupon = getBestCoupon(allCoupons, toNum(vp.totalPrice));
  const extraCount = allCoupons.length - 1;
  const hasFreeShipping = allCoupons.some((c) => c.discountType === 'free_shipping');

  const effectivePrice = toNum(vp.effectivePrice);
  const activeVendorCoupon = vp.vendor.couponsEnabled !== false
    ? (vp.vendor.coupons ?? []).filter((c) => isCouponActive(c)).sort(sortCouponsByPriority)[0] ?? null
    : null;
  // Main BUY opens the lowest-priced available variant; falls back to the
  // coupon/vendor affiliate link, then the vendor URL.
  const buyLink = lowestVariant?.variantUrl || activeVendorCoupon?.affiliateLink || link;
  // "From ₹X" uses the raw lowest variant price.
  const fromPrice = lowestVariant ? toNum(lowestVariant.price) : effectivePrice;
  const showFrom = hasVariants && variants.length > 1;

  const lastChecked = vp.lastCheckedAt ?? vp.lastChecked ?? null;

  const copyCoupon = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1000);
    } catch {
      // clipboard unavailable (non-secure context) — nothing to do
    }
  };

  const toggleVariants = () => {
    if (!variantsOpen) setVariantsEverOpened(true);
    setVariantsOpen((open) => !open);
  };

  const renderProductCoupon = (c: NonNullable<VendorProductWithVendor['coupons']>[number]) => {
    return (
      <CouponLine
        key={c.id}
        code={c.code}
        discount={formatCouponDiscount(c)}
        discountType={c.discountType}
        copied={copiedId === c.id}
        onCopy={() => copyCoupon(c.id, c.code)}
      />
    );
  };

  return (
    <div className="vendor-card">
      <div className="vendor-card-body">
        {/* Header: name/shipping left · price/stock/buy right */}
        <div className="vendor-card-head">
          <div className="vendor-card-head-name">
            <span className="vendor-card-name">{vp.vendor.name}</span>
          </div>
          <div className="vendor-card-head-price">
            <span className="vendor-card-price">
              {!showFrom && effectivePrice < toNum(vp.totalPrice) && (
                <span className="vendor-card-price-original">
                  {formatPrice(toNum(vp.totalPrice))}
                </span>
              )}
              {showFrom ? `From ${formatPrice(fromPrice)}` : formatPrice(effectivePrice)}
            </span>
          </div>
          <div className="vendor-card-head-stock">
            <AvailabilityBadge availability={availability} />
          </div>
          <div className="vendor-card-head-shipping">
            <span className="vendor-card-shipping">{shipping}</span>
          </div>
        </div>

        {/* Variants */}
        {hasVariants && (
          <div className="vendor-card-variants">
            <button
              type="button"
              className="vendor-card-variants-toggle"
              aria-expanded={variantsOpen}
              aria-controls={`vendor-variants-${vp.id}`}
              onClick={toggleVariants}
            >
              <span className="vendor-card-variants-toggle-title">Variants ({variants.length})</span>
              <span className="vendor-card-variants-toggle-caret">
                <span className="vendor-card-variants-caret-icon" aria-hidden="true">▼</span>
                <span>{variantsOpen ? 'Hide variants' : 'Show variants'}</span>
              </span>
            </button>
            <div
              id={`vendor-variants-${vp.id}`}
              className={`vendor-card-variants-panel ${variantsOpen ? 'open' : ''}`}
            >
              <div className="vendor-card-variants-panel-inner">
                {variantsEverOpened && variants.map((v) => {
                  const vLink = v.variantUrl || link;
                  const fields = variantFields(v);
                  return (
                    <div key={v.id} className="vendor-card-variant">
                      <div className="vendor-card-variant-body">
                        <span className="vendor-card-variant-name">{v.name || 'Unnamed'}</span>
                        {fields.length > 0 && (
                          <div className="vendor-card-variant-fields">
                            {fields.map((f) => (
                              <div key={f.label} className="vendor-card-variant-field">
                                <span className="vendor-card-variant-field-label">{f.label}</span>
                                <span className="vendor-card-variant-field-value">{f.values.join(', ')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="vendor-card-variant-right">
                        <span className="vendor-card-variant-price">{formatPrice(toNum(v.price))}</span>
                        {vLink ? (
                          <a href={vLink} target="_blank" rel="noopener noreferrer" className="btn-primary btn-xs">BUY</a>
                        ) : (
                          <span className="vendor-card-variant-buy-none">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Bottom row: last updated + coupon/buy actions */}
        <div className="vendor-card-cta">
          {lastChecked && (
            <span className="vendor-card-updated">
              Last Updated: {timeAgo(new Date(lastChecked))}
            </span>
          )}
          <div className="vendor-card-actions">
            <div className="vendor-card-coupons">
              {activeVendorCoupon && (
                <CouponLine
                  code={activeVendorCoupon.code}
                  discount={formatCouponDiscount(activeVendorCoupon)}
                  discountType={activeVendorCoupon.discountType}
                  copied={copiedId === activeVendorCoupon.id}
                  onCopy={() => copyCoupon(activeVendorCoupon.id, activeVendorCoupon.code)}
                />
              )}
              {bestCoupon && renderProductCoupon(bestCoupon)}
              {hasFreeShipping && !bestCoupon?.discountType?.includes('free_shipping') && (
                <div className="vendor-card-coupon vendor-card-coupon-ship">
                  <span className="vendor-card-coupon-icon">🚚</span>
                  <span className="vendor-card-coupon-discount free_shipping">FREE SHIPPING</span>
                </div>
              )}
              {extraCount > 0 && (
                <button
                  type="button"
                  className="vendor-card-coupon-more"
                  onClick={() => setShowAllCoupons((s) => !s)}
                >
                  {showAllCoupons ? 'Show less' : `+${extraCount} more`}
                </button>
              )}
              {showAllCoupons && allCoupons.slice(1).filter((c) => c.discountType !== 'free_shipping').map((c) => renderProductCoupon(c))}
            </div>
            {buyLink ? (
              <a
                href={buyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="vendor-card-buy"
              >
                <span className="vendor-card-buy-label">BUY NOW</span>
                <span className="vendor-card-buy-arrow" aria-hidden="true">↗</span>
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
