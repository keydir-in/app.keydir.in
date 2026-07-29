/**
 * Stock status badge that maps availability strings (e.g. "in_stock", "preorder")
 * to styled labels with icons using the AVAILABILITY_MAP constant.
 */

import { AVAILABILITY_MAP } from '@/lib/constants';

interface AvailabilityBadgeProps {
  availability: string;
  size?: 'sm' | 'md';
}

export function AvailabilityBadge({ availability, size = 'md' }: AvailabilityBadgeProps) {
  const stock = AVAILABILITY_MAP[availability] ?? AVAILABILITY_MAP.in_stock;
  return (
    <span className={`badge ${size === 'sm' ? 'badge-sm' : ''} ${stock.class}`}>
      {stock.icon} {stock.label}
    </span>
  );
}
