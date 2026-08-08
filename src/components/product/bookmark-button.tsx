'use client';

/**
 * Bookmark toggle for the product info panel. Uses the animated BookmarkIcon
 * (outline stroke, squish on hover) and flips to a filled state when saved.
 * Persists via the toggleCollection server action; optimistically toggles UI
 * state so the button feels instant.
 */

import { useState } from 'react';
import BookmarkIcon from './bookmark-icon';
import { toggleCollection } from '@/lib/profile/actions';

interface BookmarkButtonProps {
  productId: string;
  initialSaved?: boolean;
}

export function BookmarkButton({ productId, initialSaved = false }: BookmarkButtonProps) {
  const [saved, setSaved] = useState(initialSaved);

  async function handleToggle() {
    setSaved((s) => !s);
    await toggleCollection(productId);
  }

  return (
    <button
      type="button"
      className={`bookmark-button${saved ? ' saved' : ''}`}
      onClick={handleToggle}
      aria-pressed={saved}
      aria-label={saved ? 'Remove bookmark' : 'Save bookmark'}
      title={saved ? 'Remove bookmark' : 'Save bookmark'}
    >
      <BookmarkIcon size={18} strokeWidth={2} fill={saved ? 'var(--yellow)' : 'none'} />
    </button>
  );
}
