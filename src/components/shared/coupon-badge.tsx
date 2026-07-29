/**
 * Displays a coupon code as a styled badge with a tag emoji prefix.
 * @param code - The coupon code to display.
 */

interface CouponBadgeProps {
  code: string;
  className?: string;
}

export function CouponBadge({ code, className }: CouponBadgeProps) {
  return (
    <span className={`product-card-coupon-badge ${className || ''}`}>
      🏷️ {code || 'COUPON'}
    </span>
  );
}
