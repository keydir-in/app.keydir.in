/**
 * Base skeleton primitives used as building blocks for all page-level
 * skeleton placeholders. Exports Skeleton, SkeletonText, SkeletonCircle,
 * SkeletonRectangle, SkeletonBadge, and SkeletonButton with ARIA support.
 */

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

export function Skeleton({ className = '', style, ariaLabel }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={style}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      role={ariaLabel ? 'status' : undefined}
    >
      {ariaLabel && <span className="sr-only">Loading...</span>}
    </div>
  );
}

export function SkeletonText({
  lines = 1,
  className = '',
  lastLineWidth = '60%',
}: {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}) {
  return (
    <div className={`skeleton-text ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="skeleton-text-line"
          style={i === lines - 1 ? { width: lastLineWidth } : undefined}
        />
      ))}
    </div>
  );
}

export function SkeletonCircle({
  size = 40,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Skeleton
      className={`skeleton-circle ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function SkeletonRectangle({
  width = '100%',
  height = 20,
  className = '',
}: {
  width?: string | number;
  height?: string | number;
  className?: string;
}) {
  return (
    <Skeleton
      className={`skeleton-rectangle ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonBadge({ className = '' }: { className?: string }) {
  return (
    <Skeleton
      className={`skeleton-badge ${className}`}
      style={{ width: 60, height: 20 }}
    />
  );
}

export function SkeletonButton({ className = '' }: { className?: string }) {
  return (
    <Skeleton
      className={`skeleton-button ${className}`}
      style={{ width: 100, height: 36 }}
    />
  );
}
