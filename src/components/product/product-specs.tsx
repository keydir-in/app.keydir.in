/**
 * Product specification modules. Renders hardware spec panels per category,
 * always showing every card with muted placeholders for missing values.
 * Switch and keycap options render as compact text-only cards, and dimension
 * triplets group into a single row.
 */

import Link from 'next/link';
import {
  Ruler, Wrench, CircuitBoard, PlugZap, Lightbulb, SlidersHorizontal,
  Layers, Package, Tags, Sparkles, Gauge, Boxes, PackageOpen, Factory,
  Type, Languages, Fingerprint, StickyNote, Cpu, Battery, ShieldCheck,
  SquareStack, Plus, type LucideIcon,
} from 'lucide-react';
import { CATEGORY_SPECS, type SpecRowDef } from '@/lib/product-spec-config';

interface Props {
  productType: string;
  spec: Record<string, unknown> | null;
  titles?: string[];
  columns?: SpecColumnLayout;
}

export interface SpecColumnLayout {
  full?: string[];
  columns: string[][];
}

function jsonArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const x of v) {
    if (typeof x !== 'string' || !x.trim()) continue;
    for (const part of x.split(',')) {
      const p = part.trim();
      if (p && !out.includes(p)) out.push(p);
    }
  }
  return out;
}

function jsonRaw(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

function valStr(v: unknown): string | null {
  if (typeof v === 'string' && v.trim()) return v.trim();
  if (typeof v === 'number') return String(v);
  return null;
}

function valArr(v: unknown): string[] {
  return jsonArr(v);
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

/* ── Group icons ── */

const GROUP_ICONS: Record<string, LucideIcon> = {
  'Layout & Build': Ruler,
  Dimensions: Ruler,
  'Mounting & Internals': Wrench,
  'Foam Configuration': Boxes,
  PCB: CircuitBoard,
  Connectivity: PlugZap,
  Firmware: Cpu,
  Lighting: Lightbulb,
  Switches: SlidersHorizontal,
  Keycaps: Layers,
  Accessories: Package,
  'Type & Compatibility': Tags,
  Features: Sparkles,
  Performance: Gauge,
  Materials: Boxes,
  'Additional Features': Plus,
  Packaging: PackageOpen,
  'Profile & Layout': SquareStack,
  'Material & Manufacturing': Factory,
  Legends: Type,
  'Language & Layout': Languages,
  Physical: Ruler,
  Identity: Fingerprint,
  Inclusions: PackageOpen,
  Notes: StickyNote,
  'Connection & Sensor': PlugZap,
  'Switches & Input': Cpu,
  Power: Battery,
  'Build & Features': Wrench,
  Compatibility: Cpu,
  Included: Package,
  Warranty: ShieldCheck,
};

function GroupIcon({ title }: { title: string }) {
  const Icon = GROUP_ICONS[title] ?? Layers;
  return <Icon size={20} strokeWidth={2} className="spec-module-icon" />;
}

/* ── Row renderers ── */

const NOT_SPECIFIED = 'Not specified';

function SimpleRow({ label, display, missing }: { label: string; display: string; missing?: boolean }) {
  return (
    <div className="spec-row">
      <span className="spec-label">{label}</span>
      <span className={`spec-value${missing ? ' spec-value--muted' : ''}`}>{display}</span>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return <SimpleRow label={label} display={NOT_SPECIFIED} missing />;
}

function BoolChipRow({ label, yes }: { label: string; yes: boolean }) {
  return (
    <SimpleRow
      label={label}
      display={yes ? 'Yes' : 'No'}
      missing={!yes}
    />
  );
}

function ChipsRow({ label, items, tone }: { label: string; items: string[]; tone?: 'yes' }) {
  return (
    <div className="spec-row">
      <span className="spec-label">{label}</span>
      <span className="spec-value spec-chips">
        {items.map((v) => (
          <span key={v} className={`spec-chip${tone === 'yes' ? ' spec-chip--yes' : ''}`}>{v}</span>
        ))}
      </span>
    </div>
  );
}

function ColorsRow({ label, items }: { label: string; items: string[] }) {
  return <ChipsRow label={label} items={items} />;
}

function TagsRow({ label, items }: { label: string; items: string[] }) {
  return <ChipsRow label={label} items={items} />;
}

function BoolBadgesRow({ label, items }: { label: string; items: { label: string }[] }) {
  return items.length ? <ChipsRow label={label} items={items.map((b) => b.label)} tone="yes" /> : <EmptyRow label={label} />;
}

function FeatureBadgesRow({ label, items }: { label: string; items: { label: string }[] }) {
  return items.length ? <ChipsRow label={label} items={items.map((f) => f.label)} /> : <EmptyRow label={label} />;
}

function PerfGridRow({ label, items }: { label: string; items: { label: string; value: string }[] }) {
  if (!items.length) return <EmptyRow label={label} />;
  return (
    <div className="spec-row spec-row--multi">
      <span className="spec-label">{label}</span>
      <div className="spec-perf-grid">
        {items.map((it) => (
          <div key={it.label} className="spec-perf-item">
            <span className="spec-perf-label">{it.label}</span>
            <span className="spec-perf-value">{it.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MaterialsRow({ label, items }: { label: string; items: { label: string; value: string }[] }) {
  if (!items.length) return <EmptyRow label={label} />;
  return (
    <div className="spec-row spec-row--multi">
      <span className="spec-label">{label}</span>
      <div>
        {items.map((it) => (
          <div key={it.label} className="spec-row-inner">
            <span className="spec-label-inner">{it.label}</span>
            <span className="spec-value-inner">{it.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderRow(row: SpecRowDef, spec: Record<string, unknown>): React.ReactNode {
  switch (row.type) {
    case 'string': {
      const v = valStr(spec[row.key!]);
      return v ? <SimpleRow key={row.label} label={row.label} display={v} /> : <EmptyRow key={row.label} label={row.label} />;
    }
    case 'string[]': {
      const items = valArr(spec[row.key!]);
      return items.length ? <ChipsRow key={row.label} label={row.label} items={items} /> : <EmptyRow key={row.label} label={row.label} />;
    }
    case 'boolean': {
      return <BoolChipRow key={row.label} label={row.label} yes={valBool(spec[row.key!])} />;
    }
    case 'number': {
      const n = valNum(spec[row.key!]);
      return n != null ? <SimpleRow key={row.label} label={row.label} display={String(n)} /> : <EmptyRow key={row.label} label={row.label} />;
    }
    case 'number_unit': {
      const n = valNum(spec[row.key!]);
      return n != null ? <SimpleRow key={row.label} label={row.label} display={`${n}${row.unit}`} /> : <EmptyRow key={row.label} label={row.label} />;
    }
    case 'colors': {
      const items = valArr(spec[row.key!]);
      return items.length ? <ColorsRow key={row.label} label={row.label} items={items} /> : <EmptyRow key={row.label} label={row.label} />;
    }
    case 'tags': {
      const items = valArr(spec[row.key!]);
      return items.length ? <TagsRow key={row.label} label={row.label} items={items} /> : <EmptyRow key={row.label} label={row.label} />;
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

/* ── Switch & keycap option cards ── */

interface SwitchOpt {
  name?: string | null;
  type?: string | null;
  brand?: string | null;
  opForce?: string | null;
  lubed?: boolean;
}

function normSwitch(s: unknown): SwitchOpt | null {
  if (!s || typeof s !== 'object') return null;
  const o = s as Record<string, unknown>;
  const name = str(o.name) ?? str(o.linkedSwitchName);
  const type = str(o.type);
  if (!name && !type) return null;
  const force = o.opForce ?? o.operatingForce ?? o.force;
  const opForce = typeof force === 'number' ? `${force}gf` : str(force);
  return {
    name,
    type,
    brand: str(o.brand) ?? str(o.manufacturer) ?? str(o.linkedSwitchName),
    opForce,
    lubed: valBool(o.lubed) || valBool(o.factoryLubed),
  };
}

interface KeycapOpt {
  profile?: string | null;
  material?: string[] | null;
  legendType?: string[] | null;
  legendPlacement?: string[] | null;
}

function normKeycap(s: unknown): KeycapOpt | null {
  if (!s || typeof s !== 'object') return null;
  const o = s as Record<string, unknown>;
  const material = jsonArr(o.material);
  const legendType = jsonArr(o.legendType);
  const legendPlacement = jsonArr(o.legendPlacement);
  const profile = str(o.profile);
  if (!profile && !material.length && !legendType.length && !legendPlacement.length) return null;
  return {
    profile,
    material,
    legendType,
    legendPlacement,
  };
}

function OptionCard({ href, name, badges, linkLabel }: {
  href: string;
  name: string;
  badges: React.ReactNode;
  linkLabel: string;
}) {
  return (
    <Link href={href} className="spec-opt-card">
      <div className="spec-opt-name">{name}</div>
      {badges && <div className="spec-opt-badges">{badges}</div>}
      <span className="spec-opt-link">{linkLabel} →</span>
    </Link>
  );
}

function SwitchModuleBody({ spec }: { spec: Record<string, unknown> }) {
  const entries = jsonRaw(spec.switches)
    .map(normSwitch)
    .filter((s): s is SwitchOpt => s !== null);

  if (!entries.length) {
    return (
      <div className="spec-module-body">
        <div className="spec-note">No switch data available</div>
      </div>
    );
  }
  return (
    <div className="spec-module-body">
      <div className="spec-opts">
        {entries.map((sw, i) => (
          <OptionCard
            key={sw.name ?? sw.type ?? i}
            href="/switches"
            name={sw.name ?? sw.type ?? `Switch Option ${i + 1}`}
            linkLabel="View Switch"
            badges={
              <>
                {sw.type && <span className="spec-chip">{sw.type}</span>}
                {sw.opForce && <span className="spec-chip">{sw.opForce}</span>}
                {sw.lubed && <span className="spec-chip spec-chip--yes">Factory Lubed</span>}
              </>
            }
          />
        ))}
      </div>
    </div>
  );
}

function KeycapModuleBody({ spec }: { spec: Record<string, unknown> }) {
  const entries = jsonRaw(spec.keycaps)
    .map(normKeycap)
    .filter((k): k is KeycapOpt => k !== null);

  if (!entries.length) {
    return (
      <div className="spec-module-body">
        <div className="spec-note">No keycap data available</div>
      </div>
    );
  }
  return (
    <div className="spec-module-body">
      <div className="spec-opts">
        {entries.map((kc, i) => (
          <OptionCard
            key={kc.profile ?? kc.material?.[0] ?? kc.legendType?.[0] ?? i}
            href="/keycaps"
            name={kc.profile ?? kc.material?.[0] ?? kc.legendType?.[0] ?? `Keycap Set ${i + 1}`}
            linkLabel="View Keycap"
            badges={
              <>
                {kc.material?.map((m) => <span key={m} className="spec-chip">{m}</span>)}
                {kc.legendType?.map((l) => <span key={l} className="spec-chip">{l}</span>)}
                {kc.legendPlacement?.map((l) => <span key={l} className="spec-chip">{l}</span>)}
              </>
            }
          />
        ))}
      </div>
    </div>
  );
}

function SpecModule({ title, fullWidth, children }: { title: string; fullWidth?: boolean; children: React.ReactNode }) {
  return (
    <section className={`spec-module${fullWidth ? ' spec-module--full' : ''}`}>
      <header className="spec-module-head">
        <GroupIcon title={title} />
        <span className="spec-module-title">{title}</span>
      </header>
      <div className="spec-module-body">{children}</div>
    </section>
  );
}

/* ── Grid ── */

const FIXED_ORDER = [
  'Layout & Build',
  'Dimensions',
  'Mounting & Internals',
  'Foam Configuration',
  'PCB',
  'Connectivity',
  'Firmware',
  'Lighting',
  'Switches',
  'Keycaps',
  'Accessories',
];

interface RenderedGroup {
  title: string;
  node: React.ReactNode;
}

export function SpecGrid({ productType, spec, titles, columns }: Props) {
  const config = CATEGORY_SPECS[productType];
  if (!config || !spec) return null;

  const byTitle = new Map(config.groups.map((g) => [g.title, g] as const));
  const ordered = [
    ...FIXED_ORDER.map((t) => byTitle.get(t)),
    ...config.groups.map((g) => byTitle.get(g.title)),
  ]
    .filter((g): g is NonNullable<typeof g> => g !== undefined)
    .filter((g) => !titles || titles.includes(g.title));
  const seen = new Set<string>();
  const groups: RenderedGroup[] = ordered
    .filter((g) => (seen.has(g.title) ? false : (seen.add(g.title), true)))
    .map<RenderedGroup>((g) => {
      if (g.title === 'Switches') return { title: g.title, node: <SwitchModuleBody spec={spec} /> };
      if (g.title === 'Keycaps') return { title: g.title, node: <KeycapModuleBody spec={spec} /> };

      const rows: React.ReactNode[] = g.rows
        .map((r) => renderRow(r, spec))
        .filter((n): n is NonNullable<React.ReactNode> => n != null);
      return { title: g.title, node: rows };
    });

  if (!groups.length) return null;

  const full = new Set(columns?.full ?? []);
  const colCount = Math.max(1, columns?.columns.length ?? 1);
  const colNodes: RenderedGroup[][] = Array.from({ length: colCount }, () => []);

  let rr = 0;
  for (const g of groups) {
    if (full.has(g.title)) continue;
    let placed = false;
    for (let i = 0; i < colCount && !placed; i++) {
      if (columns?.columns[i]?.includes(g.title)) {
        colNodes[i].push(g);
        placed = true;
      }
    }
    if (!placed) colNodes[rr++ % colCount].push(g);
  }

  const fullNodes = groups.filter((g) => full.has(g.title));

  return (
    <div className="spec-shell">
      <div className="spec-groups">
        {fullNodes.map((g) => (
          <SpecModule key={g.title} title={g.title} fullWidth>
            {g.node}
          </SpecModule>
        ))}
        {colNodes.filter((c) => c.length > 0).map((col, i) => (
          <div key={i} className="spec-col">
            {col.map((g) => (
              <SpecModule key={g.title} title={g.title}>
                {g.node}
              </SpecModule>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
