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
      coupons: { select: { code: true, discountType: true, discountValue: true, enabled: true, expiryDate: true } },
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

// ponytail: min/max price ordering pulled into JS because Prisma's orderBy only
// supports _count on to-many relations. Fetches all matching ids + min price per
// request; switch to raw SQL ordering if a category ever exceeds ~5k products.
export async function findProductCardsSortedByPrice(
  where: Prisma.ProductWhereInput,
  sort: 'lowest' | 'highest',
  take: number,
  skip: number,
): Promise<ProductWithRelations[]> {
  const matches = await prisma.product.findMany({
    where,
    select: {
      id: true,
      vendorProducts: { select: { effectivePrice: true }, orderBy: { effectivePrice: 'asc' }, take: 1 },
    },
  });

  const dir = sort === 'lowest' ? 1 : -1;
  matches.sort((a, b) => {
    const pa = a.vendorProducts[0]?.effectivePrice ?? null;
    const pb = b.vendorProducts[0]?.effectivePrice ?? null;
    if (pa == null && pb == null) return 0;
    if (pa == null) return 1;
    if (pb == null) return -1;
    return (pa - pb) * dir;
  });

  const pageIds = matches.slice(skip, skip + take).map((m) => m.id);
  if (pageIds.length === 0) return [];

  const products = await findProductCards({ id: { in: pageIds } }, {}, pageIds.length, 0);
  const byId = new Map(products.map((p) => [p.id, p]));
  return pageIds.map((id) => byId.get(id)).filter((p): p is ProductWithRelations => !!p);
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

/**
 * Finds products whose latest recorded price is lower than the last price
 * that differed from it (i.e. the price dropped at some point in the window).
 * Returns the biggest drop per product, sorted by drop size descending.
 */
export async function findRecentPriceDrops(
  days = 14,
  take = 10,
): Promise<Array<{ productId: string; oldPrice: number; newPrice: number }>> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  // ponytail: pull recent history and diff in JS — fine at directory scale;
  // move to a window-function SQL query if history exceeds ~50k rows/window.
  const history = await prisma.priceHistory.findMany({
    where: { recordedAt: { gte: since }, price: { gt: 0 } },
    orderBy: { recordedAt: 'desc' },
    take: 10000,
    select: {
      price: true,
      vendorProduct: { select: { id: true, productId: true, stockStatus: true } },
    },
  });

  const perVendor = new Map<string, { productId: string; latest: number; old: number | null }>();
  for (const h of history) {
    const vp = h.vendorProduct;
    if (vp.stockStatus !== 'in_stock' && vp.stockStatus !== 'preorder') continue;
    const entry = perVendor.get(vp.id);
    if (!entry) perVendor.set(vp.id, { productId: vp.productId, latest: h.price, old: null });
    else if (entry.old === null && h.price !== entry.latest) entry.old = h.price;
  }

  const bestByProduct = new Map<string, { oldPrice: number; newPrice: number }>();
  for (const { productId, latest, old } of perVendor.values()) {
    if (old === null || old <= latest) continue;
    const drop = old - latest;
    const cur = bestByProduct.get(productId);
    if (!cur || drop > cur.oldPrice - cur.newPrice) bestByProduct.set(productId, { oldPrice: old, newPrice: latest });
  }

  return [...bestByProduct.entries()]
    .map(([productId, d]) => ({ productId, ...d }))
    .sort((a, b) => b.oldPrice - b.newPrice - (a.oldPrice - a.newPrice))
    .slice(0, take);
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
  images: { orderBy: { sortOrder: 'asc' as const } },
  keyboardSpec: true,
  switchSpec: true,
  keycapSpec: true,
  mouseSpec: true,
  vendorProducts: {
    include: {
      vendor: {
        select: {
          id: true, name: true, slug: true, logo: true, chartColor: true, enabled: true,
          scraperEnabled: true, affiliateLink: true, couponsEnabled: true,
          coupons: {
            // Only active coupons — expired/disabled ones are never shown,
            // and this keeps the payload from growing with coupon history.
            where: { enabled: true, OR: [{ endDate: null }, { endDate: { gte: new Date() } }] },
            orderBy: [{ priority: 'desc' as const }, { createdAt: 'asc' as const }],
          },
        },
      },
      variants: { orderBy: { createdAt: 'asc' as const } },
      coupons: {
        where: { enabled: true, OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }] },
        orderBy: { createdAt: 'asc' as const },
      },
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
