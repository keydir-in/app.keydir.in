'use client';

/**
 * Bookmark toggle for the product info panel. Uses the animated BookmarkIcon
 * (outline stroke, squish on hover) and flips to a filled state when saved.
 *
 * Currently local UI state only. Backend persistence can be added later by
 * swapping the useState pair for a hook/server action — the button markup
 * and CSS classes stay the same.
 */

import { useState } from 'react';
import BookmarkIcon from './bookmark-icon';

interface BookmarkButtonProps {
  initialSaved?: boolean;
}

export function BookmarkButton({ initialSaved = false }: BookmarkButtonProps) {
  const [saved, setSaved] = useState(initialSaved);

  return (
    <button
      type="button"
      className={`bookmark-button${saved ? ' saved' : ''}`}
      onClick={() => setSaved((s) => !s)}
      aria-pressed={saved}
      aria-label={saved ? 'Remove bookmark' : 'Save bookmark'}
      title={saved ? 'Remove bookmark' : 'Save bookmark'}
    >
      <BookmarkIcon size={18} strokeWidth={2} fill={saved ? 'var(--yellow)' : 'none'} />
    </button>
  );
}
