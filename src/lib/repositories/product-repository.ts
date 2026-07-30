/**
 * Prisma-based product repository. Provides queries for product cards,
 * detail pages, comparison views, filtering with spec data, best deals,
 * trending products, and user vote/collection lookups.
 */
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { extractJsonArray, unique } from '@/lib/utils';

export { extractJsonArray, unique };

const PRODUCT_CARD_INCLUDE = {
  brand: { select: { name: true } },
  vendorProducts: {
    select: {
      totalPrice: true,
      effectivePrice: true,
      _count: { select: { coupons: { where: { enabled: true } } } },
    },
    orderBy: { effectivePrice: 'asc' as const },
    take: 1,
  },
  votes: { select: { type: true } },
  _count: { select: { vendorProducts: true } },
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof PRODUCT_CARD_INCLUDE }>;

export async function findProductCards(
  where: Prisma.ProductWhereInput,
  orderBy: Prisma.ProductOrderByWithRelationInput,
  take: number,
  skip?: number,
): Promise<ProductWithRelations[]> {
  return prisma.product.findMany({
    where,
    orderBy,
    take,
    ...(skip ? { skip } : {}),
    include: PRODUCT_CARD_INCLUDE,
  });
}

export async function countProducts(where: Prisma.ProductWhereInput): Promise<number> {
  return prisma.product.count({ where });
}

export async function getUserVotes(
  profileId: string,
  productIds: string[],
): Promise<Record<string, string>> {
  const votes = await prisma.vote.findMany({
    where: { profileId, productId: { in: productIds } },
    select: { productId: true, type: true },
  });
  return Object.fromEntries(votes.map((v) => [v.productId, v.type]));
}

export async function findBestDeals() {
  return prisma.vendorProduct.findMany({
    orderBy: { effectivePrice: 'asc' },
    take: 10,
    where: { stockStatus: { in: ['in_stock', 'preorder'] } },
    include: {
      product: {
        select: {
          id: true, name: true, slug: true, image: true,
          brand: { select: { name: true } },
        },
      },
      vendor: { select: { name: true } },
    },
  });
}

export async function findTrendingProducts() {
  return prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true, name: true, slug: true, image: true, productType: true, createdAt: true,
      brand: { select: { name: true } },
      votes: { select: { type: true } },
    },
  });
}

type SpecDelegate = {
  findMany(args: { where: { product: { productType: string } }; select: Record<string, boolean> }): Promise<Record<string, unknown>[]>;
};

const SPEC_MODEL_MAP: Record<string, SpecDelegate> = {
  keyboards: prisma.keyboardSpec as unknown as SpecDelegate,
  switches: prisma.switchSpec as unknown as SpecDelegate,
  keycaps: prisma.keycapSpec as unknown as SpecDelegate,
  mouse: prisma.mouseSpec as unknown as SpecDelegate,
};

export async function getFilterData(productType: string, specSelect: Record<string, boolean>) {
  const model = SPEC_MODEL_MAP[productType] ?? SPEC_MODEL_MAP.keyboards;

  const [specs, brandRows, vendorRows, priceRow] = await Promise.all([
    model.findMany({
      where: { product: { productType } },
      select: specSelect,
    }),
    prisma.product.findMany({
      where: { productType, brandId: { not: null } },
      select: { brand: { select: { name: true } } },
      distinct: ['brandId'],
    }),
    prisma.vendorProduct.findMany({
      where: { product: { productType } },
      select: { vendor: { select: { name: true } } },
      distinct: ['vendorId'],
    }),
    prisma.vendorProduct.aggregate({
      where: { product: { productType } },
      _min: { effectivePrice: true },
      _max: { effectivePrice: true },
    }),
  ]);

  return { specs, brandRows, vendorRows, priceRow };
}

export { prisma };

// ── Product Detail Page ──

const PRODUCT_DETAIL_INCLUDE = {
  brand: { select: { name: true, slug: true } },
  keyboardSpec: true,
  switchSpec: true,
  keycapSpec: true,
  mouseSpec: true,
  vendorProducts: {
    include: {
      vendor: { select: { id: true, name: true, slug: true, logo: true, chartColor: true, enabled: true, scraperEnabled: true, affiliateLink: true } },
      variants: { orderBy: { createdAt: 'asc' as const } },
      coupons: { orderBy: { createdAt: 'asc' as const } },
      priceHistory: { orderBy: { recordedAt: 'asc' as const }, take: 60 },
    },
    where: { vendor: { enabled: true } },
    orderBy: { effectivePrice: 'asc' as const },
  },
  votes: { select: { type: true } },
} satisfies Prisma.ProductInclude;

export type ProductWithDetails = Prisma.ProductGetPayload<{ include: typeof PRODUCT_DETAIL_INCLUDE }>;

export async function findProductBySlug(slug: string): Promise<ProductWithDetails | null> {
  return prisma.product.findUnique({ where: { slug }, include: PRODUCT_DETAIL_INCLUDE });
}

// ── Compare Page ──

const COMPARE_PRODUCT_INCLUDE = {
  brand: { select: { name: true, slug: true } },
  keyboardSpec: true,
  mouseSpec: true,
  switchSpec: true,
  keycapSpec: true,
  vendorProducts: {
    include: { vendor: { select: { name: true, chartColor: true } } },
    where: { vendor: { enabled: true } },
    orderBy: { effectivePrice: 'asc' as const },
  },
  votes: { select: { type: true } },
} satisfies Prisma.ProductInclude;

export type CompareProductRaw = Prisma.ProductGetPayload<{ include: typeof COMPARE_PRODUCT_INCLUDE }>;

export async function findProductsForCompare(
  slugs: string[],
  productType: string,
): Promise<CompareProductRaw[]> {
  if (slugs.length === 0) return [];
  const raw = await prisma.product.findMany({
    where: { slug: { in: slugs }, productType },
    include: COMPARE_PRODUCT_INCLUDE,
  });
  const map = new Map(raw.map((p) => [p.slug, p]));
  return slugs.map((s) => map.get(s)).filter((p): p is CompareProductRaw => !!p);
}

// ── Shared user data lookups ──

export async function getUserCollectionAndVotes(
  profileId: string,
  productIds: string[],
): Promise<{ collections: Set<string>; votes: Record<string, string> }> {
  const [collections, votes] = await Promise.all([
    prisma.collection.findMany({
      where: { profileId, productId: { in: productIds } },
      select: { productId: true },
    }),
    prisma.vote.findMany({
      where: { profileId, productId: { in: productIds } },
      select: { productId: true, type: true },
    }),
  ]);
  return {
    collections: new Set(collections.map((c) => c.productId)),
    votes: Object.fromEntries(votes.map((v) => [v.productId, v.type])),
  };
}
