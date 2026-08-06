/**
 * Shared props/helpers for animated icon components (bookmark, magnifier).
 */

/** Icon size in pixels or CSS string */
export interface AnimatedIconProps {
  /** Icon size in pixels or CSS string */
  size?: number | string;
  /** Icon color (defaults to currentColor) */
  color?: string;
  /** SVG stroke width */
  strokeWidth?: number;
  /** Fill (defaults to none) */
  fill?: string;
  /** Additional CSS classes */
  className?: string;
}

export interface AnimatedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

/** Scales a stroke width from a 24-unit basis to the target viewBox. */
export const scaledStrokeWidth = (strokeWidth: number, viewBox: number) => (strokeWidth / 24) * viewBox;
