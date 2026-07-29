'use client';

/**
 * Save/unsave product button that toggles membership in the user's
 * collection. Calls the server action, shows loading state, and
 * refreshes the router to reflect the updated state.
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toggleCollection } from '@/lib/profile/actions';

interface SaveButtonsProps {
  productId: string;
  inCollection: boolean;
}

export function SaveButtons({ productId, inCollection }: SaveButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCollection() {
    setLoading(true);
    await toggleCollection(productId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      className={`save-btn ${inCollection ? 'active' : ''}`}
      onClick={handleCollection}
      disabled={loading}
    >
      <span className="save-btn-icon">{inCollection ? '+' : '+'}</span>
      {loading ? '...' : inCollection ? 'In Collection' : 'Collection'}
    </button>
  );
}
