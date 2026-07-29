/**
 * Builds Prisma WHERE clauses and ORDER BY from URL search params.
 * Handles spec-based filtering (array, string, boolean keys), vendor product
 * filters (price range, availability, vendors), and sort ordering.
 */
import { Prisma } from '@prisma/client';

export interface SpecFilterConfig {
  arrayKeys: readonly string[];
  stringKeys: readonly string[];
  booleanKeys: readonly string[];
  specRelationKey: string;
}

export function buildSpecWhere(
  searchParams: URLSearchParams,
  config: SpecFilterConfig,
): { specWhere: Record<string, unknown> } | Record<string, unknown> {
  const specAnd: Record<string, unknown>[] = [];

  for (const key of config.arrayKeys) {
    const values = searchParams.getAll(key);
    if (values.length > 0) {
      specAnd.push({ OR: values.map((v) => ({ [key]: { path: [], equals: v } })) });
    }
  }

  for (const key of config.stringKeys) {
    const values = searchParams.getAll(key);
    if (values.length > 0) {
      specAnd.push({ [key]: { in: values } });
    }
  }

  for (const key of config.booleanKeys) {
    const val = searchParams.get(key);
    if (val === 'true' || val === 'false') {
      specAnd.push({ [key]: val === 'true' });
    }
  }

  const special = searchParams.get('special');
  if (special) {
    specAnd.push({ specialFeatures: { contains: special, mode: 'insensitive' } });
  }

  if (specAnd.length === 0) return {};

  return { [config.specRelationKey]: { AND: specAnd } };
}

export interface VendorProductFilterInput {
  priceMin?: string | null;
  priceMax?: string | null;
  availability?: string[];
  brands?: string[];
  vendors?: string[];
}

export function buildVendorProductWhere(filters: VendorProductFilterInput): Prisma.ProductWhereInput {
  const vpConditions: Prisma.VendorProductWhereInput[] = [];

  if (filters.priceMin || filters.priceMax) {
    vpConditions.push({
      effectivePrice: {
        ...(filters.priceMin ? { gte: parseFloat(filters.priceMin) } : {}),
        ...(filters.priceMax ? { lte: parseFloat(filters.priceMax) } : {}),
      },
    });
  }

  if (filters.vendors && filters.vendors.length > 0) {
    vpConditions.push({ vendor: { name: { in: filters.vendors } } });
  }

  if (filters.availability && filters.availability.length > 0) {
    const stockValues = filters.availability.map((s) => s.toLowerCase().replace(/\s+/g, '_'));
    vpConditions.push({ stockStatus: { in: stockValues } });
  }

  if (vpConditions.length === 0) return {};

  return { vendorProducts: { some: { AND: vpConditions } } };
}

export type SortOption = 'lowest' | 'highest' | 'newest' | 'popular' | 'vendors' | 'drops' | 'alpha';

export function buildOrderBy(sort: SortOption): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case 'lowest':
    case 'drops':
      return { vendorProducts: { _count: 'asc' } };
    case 'highest':
      return { vendorProducts: { _count: 'desc' } };
    case 'newest':
      return { createdAt: 'desc' };
    case 'popular':
      return { votes: { _count: 'desc' } };
    case 'vendors':
      return { vendorProducts: { _count: 'desc' } };
    case 'alpha':
      return { name: 'asc' };
    default:
      return { createdAt: 'desc' };
  }
}

export function buildProductWhere(
  productType: string,
  searchParams: URLSearchParams,
  config: SpecFilterConfig,
  extraFilters?: { brands?: string[] },
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { productType };

  const q = searchParams.get('q');
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { brand: { name: { contains: q, mode: 'insensitive' } } },
    ];
  }

  if (extraFilters?.brands && extraFilters.brands.length > 0) {
    where.brand = { name: { in: extraFilters.brands } };
  }

  const specResult = buildSpecWhere(searchParams, config);
  if ('specWhere' in specResult || Object.keys(specResult).length > 0) {
    Object.assign(where, specResult);
  }

  const vpWhere = buildVendorProductWhere({
    priceMin: searchParams.get('priceMin'),
    priceMax: searchParams.get('priceMax'),
    availability: searchParams.getAll('availability'),
    vendors: searchParams.getAll('vendor'),
  });
  if (Object.keys(vpWhere).length > 0) {
    Object.assign(where, vpWhere);
  }

  return where;
}
