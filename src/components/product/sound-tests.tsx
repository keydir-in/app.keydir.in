'use client';

/**
 * Standalone Sound Tests section (below Price History + Specifications).
 * Lists sound test cards (newest first), shows an empty state when there
 * are none, renders the upload form (verified users only), and lets the
 * owner (or an admin) delete a test with an optimistic UI update — no page
 * reload. Paginated in chunks of 10.
 */

import { useState } from 'react';
import { SoundTestCard } from './sound-test-card';
import { SoundTestForm } from './sound-test-form';
import type { SoundTestItem, SwitchOption } from '@/types';

const PAGE_SIZE = 5;

interface SoundTestsProps {
  productId: string;
  productSlug: string;
  productName: string;
  productType: string;
  canUpload: boolean;
  isLoggedIn: boolean;
  currentProfileId: string | null;
  isAdmin: boolean;
  items: SoundTestItem[];
  switches: SwitchOption[];
  userSoundTestCount?: number;
}

export function SoundTests({ productId, productSlug, productName, productType, canUpload, isLoggedIn, currentProfileId, isAdmin, items: initialItems, switches, userSoundTestCount = 0 }: SoundTestsProps) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<SoundTestItem | null>(null);
  const [delta, setDelta] = useState(0);

  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const atLimit = currentProfileId != null && userSoundTestCount + delta >= 10;

  function handleAdd() {
    if (!isLoggedIn) {
      setNotice('Log in and complete your auth setup to upload sound tests.');
      return;
    }
    if (!canUpload) {
      setNotice('Connect Password, Google & Discord (Auth Status \u2192 ELIGIBLE) to unlock sound test uploads.');
      return;
    }
    if (atLimit) {
      setNotice('You\u2019ve reached the max of 10 sound tests. Delete one to upload another.');
      return;
    }
    setNotice(null);
    setShowForm(true);
  }

  function canDelete(test: SoundTestItem): boolean {
    return isAdmin || (currentProfileId != null && test.profileId === currentProfileId);
  }

  function restore(test: SoundTestItem) {
    setItems((prev) => [test, ...prev].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }

  async function confirmDelete() {
    const test = deleting;
    if (!test) return;
    setDeleting(null);
    setItems((prev) => prev.filter((t) => t.id !== test.id));
    setDelta((d) => d - 1);
    try {
      const res = await fetch(`/api/sound-tests/${test.id}`, { method: 'DELETE' });
      if (!res.ok) {
        restore(test);
        setDelta((d) => d + 1);
        const body = await res.json().catch(() => ({}));
        setNotice(body.error || 'Delete failed');
      }
    } catch {
      restore(test);
      setDelta((d) => d + 1);
      setNotice('Delete failed — check your connection');
    }
  }

  function handleCreated(test: SoundTestItem) {
    setItems((prev) => [test, ...prev]);
    setDelta((d) => d + 1);
    setShowForm(false);
  }

  return (
    <section className="product-section">
      <div className="sec-head">
        <h2>
          SOUND <em className="text-[var(--yellow)]">TESTS</em>
        </h2>
        <div className="st-head-actions">
          <span className="sec-tag text-[var(--yellow)]">
            {items.length} SOUND TEST{items.length !== 1 ? 'S' : ''}
          </span>
          <button type="button" className="btn-secondary st-add-btn" onClick={handleAdd}>
            {atLimit ? 'MAX SOUND TESTS' : '+ ADD SOUND TEST'}
          </button>
        </div>
      </div>

      {notice && <div className="st-notice">{notice}</div>}

      <div className="pt-panel">
        {items.length === 0 ? (
          <div className="pt-placeholder">
            <div className="pt-placeholder-label">No sound tests yet.</div>
            <p>Be the first to upload one.</p>
          </div>
        ) : (
          <div className="st-list">
            {visibleItems.map((test) => (
              <SoundTestCard
                key={test.id}
                test={test}
                productId={productId}
                productSlug={productSlug}
                canDelete={canDelete(test)}
                onDelete={() => setDeleting(test)}
              />
            ))}
          </div>
        )}

        {pageCount > 1 && (
          <div className="st-pagination">
            <button type="button" className="btn-secondary" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
              PREV
            </button>
            <span className="st-pagination-info">Page {currentPage} of {pageCount}</span>
            <button type="button" className="btn-secondary" disabled={currentPage >= pageCount} onClick={() => setPage((p) => Math.min(p + 1, pageCount))}>
              NEXT
            </button>
          </div>
        )}
      </div>

      {showForm && <SoundTestForm productId={productId} productName={productName} productType={productType} switches={switches} onClose={() => setShowForm(false)} onCreated={handleCreated} />}

      {deleting && (
        <div className="st-overlay" onClick={() => setDeleting(null)}>
          <div className="st-form st-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="st-form-head">
              <span className="st-form-title">
                DELETE <em>SOUND TEST</em>
              </span>
              <button type="button" className="st-form-close" onClick={() => setDeleting(null)} aria-label="Close">×</button>
            </div>
            <p className="st-confirm-text">Delete this sound test? This action cannot be undone.</p>
            <div className="st-form-actions">
              <button type="button" className="btn-secondary" onClick={() => setDeleting(null)}>Cancel</button>
              <button type="button" className="btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
