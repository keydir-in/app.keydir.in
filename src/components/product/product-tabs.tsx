'use client';

/**
 * Product detail tabs: Price History plus per-category spec tabs
 * (keyboards → Build / Hardware / Components; mouse → Overview /
 * Performance / Build / Features; other categories get a single
 * Components tab with every group).
 */

import { useState, useRef } from 'react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import { PriceHistoryChart, type PriceStats } from '@/components/product/price-history-chart';
import { SpecGrid, type SpecColumnLayout } from '@/components/product/product-specs';
import ChartLineIcon from '@/components/product/chart-line-icon';
import LayoutBottombarCollapseIcon from '@/components/product/layout-bottombar-collapse-icon';
import CpuIcon from '@/components/product/cpu-icon';
import PlugConnectedIcon from '@/components/product/plug-connected-icon';
import BookIcon from '@/components/product/book-icon';
import GaugeIcon from '@/components/product/gauge-icon';
import Stack3Icon from '@/components/product/stack-3-icon';
import LayoutDashboardIcon from '@/components/product/layout-dashboard-icon';
import { CATEGORY_SPECS } from '@/lib/product-spec-config';
import type { PricePoint } from '@/lib/chart/price-chart-math';
import type { AnimatedIconHandle, AnimatedIconProps } from '@/components/product/types';

interface Props {
  productType: string;
  spec: Record<string, unknown> | null;
  history: PricePoint[];
  vendorColors: Record<string, string>;
  coupons?: Record<string, string>;
  priceStats?: PriceStats;
}

type AnimatedIcon = ForwardRefExoticComponent<AnimatedIconProps & RefAttributes<AnimatedIconHandle>>;

interface SpecTabDef {
  id: string;
  label: string;
  icon: AnimatedIcon;
  columns: SpecColumnLayout;
}

interface SpecTab extends SpecTabDef {
  titles: string[];
}

const KEYBOARD_TABS: SpecTabDef[] = [
  { id: 'build', label: 'Build', icon: LayoutBottombarCollapseIcon, columns: { columns: [['Layout & Build', 'Mounting & Internals'], ['Dimensions', 'Foam Configuration']] } },
  { id: 'hardware', label: 'Hardware', icon: CpuIcon, columns: { columns: [['PCB', 'Firmware'], ['Connectivity', 'Lighting']] } },
  { id: 'components', label: 'Components', icon: PlugConnectedIcon, columns: { full: ['Accessories'], columns: [['Switches'], ['Keycaps']] } },
];

const MOUSE_TABS: SpecTabDef[] = [
  { id: 'overview', label: 'Overview', icon: BookIcon, columns: { columns: [['Connection & Sensor', 'Physical'], ['Power', 'Compatibility', 'Warranty']] } },
  { id: 'performance', label: 'Performance', icon: GaugeIcon, columns: { full: ['Performance'], columns: [[]] } },
  { id: 'build', label: 'Build', icon: LayoutBottombarCollapseIcon, columns: { columns: [['Switches & Input'], ['Build & Features']] } },
  { id: 'features', label: 'Features', icon: Stack3Icon, columns: { full: ['Included'], columns: [[]] } },
];

const SWITCH_TABS: SpecTabDef[] = [
  { id: 'overview', label: 'Overview', icon: BookIcon, columns: { columns: [['Type & Compatibility'], ['Packaging']] } },
  { id: 'performance', label: 'Performance', icon: GaugeIcon, columns: { full: ['Performance'], columns: [[]] } },
  { id: 'materials', label: 'Materials', icon: LayoutDashboardIcon, columns: { full: ['Materials'], columns: [[]] } },
  { id: 'features', label: 'Features', icon: Stack3Icon, columns: { columns: [['Features'], ['Additional Features']] } },
];

const CATEGORY_TAB_DEFS: Record<string, SpecTabDef[]> = {
  keyboards: KEYBOARD_TABS,
  mouse: MOUSE_TABS,
  switches: SWITCH_TABS,
};

function tabTitles(def: SpecTabDef): string[] {
  return [...(def.columns.full ?? []), ...def.columns.columns.flat()];
}

export function ProductTabs({ productType, spec, history, vendorColors, coupons, priceStats }: Props) {
  const [active, setActive] = useState<string>('history');
  const iconRefs = useRef<Record<string, AnimatedIconHandle | null>>({});

  const config = CATEGORY_SPECS[productType];
  const allTitles = config ? config.groups.map((g) => g.title) : [];

  const defs = CATEGORY_TAB_DEFS[productType];
  const specTabs: SpecTab[] = defs
    ? defs
        .map((d) => ({ ...d, titles: tabTitles(d) }))
        .filter((t) => t.titles.some((x) => allTitles.includes(x)))
    : allTitles.length
      ? [{ id: 'specifications', label: 'Specifications', icon: Stack3Icon, titles: allTitles, columns: { columns: [[], []] } }]
      : [];

  const tabs: { id: string; label: string; icon: AnimatedIcon }[] = [
    { id: 'history', label: 'Price History', icon: ChartLineIcon },
    ...specTabs,
  ];

  return (
    <section className="product-section pt-tabs">
      <div className="pt-tab-bar" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            className={`pt-tab group${active === t.id ? ' is-active' : ''}`}
            onClick={() => {
              setActive(t.id);
              iconRefs.current[t.id]?.startAnimation();
            }}
            onMouseEnter={() => iconRefs.current[t.id]?.startAnimation()}
            onMouseLeave={() => iconRefs.current[t.id]?.stopAnimation()}
          >
            <span className="pt-tab-icon">
              <t.icon
                ref={(el) => {
                  iconRefs.current[t.id] = el;
                }}
                size={16}
              />
            </span>
            {t.label}
          </button>
        ))}
      </div>

      {active === 'history' && (
        <div className="pt-panel">
          <PriceHistoryChart history={history} vendorColors={vendorColors} coupons={coupons} priceStats={priceStats} />
        </div>
      )}

      {specTabs.map((t) =>
        active === t.id ? (
          <div key={t.id} className="pt-panel">
            <SpecGrid
              productType={productType}
              spec={spec}
              titles={t.titles}
              columns={t.columns}
            />
          </div>
        ) : null
      )}
    </section>
  );
}
