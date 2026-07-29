/**
 * Formatted price display component. Shows the current price and, when a higher
 * original price is provided, renders the original price with strikethrough.
 */

import { formatPrice } from '@/lib/utils';

interface PriceDisplayProps {
  price: number;
  originalPrice?: number | null;
  className?: string;
}

export function PriceDisplay({ price, originalPrice, className }: PriceDisplayProps) {
  const hasDiscount = originalPrice != null && originalPrice > price;
  return (
    <span className={className || 'product-card-price'}>
      {hasDiscount && (
        <span className="product-card-price-original">{formatPrice(originalPrice!)}</span>
      )}
      {formatPrice(price)}
    </span>
  );
}
