'use client';

/**
 * Product card component with image, price display, coupon badge, and
 * upvote count. Supports listing and profile variants; the profile
 * variant shows a compact layout with optional remove button.
 */

import Link from 'next/link';
import { ProductCardImage } from '@/components/shared/product-card-image';
import { CouponBadge } from '@/components/shared/coupon-badge';
import { PriceDisplay } from '@/components/shared/price-display';
import ArrowBigUpIcon from '@/components/product/arrow-big-up-icon';
import type { ProductCard as ProductCardType } from '@/types';

interface ProductCardProps {
  product: ProductCardType;
  variant?: 'listing' | 'profile';
  brand?: string;
  onRemove?: (id: string) => void;
  removing?: boolean;
  collectionItemId?: string;
}

export function ProductCard({ product, variant = 'listing', brand, onRemove, removing, collectionItemId }: ProductCardProps) {
  if (variant === 'profile') {
    return (
      <div className="profile-product-card">
        <Link href={`/products/${product.slug}`} className="profile-product-link">
          {product.image ? (
            <div
              className="profile-product-img"
              style={{ backgroundImage: `url(${product.image})` }}
            />
          ) : (
            <div className="profile-product-img profile-product-placeholder">
              {product.name.charAt(0)}
            </div>
          )}
          <div className="profile-product-info">
            <div className="profile-product-brand">
              {brand ?? 'Unknown'}
            </div>
            <div className="profile-product-name">{product.name}</div>
          </div>
        </Link>
        {onRemove && collectionItemId && (
          <button
            className="profile-product-remove"
            onClick={() => onRemove(collectionItemId)}
            disabled={removing}
          >
            {removing ? '...' : '\u00d7'}
          </button>
        )}
      </div>
    );
  }

  const hasPrice = product.lowestPrice !== null;

  return (
    <Link href={`/products/${product.slug}`} className="product-card">
      <div className="product-card-img-wrap">
        <ProductCardImage src={product.image} alt={product.name} />
        {product.hasCoupons && (
          <CouponBadge code={product.couponCode || 'COUPON'} />
        )}
      </div>
      <div className="product-card-body">
        <div className="product-card-name">{product.name}</div>

        <div className="product-card-meta">
          {hasPrice && (
            <PriceDisplay price={product.lowestPrice!} originalPrice={product.originalPrice} />
          )}
          <span className="product-card-upvotes">
            <ArrowBigUpIcon size={12} strokeWidth={2} />
            {product.upvotes}
          </span>
        </div>

        <div className="product-card-cta">
          Compare {product.vendorCount} Vendor{product.vendorCount !== 1 ? 's' : ''} →
        </div>
      </div>
    </Link>
  );
}
