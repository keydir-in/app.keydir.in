/**
 * Spec formatting, comparison, and definition helpers for the compare feature.
 * Provides formatSpecValue for display formatting, allSame for diff detection,
 * and derives keyboard/mouse spec groups from the canonical category config.
 * Exports: formatSpecValue, allSame, FormattedSpec, KEYBOARD_SPEC_GROUPS, MOUSE_SPEC_GROUPS
 */

import type { SpecGroup, SpecRow } from './compare-types';
import { CATEGORY_SPECS, type SpecRowDef, type SpecGroupDef } from '@/lib/product-spec-config';

function json(v: unknown): string[] {
  return Array.isArray(v) ? v : [];
}

export interface FormattedSpec {
  display: string;
  lines: string[];
  isMulti: boolean;
  isBool: boolean;
  boolVal: boolean | null;
}

export function formatSpecValue(spec: Record<string, unknown>, key: string, type: SpecRow['type'], unit?: string): FormattedSpec {
  const v = spec[key];
  if (v === null || v === undefined) return { display: '—', lines: ['—'], isMulti: false, isBool: false, boolVal: null };
  switch (type) {
    case 'string':
      if (typeof v !== 'string' || !v.trim()) return { display: '—', lines: ['—'], isMulti: false, isBool: false, boolVal: null };
      return { display: v, lines: [v], isMulti: false, isBool: false, boolVal: null };
    case 'string[]': {
      const arr = json(v).filter(Boolean);
      return { display: arr.join('\n'), lines: arr.length ? arr : ['—'], isMulti: arr.length > 1, isBool: false, boolVal: null };
    }
    case 'boolean':
      return { display: v ? 'Yes' : 'No', lines: [v ? 'Yes' : 'No'], isMulti: false, isBool: true, boolVal: !!v };
    case 'number':
      return { display: typeof v === 'number' ? String(v) : '—', lines: [typeof v === 'number' ? String(v) : '—'], isMulti: false, isBool: false, boolVal: null };
    case 'number_g':
      return { display: typeof v === 'number' ? `${v}g` : '—', lines: [typeof v === 'number' ? `${v}g` : '—'], isMulti: false, isBool: false, boolVal: null };
    case 'number_mm':
      return { display: typeof v === 'number' ? `${v}mm` : '—', lines: [typeof v === 'number' ? `${v}mm` : '—'], isMulti: false, isBool: false, boolVal: null };
    case 'number_mAh':
      return { display: typeof v === 'number' ? `${v}mAh` : '—', lines: [typeof v === 'number' ? `${v}mAh` : '—'], isMulti: false, isBool: false, boolVal: null };
    case 'number_Hz':
      return { display: typeof v === 'number' ? `${v}Hz` : '—', lines: [typeof v === 'number' ? `${v}Hz` : '—'], isMulti: false, isBool: false, boolVal: null };
    case 'number_deg':
      return { display: typeof v === 'number' ? `${v}°` : '—', lines: [typeof v === 'number' ? `${v}°` : '—'], isMulti: false, isBool: false, boolVal: null };
    case 'number_M':
      return { display: typeof v === 'number' ? `${v} Million` : '—', lines: [typeof v === 'number' ? `${v} Million` : '—'], isMulti: false, isBool: false, boolVal: null };
    case 'number_unit': {
      const u = unit ?? '';
      return { display: typeof v === 'number' ? `${v}${u}` : '—', lines: [typeof v === 'number' ? `${v}${u}` : '—'], isMulti: false, isBool: false, boolVal: null };
    }
  }
}

function normalize(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

export function allSame(specs: Record<string, unknown>[], row: SpecRow): boolean {
  if (specs.length < 2) return true;
  const first = formatSpecValue(specs[0], row.key, row.type, row.unit);
  return specs.every((s) => {
    const cur = formatSpecValue(s, row.key, row.type, row.unit);
    return normalize(first.display) === normalize(cur.display);
  });
}

// ── Derive compare groups from canonical CATEGORY_SPECS ──

const SIMPLE_TYPES = new Set(['string', 'string[]', 'boolean', 'number', 'number_unit']);

function flattenRows(rows: SpecRowDef[]): SpecRow[] {
  const out: SpecRow[] = [];
  for (const r of rows) {
    if (SIMPLE_TYPES.has(r.type)) {
      out.push({ label: r.label, key: r.key!, type: r.type as SpecRow['type'], unit: r.unit });
    } else if ((r.type === 'bool_badges' || r.type === 'feature_badges') && r.fields) {
      for (const f of r.fields) out.push({ label: f.label, key: f.key, type: 'boolean' });
    } else if (r.type === 'perf_grid' && r.fields) {
      for (const f of r.fields) out.push({ label: f.label, key: f.key, type: 'number_unit', unit: f.unit });
    } else if (r.type === 'materials' && r.fields) {
      for (const f of r.fields) out.push({ label: f.label, key: f.key, type: 'string' });
    } else if (r.type === 'colors' || r.type === 'tags') {
      out.push({ label: r.label, key: r.key!, type: 'string[]' });
    }
  }
  return out;
}

function toCompareGroups(groups: SpecGroupDef[]): SpecGroup[] {
  return groups.map((g) => ({ title: g.title, rows: flattenRows(g.rows) }));
}

export const KEYBOARD_SPEC_GROUPS: SpecGroup[] = toCompareGroups(CATEGORY_SPECS.keyboards.groups);
export const MOUSE_SPEC_GROUPS: SpecGroup[] = toCompareGroups(CATEGORY_SPECS.mouse.groups);
