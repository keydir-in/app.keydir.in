'use client';

/**
 * Vendor pricing card displaying price, shipping, availability, and
 * coupon details for a single vendor. Shows expandable coupon list,
 * variant options, and a buy link with last-updated timestamp.
 */

import { useState } from 'react';
import { formatPrice, timeAgo, toNum, formatCouponDiscount, getBestCoupon } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import { AvailabilityBadge } from '@/components/shared/availability-badge';
import type { VendorProductWithVendor } from '@/types';

interface VendorCardProps {
  vendorProduct: VendorProductWithVendor;
  isLowest?: boolean;
}

export function VendorCard({ vendorProduct: vp, isLowest = false }: VendorCardProps) {
  const [showAllCoupons, setShowAllCoupons] = useState(false);
  const availability = vp.availability || vp.stockStatus || 'in_stock';
  const link = vp.vendor.affiliateLink || vp.vendorUrl;
  const shipping = vp.shippingIncluded
    ? 'Shipping Included'
    : toNum(vp.shippingCost) > 0
      ? `Shipping ${formatPrice(toNum(vp.shippingCost))}`
      : 'Free Shipping';
  const variants = vp.variants ?? [];
  const hasVariants = variants.length > 0;
  const allCoupons = (vp.coupons ?? []).filter((c) => c.enabled);
  const hasCoupons = allCoupons.length > 0;
  const bestCoupon = getBestCoupon(allCoupons, toNum(vp.totalPrice));
  const extraCount = allCoupons.length - 1;
  const hasFreeShipping = allCoupons.some((c) => c.discountType === 'free_shipping');

  const discountLabel = (c: typeof bestCoupon) => {
    if (!c) return null;
    return formatCouponDiscount(c);
  };

  return (
    <div className={`vendor-card ${isLowest ? 'vendor-card-lowest' : ''}`}>
      <div className="vendor-card-row">
        <span className="vendor-card-name">{vp.vendor.name}</span>
        <span className="vendor-card-price">
          {toNum(vp.effectivePrice) < toNum(vp.totalPrice) && (
            <span className="vendor-card-price-original">
              {formatPrice(toNum(vp.totalPrice))}
            </span>
          )}
          {formatPrice(toNum(vp.effectivePrice))}
        </span>
      </div>
      <div className="vendor-card-row">
        <span className="vendor-card-shipping">{shipping}</span>
        <AvailabilityBadge availability={availability} />
      </div>

      {/* Coupons */}
      {hasCoupons && (
        <div className="vendor-card-coupons">
          {bestCoupon && (
            <div className="vendor-card-coupon" onClick={() => bestCoupon.couponUrl && window.open(bestCoupon.couponUrl, '_blank')}>
              <span className="vendor-card-coupon-icon">🏷</span>
              <span className="vendor-card-coupon-code">{bestCoupon.code}</span>
              <span className={`vendor-card-coupon-discount ${bestCoupon.discountType}`}>
                {discountLabel(bestCoupon)}
              </span>
              {bestCoupon.couponUrl && (
                <ExternalLink size={10} className="vendor-card-coupon-link" />
              )}
            </div>
          )}
          {hasFreeShipping && !bestCoupon?.discountType?.includes('free_shipping') && (
            <div className="vendor-card-coupon vendor-card-coupon-ship">
              <span className="vendor-card-coupon-icon">🚚</span>
              <span className="vendor-card-coupon-discount free_shipping">FREE SHIPPING</span>
            </div>
          )}
          {extraCount > 0 && (
            <button type="button" className="vendor-card-coupon-more" onClick={() => setShowAllCoupons(!showAllCoupons)}>
              {showAllCoupons ? 'Show less' : `+${extraCount} more`}
            </button>
          )}
          {showAllCoupons && allCoupons.slice(1).map((c) => (
            <div key={c.id} className="vendor-card-coupon" onClick={() => c.couponUrl && window.open(c.couponUrl, '_blank')}>
              <span className="vendor-card-coupon-icon">🏷</span>
              <span className="vendor-card-coupon-code">{c.code}</span>
              <span className={`vendor-card-coupon-discount ${c.discountType}`}>
                {discountLabel(c)}
              </span>
              {c.couponUrl && (
                <ExternalLink size={10} className="vendor-card-coupon-link" />
              )}
            </div>
          ))}
        </div>
      )}

      {hasVariants && (
        <div className="vendor-card-variants">
          <div className="vendor-card-variants-header">Variants ({variants.length})</div>
          {variants.map((v) => {
            const vLink = v.variantUrl || link;
            return (
              <div key={v.id} className="vendor-card-variant">
                <div className="vendor-card-variant-info">
                  <span className="vendor-card-variant-name">{v.name || 'Unnamed'}</span>
                  <div className="vendor-card-variant-tags">
                    {v.color?.map((c) => <span key={c} className="vendor-card-tag">{c}</span>)}
                    {v.switches?.map((s) => <span key={s} className="vendor-card-tag tag-switch">{s}</span>)}
                  </div>
                </div>
                <div className="vendor-card-variant-right">
                  <span className="vendor-card-variant-price">{formatPrice(toNum(v.price))}</span>
                  <AvailabilityBadge availability={v.stockStatus} size="sm" />
                  <a href={vLink} target="_blank" rel="noopener noreferrer" className="btn-primary btn-xs">BUY</a>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="vendor-card-row vendor-card-footer">
        <span className="vendor-card-updated">
          Last Updated: {vp.lastCheckedAt ? timeAgo(new Date(vp.lastCheckedAt)) : vp.lastChecked ? timeAgo(new Date(vp.lastChecked)) : '—'}
        </span>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary btn-sm vendor-card-buy"
        >
          BUY NOW <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
