/**
 * Dynamic filter data builder. Reads category-specific spec configs,
 * queries distinct filter values from the database, and assembles
 * JSON filter responses for the product listing API.
 */
import { CATEGORY_SPECS, type SpecRowDef } from '@/lib/product-spec-config';
import { getFilterData } from '@/lib/repositories/product-repository';
import { unique, extractJsonArray } from '@/lib/utils';
import { NextResponse } from 'next/server';
import { CACHE, perSlugCache } from '@/lib/cache';

function collectLeafKeys(rows: SpecRowDef[]): { key: string; type: string }[] {
  const result: { key: string; type: string }[] = [];
  for (const row of rows) {
    if (row.fields) {
      if (row.type === 'bool_badges' || row.type === 'feature_badges') {
        for (const f of row.fields) result.push({ key: f.key, type: 'boolean' });
      } else if (row.type === 'materials') {
        for (const f of row.fields) result.push({ key: f.key, type: 'string' });
      }
    } else if (row.key) {
      result.push({ key: row.key, type: row.type });
    }
  }
  return result;
}

export function buildSpecSelect(category: string): Record<string, boolean> {
  const config = CATEGORY_SPECS[category];
  if (!config) return {};
  const select: Record<string, boolean> = {};
  for (const group of config.groups) {
    for (const { key } of collectLeafKeys(group.rows)) {
      select[key] = true;
    }
  }
  return select;
}

export function buildSpecFilters(specs: Record<string, unknown>[], category: string): Record<string, unknown[]> {
  const config = CATEGORY_SPECS[category];
  if (!config) return {};
  const filters: Record<string, unknown[]> = {};
  for (const group of config.groups) {
    for (const { key, type } of collectLeafKeys(group.rows)) {
      if (type === 'boolean') {
        filters[key] = [true, false];
      } else if (type === 'string[]' || type === 'tags') {
        filters[key] = unique(specs.flatMap((s) => extractJsonArray(s[key]))).sort();
      } else if (type === 'string') {
        filters[key] = unique(specs.map((s) => s[key]).filter(Boolean)).sort();
      }
    }
  }
  return filters;
}

// One wrapper per category (via perSlugCache) so the cache key explicitly
// contains the category — keyboards filters can never be served for mouse,
// regardless of how the runtime composes keys. All entries share the single
// `filters` tag so any catalog mutation revalidates every category.
const cachedFilterData = perSlugCache(
  'filters',
  300,
  () => CACHE.filters,
  async (category: string): Promise<Record<string, unknown>> => {
    const specSelect = buildSpecSelect(category);
    const { specs, brandRows, vendorRows, priceRow } = await getFilterData(category, specSelect);
    const specFilters = buildSpecFilters(specs, category);
    const brands = unique(brandRows.map((r) => r.brand?.name)).sort();
    const vendors = unique(vendorRows.map((r) => r.vendor?.name)).sort();
    const priceMin = Number(priceRow._min.effectivePrice ?? 0);
    const priceMax = Number(priceRow._max.effectivePrice ?? 0);
    return { brands, vendors, specs: specFilters, priceMin, priceMax };
  },
);

export async function buildFilterResponse(category: string) {
  const data = await cachedFilterData(category);
  return NextResponse.json(data);
}
