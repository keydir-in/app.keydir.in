'use client';

/**
 * Product hero community section combining upvote/downvote buttons,
 * save-to-collection, and compare toggle. Uses the useProductVote
 * hook for optimistic vote state management.
 */

import { useProductVote } from '@/hooks/use-product-vote';
import { SaveButtons } from './save-buttons';
import { CompareButton } from './compare-button';

interface Props {
  productId: string;
  productSlug: string;
  productName: string;
  productImage: string | null;
  productPrice: number | null;
  productCategory: string;
  upvotes: number;
  downvotes: number;
  userVote?: 'upvote' | 'downvote' | null;
  inCollection: boolean;
  showVoting?: boolean;
  showCompare?: boolean;
}

export function ProductHeroCommunity({
  productId,
  productSlug,
  productName,
  productImage,
  productPrice,
  productCategory,
  upvotes: initUp,
  downvotes: initDown,
  userVote: initVote = null,
  inCollection,
  showVoting = true,
  showCompare = false,
}: Props) {
  const { upvotes, downvotes, userVote, loading, handleVote, votingLocked } = useProductVote(productId, initUp, initDown, initVote);

  return (
    <div className="product-hero-community">
      {showVoting && (
        <>
          <span className="product-hero-community-label">COMMUNITY</span>

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
                <span className="product-hero-vote-arrow">▲</span>
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
                <span className="product-hero-vote-arrow">▼</span>
                <span className="product-hero-vote-number">{downvotes}</span>
              </div>
              <span className="product-hero-vote-label">DOWNVOTES</span>
            </button>
          </div>
        </>
      )}

      <div className="product-hero-collection">
        <SaveButtons productId={productId} inCollection={inCollection} />
        {showCompare && (
          <CompareButton
            slug={productSlug}
            name={productName}
            image={productImage}
            price={productPrice}
            category={productCategory}
          />
        )}
      </div>
    </div>
  );
}
