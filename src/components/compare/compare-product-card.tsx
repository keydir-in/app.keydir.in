'use client';

/**
 * Product card for the compare tray showing image, price range across
 * vendors, upvote/downvote controls, and a link to the full product page.
 * Exports: CompareProductCards
 */

import Link from 'next/link';
import Image from 'next/image';
import { X } from 'lucide-react';
import { formatPrice, toNum } from '@/lib/utils';
import { useProductVote } from '@/hooks/use-product-vote';
import type { CompareProduct } from './compare-types';

interface Props {
  products: CompareProduct[];
  onRemove: (slug: string) => void;
}

export function CompareProductCards({ products, onRemove }: Props) {
  return (
    <>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onRemove={onRemove} />
      ))}
    </>
  );
}

function ProductCard({ product, onRemove }: { product: CompareProduct; onRemove: (slug: string) => void }) {
  const { upvotes, downvotes, userVote, handleVote, votingLocked } = useProductVote(product.id, product.upvotes, product.downvotes, product.userVote);

  const prices = product.vendorProducts.map((vp) => toNum(vp.effectivePrice)).filter((p) => p > 0);
  const lowest = prices.length ? Math.min(...prices) : null;
  const highest = prices.length > 1 ? Math.max(...prices) : lowest;

  return (
    <div className="cmp-card">
      <button className="cmp-card-remove" onClick={() => onRemove(product.slug)} title="Remove">
        <X size={12} />
      </button>

      <div className="cmp-card-image" style={{ position: 'relative' }}>
        {product.image ? (
          <Image src={product.image} alt={product.name} fill style={{ objectFit: 'cover' }} unoptimized />
        ) : (
          <span>{product.name.charAt(0)}</span>
        )}
      </div>

      <div className="cmp-card-separator" />

      <div className="cmp-card-info">
        <h3 className="cmp-card-name">{product.name}</h3>

        <div className="cmp-card-price">
          {lowest !== null && (
            <>
              <span className="cmp-card-price-low">{formatPrice(lowest)}</span>
              {highest !== null && highest !== lowest && (
                <>
                  <span className="cmp-card-price-sep">→</span>
                  <span className="cmp-card-price-high">{formatPrice(highest)}</span>
                </>
              )}
            </>
          )}
        </div>

        <div className="cmp-card-vendor">
          LOWEST ACROSS {product.vendorProducts.length} VENDOR{product.vendorProducts.length !== 1 ? 'S' : ''}
        </div>
      </div>

      <div className="cmp-card-separator" />

      <div className="cmp-card-actions">
        <div className="cmp-card-votes">
          <button
            className={`cmp-card-vote ${userVote === 'upvote' ? 'up active' : ''}`}
            onClick={() => handleVote('upvote')}
            disabled={votingLocked}
            title={votingLocked ? 'Voting is locked' : undefined}
          >▲ {upvotes}</button>
          <button
            className={`cmp-card-vote ${userVote === 'downvote' ? 'down active' : ''}`}
            onClick={() => handleVote('downvote')}
            disabled={votingLocked}
            title={votingLocked ? 'Voting is locked' : undefined}
          >▼ {downvotes}</button>
        </div>

        <div className="cmp-card-separator" />

        <Link href={`/products/${product.slug}`} className="cmp-card-view">
          View Product
        </Link>
      </div>
    </div>
  );
}
