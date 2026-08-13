'use client';

/**
 * Product image gallery. Single image renders exactly as the old static
 * hero image; multiple images get hover arrows (desktop) / always-visible
 * arrows (mobile), swipe support, and smooth crossfades. No thumbnails,
 * no dots, no lightbox, square corners.
 */

import Image from 'next/image';
import { useCallback, useRef, useState } from 'react';
import type { TouchEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  images: string[];
  name: string;
}

export function ProductGallery({ images, name }: Props) {
  const count = images.length;
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);

  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) next();
      else prev();
    }
    touchX.current = null;
  };

  if (count <= 1) {
    return images[0] ? (
      <Image
        src={images[0]}
        alt={name}
        width={600}
        height={600}
        className="w-full aspect-square object-contain"
        priority
      />
    ) : (
      <div className="w-full aspect-square bg-[var(--surface-raised)] flex items-center justify-center text-7xl font-bold font-[family-name:var(--f-m)] text-[var(--text-dim)]">
        {name.charAt(0)}
      </div>
    );
  }

  return (
    <div className="product-gallery" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="product-gallery-stage">
        {images.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={`${name} — ${i + 1}/${count}`}
            width={600}
            height={600}
            priority={i === 0}
            draggable={false}
            className={`product-gallery-img${i === index ? ' is-active' : ''}`}
          />
        ))}
      </div>
      <button
        type="button"
        className="product-gallery-arrow product-gallery-arrow--prev"
        onClick={prev}
        aria-label="Previous image"
      >
        <ChevronLeft size={20} strokeWidth={3} />
      </button>
      <button
        type="button"
        className="product-gallery-arrow product-gallery-arrow--next"
        onClick={next}
        aria-label="Next image"
      >
        <ChevronRight size={20} strokeWidth={3} />
      </button>
    </div>
  );
}
