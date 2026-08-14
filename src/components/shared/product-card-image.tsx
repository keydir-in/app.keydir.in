/**
 * Product image component using next/image with lazy loading.
 * Falls back to a placeholder div showing the product's first letter when no source is provided.
 */

import Image from 'next/image';

interface ProductCardImageProps {
  src: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function ProductCardImage({ src, alt, width = 400, height = 300, className }: ProductCardImageProps) {
  if (!src) {
    return (
      <div className={`product-card-img product-card-img-fallback ${className || ''}`}>
        {alt.charAt(0)}
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      // Mirrors the responsive grid columns (1/2/3/4/5 across breakpoints) so
      // the browser picks the right source candidate instead of the 100vw default.
      sizes="(max-width: 480px) 100vw, (max-width: 767px) 50vw, (max-width: 1100px) 33vw, (max-width: 1400px) 25vw, 20vw"
      className={`product-card-img ${className || ''}`}
    />
  );
}
