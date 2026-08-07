/**
 * Full product specification table. Dynamically renders spec rows
 * based on category-specific configs, supporting string, number,
 * boolean, color, tag, badge, performance grid, and material row types.
 */

import { CATEGORY_SPECS, type SpecRowDef } from '@/lib/product-spec-config';

interface Props {
  productType: string;
  spec: Record<string, unknown> | null;
}

function jsonArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function jsonRaw(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function valStr(v: unknown): string | null {
  if (typeof v === 'string' && v.trim()) return v;
  if (typeof v === 'number') return String(v);
  return null;
}

function valArr(v: unknown): string[] {
  const a = jsonArr(v);
  return a.length ? a : [];
}

function valBool(v: unknown): boolean {
  return v === true || v === 'true';
}

function valNum(v: unknown): number | null {
  if (typeof v === 'number' && !isNaN(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    const n = parseFloat(v);
    if (!isNaN(n)) return n;
  }
  return null;
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v : null;
}

function firstStr(v: unknown): string | null {
  return Array.isArray(v) ? str(v.find((x): x is string => typeof x === 'string')) : null;
}

function formatSwitchEntry(s: unknown): string | null {
  if (!s || typeof s !== 'object') return null;
  const o = s as Record<string, unknown>;
  const parts = [str(o.brand), str(o.name)].filter(Boolean);
  if (parts.length) return parts.join(' ');
  return str(o.type) ?? str(o.notes) ?? null;
}

function formatKeycapEntry(s: unknown): string | null {
  if (!s || typeof s !== 'object') return null;
  const o = s as Record<string, unknown>;
  const parts = [str(o.profile), firstStr(o.material), firstStr(o.legendType)].filter(Boolean);
  return parts.length ? parts.join(' ') : null;
}

function SimpleRow({ label, display }: { label: string; display: string }) {
  return (
    <div className="spec-row">
      <span className="spec-label">{label}</span>
      <span className="spec-value">{display}</span>
    </div>
  );
}

function ColorsRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="spec-row">
      <span className="spec-label">{label}</span>
      <span className="spec-value spec-colors">
        {items.map((c) => <span key={c} className="spec-color-tag">{c}</span>)}
      </span>
    </div>
  );
}

function TagsRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="spec-row">
      <span className="spec-label">{label}</span>
      <span className="spec-value spec-badges">
        {items.map((v) => <span key={v} className="spec-badge">{v}</span>)}
      </span>
    </div>
  );
}

function OptionsRow({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="spec-row">
      <span className="spec-label">{label}</span>
      <span className="spec-value">
        {items.map((it) => <div key={it} className="spec-option-line">• {it}</div>)}
      </span>
    </div>
  );
}

function BoolBadgesRow({ label, items }: { label: string; items: { label: string }[] }) {
  if (!items.length) return null;
  return (
    <div className="spec-row">
      <span className="spec-label">{label}</span>
      <span className="spec-value spec-badges">
        {items.map((b) => <span key={b.label} className="spec-badge spec-badge--yes">{b.label}</span>)}
      </span>
    </div>
  );
}

function FeatureBadgesRow({ label, items }: { label: string; items: { label: string }[] }) {
  if (!items.length) return null;
  return (
    <div className="spec-row">
      <span className="spec-label">{label}</span>
      <span className="spec-value spec-badges">
        {items.map((f) => <span key={f.label} className="spec-badge">{f.label}</span>)}
      </span>
    </div>
  );
}

function PerfGridRow({ label, items }: { label: string; items: { label: string; value: string }[] }) {
  if (!items.length) return null;
  return (
    <div className="spec-row spec-row--multi">
      <span className="spec-label">{label}</span>
      <span className="spec-value">
        <div className="spec-perf-grid">
          {items.map((it) => (
            <div key={it.label} className="spec-perf-item">
              <span className="spec-perf-label">{it.label}</span>
              <span className="spec-perf-value">{it.value}</span>
            </div>
          ))}
        </div>
      </span>
    </div>
  );
}

function MaterialsRow({ label, items }: { label: string; items: { label: string; value: string }[] }) {
  if (!items.length) return null;
  return (
    <div className="spec-row spec-row--multi">
      <span className="spec-label">{label}</span>
      <span className="spec-value">
        {items.map((it) => (
          <div key={it.label} className="spec-row-inner">
            <span className="spec-label-inner">{it.label}</span>
            <span className="spec-value-inner">{it.value}</span>
          </div>
        ))}
      </span>
    </div>
  );
}

function renderRow(row: SpecRowDef, spec: Record<string, unknown>): React.ReactNode {
  switch (row.type) {
    case 'string': {
      const v = valStr(spec[row.key!]);
      return v ? <SimpleRow key={row.label} label={row.label} display={v} /> : null;
    }
    case 'string[]': {
      const items = valArr(spec[row.key!]);
      return items.length ? <SimpleRow key={row.label} label={row.label} display={items.join(', ')} /> : null;
    }
    case 'boolean': {
      const v = valBool(spec[row.key!]);
      return <SimpleRow key={row.label} label={row.label} display={v ? 'Yes' : 'No'} />;
    }
    case 'switch_status': {
      const v = valBool(spec[row.key!]);
      return <SimpleRow key={row.label} label={row.label} display={v ? 'Included' : 'Barebone'} />;
    }
    case 'switch_options': {
      const items = jsonRaw(spec[row.key!])
        .map(formatSwitchEntry)
        .filter((x): x is string => x !== null);
      return <OptionsRow key={row.label} label={row.label} items={items} />;
    }
    case 'keycap_options': {
      const items = jsonRaw(spec[row.key!])
        .map(formatKeycapEntry)
        .filter((x): x is string => x !== null);
      return <OptionsRow key={row.label} label={row.label} items={items} />;
    }
    case 'number': {
      const n = valNum(spec[row.key!]);
      return n != null ? <SimpleRow key={row.label} label={row.label} display={String(n)} /> : null;
    }
    case 'number_unit': {
      const n = valNum(spec[row.key!]);
      return n != null ? <SimpleRow key={row.label} label={row.label} display={`${n}${row.unit}`} /> : null;
    }
    case 'colors': {
      const items = valArr(spec[row.key!]);
      return items.length ? <ColorsRow key={row.label} label={row.label} items={items} /> : null;
    }
    case 'tags': {
      const items = valArr(spec[row.key!]);
      return items.length ? <TagsRow key={row.label} label={row.label} items={items} /> : null;
    }
    case 'bool_badges': {
      const items = (row.fields ?? [])
        .filter((f) => valBool(spec[f.key]))
        .map((f) => ({ label: f.label }));
      return <BoolBadgesRow key={row.label} label={row.label} items={items} />;
    }
    case 'feature_badges': {
      const items = (row.fields ?? [])
        .filter((f) => valBool(spec[f.key]))
        .map((f) => ({ label: f.label }));
      return <FeatureBadgesRow key={row.label} label={row.label} items={items} />;
    }
    case 'perf_grid': {
      const items = (row.fields ?? [])
        .map((f) => {
          const n = valNum(spec[f.key]);
          return n != null ? { label: f.label, value: `${n}${f.unit ?? ''}` } : null;
        })
        .filter((x): x is { label: string; value: string } => x !== null);
      return <PerfGridRow key={row.label} label={row.label} items={items} />;
    }
    case 'materials': {
      const items = (row.fields ?? [])
        .map((f) => {
          const v = valStr(spec[f.key]);
          return v ? { label: f.label, value: v } : null;
        })
        .filter((x): x is { label: string; value: string } => x !== null);
      return <MaterialsRow key={row.label} label={row.label} items={items} />;
    }
    default:
      return null;
  }
}

export function SpecGrid({ productType, spec }: Props) {
  const config = CATEGORY_SPECS[productType];
  if (!config || !spec) return null;

  const groups = config.groups
    .map((g) => ({
      ...g,
      renderedRows: g.rows
        .map((r) => renderRow(r, spec))
        .filter((r): r is React.ReactNode => r !== null),
    }))
    .filter((g) => g.renderedRows.length > 0);

  if (!groups.length) return null;

  return (
    <div className="spec-groups">
      {groups.map((g) => (
        <div key={g.title} className="spec-group">
          <div className="spec-group-header">
            <span className="spec-group-title">{g.title}</span>
          </div>
          <div className="spec-group-body">
            {g.renderedRows}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductSpecs({ productType, spec }: Props) {
  if (!CATEGORY_SPECS[productType] || !spec) return null;
  const groups = SpecGrid({ productType, spec });
  if (groups === null) return null;

  return (
    <section className="product-section">
      <div className="sec-head">
        <h2><em className="text-[var(--yellow)]">SPECIFICATIONS</em></h2>
      </div>
      {groups}
    </section>
  );
}
