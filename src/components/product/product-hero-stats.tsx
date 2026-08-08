'use client';

/**
 * Hero stat cards (vendors, price range, last updated). Each card drives
 * its animated icon via parent hover so the whole card is the hover zone.
 */

import { useRef } from 'react';
import TruckElectricIcon from '@/components/product/truck-electric-icon';
import CurrencyRupeeIcon from '@/components/product/currency-rupee-icon';
import ScanBarcodeIcon from '@/components/product/scan-barcode-icon';
import type { AnimatedIconHandle } from '@/components/product/types';
import { formatPrice } from '@/lib/utils';

interface Props {
  vendorCount: number;
  rangeMin: number | null;
  rangeMax: number | null;
  lastUpdated: Date | null;
}

export function ProductHeroStats({ vendorCount, rangeMin, rangeMax, lastUpdated }: Props) {
  const vendorRef = useRef<AnimatedIconHandle>(null);
  const priceRef = useRef<AnimatedIconHandle>(null);
  const updatedRef = useRef<AnimatedIconHandle>(null);

  return (
    <div className="product-hero-stats">
      <div
        className="product-stat-card"
        onMouseEnter={() => vendorRef.current?.startAnimation()}
        onMouseLeave={() => vendorRef.current?.stopAnimation()}
      >
        <div className="product-stat-icon">
          <TruckElectricIcon ref={vendorRef} size={20} strokeWidth={2} />
        </div>
        <div className="product-stat-info">
          <div className="product-stat-value">{vendorCount}</div>
          <div className="product-stat-label">Vendors Available</div>
        </div>
      </div>
      <div
        className="product-stat-card"
        onMouseEnter={() => priceRef.current?.startAnimation()}
        onMouseLeave={() => priceRef.current?.stopAnimation()}
      >
        <div className="product-stat-icon">
          <CurrencyRupeeIcon ref={priceRef} size={20} strokeWidth={2} />
        </div>
        <div className="product-stat-info">
          <div className="product-stat-value">
            {rangeMin ? (
              <div className="product-stat-price-row">
                <span>{formatPrice(rangeMin)}</span>
                {rangeMax && rangeMax !== rangeMin && (
                  <>
                    <span className="product-stat-arrow">→</span>
                    <span className="product-stat-value-alt">{formatPrice(rangeMax)}</span>
                  </>
                )}
              </div>
            ) : (
              '—'
            )}
          </div>
          <div className="product-stat-label">Price Range</div>
        </div>
      </div>
      <div
        className="product-stat-card"
        onMouseEnter={() => updatedRef.current?.startAnimation()}
        onMouseLeave={() => updatedRef.current?.stopAnimation()}
      >
        <div className="product-stat-icon">
          <ScanBarcodeIcon ref={updatedRef} size={20} strokeWidth={2} />
        </div>
        <div className="product-stat-info">
          <div className="product-stat-value">
            {lastUpdated
              ? lastUpdated.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()
              : '—'}
          </div>
          <div className="product-stat-label">Last Updated</div>
        </div>
      </div>
    </div>
  );
}
