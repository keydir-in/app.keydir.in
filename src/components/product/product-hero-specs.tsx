/**
 * Product hero key specifications display. Renders the most important
 * spec rows (defined per category in CATEGORY_SPECS heroFields) as
 * icon + label + value rows below the price block.
 */

import { CATEGORY_SPECS } from '@/lib/product-spec-config';

interface Props {
  productType: string;
  spec: Record<string, unknown> | null;
}

function toStr(v: unknown): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return '';
}

function toArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

export function ProductHeroSpecs({ productType, spec }: Props) {
  const config = CATEGORY_SPECS[productType];
  if (!config || !spec) return null;

  const rows: [string, string, string][] = config.heroFields
    .map((f) => {
      const raw = spec[f.key];
      let val = '';
      if (f.type === 'string[]') {
        const arr = toArr(raw);
        val = arr.length ? arr.join(f.joiner ?? ', ') : '';
      } else if (f.type === 'number') {
        if (raw != null && raw !== '') {
          val = `${raw}${f.unit ?? ''}`;
        }
      } else {
        val = toStr(raw);
      }
      return val.trim() ? [f.label, f.icon, val] as [string, string, string] : null;
    })
    .filter((r): r is [string, string, string] => r !== null);

  if (!rows.length) return null;

  return (
    <div className="product-hero-specs">
      {rows.map(([label, icon, val]) => (
        <div key={label} className="product-hero-spec-row">
          <span className="product-hero-spec-icon">{icon}</span>
          <span className="product-hero-spec-label">{label}</span>
          <span className="product-hero-spec-value">{val}</span>
        </div>
      ))}
    </div>
  );
}
