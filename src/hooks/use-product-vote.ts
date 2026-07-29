'use client';

/**
 * Client-side hook for optimistic upvote/downvote on products.
 * Toggles vote state instantly, reverts on server error, and redirects to login on auth failure.
 * @returns { upvotes, downvotes, userVote, loading, handleVote, votingLocked }
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { voteOnProduct } from '@/lib/profile/actions';

export function useProductVote(
  productId: string,
  initialUp: number,
  initialDown: number,
  initialVote: 'upvote' | 'downvote' | null = null,
) {
  const router = useRouter();
  const [upvotes, setUpvotes] = useState(initialUp);
  const [downvotes, setDownvotes] = useState(initialDown);
  const [userVote, setUserVote] = useState(initialVote);
  const [loading, setLoading] = useState(false);
  const [votingLocked, setVotingLocked] = useState(false);

  const handleVote = useCallback(async (type: 'upvote' | 'downvote') => {
    if (loading || votingLocked) return;
    setLoading(true);

    const prevUp = upvotes;
    const prevDown = downvotes;
    const prevVote = userVote;

    if (userVote === type) {
      if (type === 'upvote') setUpvotes((u) => u - 1);
      else setDownvotes((d) => d - 1);
      setUserVote(null);
    } else if (userVote) {
      if (type === 'upvote') { setUpvotes((u) => u + 1); setDownvotes((d) => d - 1); }
      else { setUpvotes((u) => u - 1); setDownvotes((d) => d + 1); }
      setUserVote(type);
    } else {
      if (type === 'upvote') setUpvotes((u) => u + 1);
      else setDownvotes((d) => d + 1);
      setUserVote(type);
    }

    const result = await voteOnProduct(productId, type);

    if (result.error) {
      setUpvotes(prevUp);
      setDownvotes(prevDown);
      setUserVote(prevVote);
      if (result.error === 'auth_required') {
        window.location.href = '/auth/login';
      } else if (result.error === 'voting_locked') {
        setVotingLocked(true);
      }
    }

    setLoading(false);
    router.refresh();
  }, [productId, upvotes, downvotes, userVote, loading, votingLocked, router]);

  return { upvotes, downvotes, userVote, loading, handleVote, votingLocked };
}
