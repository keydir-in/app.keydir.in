'use client';

/**
 * Add-to-compare toggle button. Syncs with the compare store to track
 * whether the product is in the compare tray, validates category
 * compatibility, and displays error messages when limits are exceeded.
 */

import { useState, useEffect } from 'react';
import { GitCompareArrows } from 'lucide-react';
import {
  isProductInCompare,
  addCompareTrayItem,
  removeCompareTrayItem,
  canAddToCompare,
  onCompareChange,
} from '@/lib/compare-store';

interface Props {
  slug: string;
  name: string;
  image: string | null;
  price: number | null;
  category: string;
}

export function CompareButton({ slug, name, image, price, category }: Props) {
  const [inCompare, setInCompare] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInCompare(isProductInCompare(slug));
    return onCompareChange(() => {
      setInCompare(isProductInCompare(slug));
      setError(null);
    });
  }, [slug]);

  function handleClick() {
    if (inCompare) {
      removeCompareTrayItem(slug);
      return;
    }
    const check = canAddToCompare(category);
    if (!check.ok) {
      setError(check.reason!);
      return;
    }
    addCompareTrayItem({ slug, name, image, price, category });
  }

  return (
    <div className="compare-btn-wrap">
      <button
        className={`save-btn compare-btn ${inCompare ? 'active' : ''}`}
        onClick={handleClick}
      >
        <GitCompareArrows size={13} strokeWidth={2} className="save-btn-icon" />
        {inCompare ? 'In Compare' : 'Compare'}
      </button>
      {error && (
        <div className="compare-btn-error">{error}</div>
      )}
    </div>
  );
}
