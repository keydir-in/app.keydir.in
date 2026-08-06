'use client';

/**
 * Product detail tabs: Description (with price history side-by-side on
 * desktop), Price History, Specifications (grouped card grid), and
 * placeholder Reviews / Discussions panels.
 */

import { useState } from 'react';
import { PriceHistoryChart } from '@/components/product/price-history-chart';
import { SpecGrid } from '@/components/product/product-specs';
import type { PricePoint } from '@/lib/chart/price-chart-math';

interface Props {
  productType: string;
  spec: Record<string, unknown> | null;
  description: string | null;
  history: PricePoint[];
  vendorColors: Record<string, string>;
}

const TABS = [
  { id: 'description', label: 'Description' },
  { id: 'history', label: 'Price History' },
  { id: 'specs', label: 'Specifications' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'discussions', label: 'Discussions' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function ProductTabs({ productType, spec, description, history, vendorColors }: Props) {
  const [active, setActive] = useState<TabId>('description');

  return (
    <section className="product-section pt-tabs">
      <div className="pt-tab-bar" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            className={`pt-tab${active === t.id ? ' is-active' : ''}`}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === 'description' && (
        <div className="pt-panel pt-panel--desc">
          <div className="pt-desc-text">
            <h2 className="pt-panel-title">Description</h2>
            {description?.trim() ? (
              <p className="pt-desc-body">{description}</p>
            ) : (
              <p className="pt-desc-body pt-desc-empty">No product overview available.</p>
            )}
          </div>
          <div className="pt-desc-chart">
            <PriceHistoryChart history={history} vendorColors={vendorColors} />
          </div>
        </div>
      )}

      {active === 'history' && (
        <div className="pt-panel">
          <PriceHistoryChart history={history} vendorColors={vendorColors} />
        </div>
      )}

      {active === 'specs' && (
        <div className="pt-panel">
          <SpecGrid productType={productType} spec={spec} />
        </div>
      )}

      {active === 'reviews' && (
        <div className="pt-panel pt-placeholder">
          <span className="pt-placeholder-label">REVIEWS</span>
          <p>Community reviews are coming soon.</p>
        </div>
      )}

      {active === 'discussions' && (
        <div className="pt-panel pt-placeholder">
          <span className="pt-placeholder-label">DISCUSSIONS</span>
          <p>Community discussions are coming soon.</p>
        </div>
      )}
    </section>
  );
}
