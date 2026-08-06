/**
 * Vendor pricing loading skeleton in two variants: VendorTableSkeleton
 * for the tabular price comparison view and VendorCardSkeleton for the
 * card-based layout. Both mirror the real component structure.
 */

import { SkeletonRectangle, SkeletonBadge, SkeletonButton } from './primitives';

export function VendorTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-x-auto" aria-hidden="true">
      <table className="price-table">
        <thead>
          <tr>
            <th>Vendor</th>
            <th>Price</th>
            <th>Shipping</th>
            <th>Total</th>
            <th>Status</th>
            <th>Updated</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className={i === 0 ? 'lowest' : ''}>
              <td>
                <SkeletonRectangle width={100} height={14} />
              </td>
              <td>
                <SkeletonRectangle width={80} height={14} />
              </td>
              <td>
                <SkeletonRectangle width={60} height={12} />
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <SkeletonRectangle width={80} height={14} />
                  {i === 0 && <SkeletonBadge />}
                </div>
              </td>
              <td>
                <SkeletonBadge />
              </td>
              <td>
                <SkeletonRectangle width={60} height={12} />
              </td>
              <td>
                <SkeletonButton />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function VendorCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="vendor-cards" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="vendor-row">
          <div className="vendor-row-grid">
            <div className="vendor-row-logo">
              <SkeletonRectangle width={72} height={72} />
            </div>
            <div className="vendor-row-info">
              <SkeletonRectangle width={140} height={16} />
              <SkeletonRectangle width={110} height={10} />
              <SkeletonRectangle width={90} height={22} />
            </div>
            <div className="vendor-row-price-block">
              <SkeletonRectangle width={110} height={20} />
              <SkeletonBadge />
            </div>
            <div className="vendor-row-actions">
              <SkeletonRectangle width={60} height={10} />
              <SkeletonButton />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
