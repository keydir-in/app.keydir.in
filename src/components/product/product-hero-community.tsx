'use client';

/**
 * Product hero community section: upvote/downvote buttons with optimistic
 * vote state via the useProductVote hook.
 *
 * The collection + compare actions were removed from the product page UI
 * (replaced by the BookmarkButton); the SaveButtons and CompareButton
 * components remain available for the future comparison system.
 */

import { useProductVote } from '@/hooks/use-product-vote';
import ArrowBigDownIcon from '@/components/product/arrow-big-down-icon';
import ArrowBigUpIcon from '@/components/product/arrow-big-up-icon';

interface Props {
  productId: string;
  upvotes: number;
  downvotes: number;
  userVote?: 'upvote' | 'downvote' | null;
  showVoting?: boolean;
}

export function ProductHeroCommunity({
  productId,
  upvotes: initUp,
  downvotes: initDown,
  userVote: initVote = null,
  showVoting = true,
}: Props) {
  const { upvotes, downvotes, userVote, loading, handleVote, votingLocked } = useProductVote(productId, initUp, initDown, initVote);

  return (
    <div className="product-hero-community">
      {showVoting && (
        <>
          {votingLocked && (
            <div className="product-hero-voting-locked">
              Voting is locked. Connect all authentication methods to unlock.
            </div>
          )}

          <div className="product-hero-vote-cards">
            <button
              className={`product-hero-vote-card up ${userVote === 'upvote' ? 'active' : ''}`}
              onClick={() => handleVote('upvote')}
              disabled={loading || votingLocked}
              title={votingLocked ? 'Voting is locked' : undefined}
            >
              <div className="product-hero-vote-row">
                <span className="product-hero-vote-arrow">
                  <ArrowBigUpIcon size={14} strokeWidth={2} />
                </span>
                <span className="product-hero-vote-number">{upvotes}</span>
              </div>
              <span className="product-hero-vote-label">UPVOTES</span>
            </button>

            <button
              className={`product-hero-vote-card down ${userVote === 'downvote' ? 'active' : ''}`}
              onClick={() => handleVote('downvote')}
              disabled={loading || votingLocked}
              title={votingLocked ? 'Voting is locked' : undefined}
            >
              <div className="product-hero-vote-row">
                <span className="product-hero-vote-arrow">
                  <ArrowBigDownIcon size={14} strokeWidth={2} />
                </span>
                <span className="product-hero-vote-number">{downvotes}</span>
              </div>
              <span className="product-hero-vote-label">DOWNVOTES</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
