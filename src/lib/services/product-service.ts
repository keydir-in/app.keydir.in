/**
 * Product business logic layer. Maps DB results to ProductCard views and
 * provides paginated product listings with filtering, sorting, and user
 * vote enrichment. Category-specific configs live in
 * `@/lib/config/category-config`.
 */
import { computeVoteStats } from '@/lib/vote-utils';
import { resolveBestDeal } from '@/lib/services/coupon-utils';
import { toNum } from '@/lib/utils';
import type { ProductCard } from '@/types';
import {
  findProductCards,
  countProducts,
  getUserVotes,
  findBestDeals,
  findTrendingProducts,
  findProductCardsSortedByPrice,
  type ProductWithRelations,
} from '@/lib/repositories/product-repository';
import {
  buildProductWhere,
  buildOrderBy,
  type SpecFilterConfig,
  type SortOption,
} from '@/lib/services/spec-filter-builder';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// ═══ CARD MAPPING ═══

export function mapToProductCard(
  p: ProductWithRelations,
  userVote?: 'upvote' | 'downvote' | null,
): ProductCard {
  const { upvotes, downvotes, approval } = computeVoteStats(p.votes);
  const featured = p.vendorProducts[0];
  const deal = featured ? resolveBestDeal(toNum(featured.totalPrice), featured.coupons) : null;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: p.image,
    brand: p.brand,
    productType: p.productType,
    lowestPrice: deal?.finalPrice ?? featured?.effectivePrice ?? null,
    originalPrice: featured?.totalPrice ?? null,
    hasCoupons: (featured?._count?.coupons ?? 0) > 0,
    couponCode: deal?.couponCode ?? null,
    vendorCount: p._count.vendorProducts,
    upvotes,
    downvotes,
    approval,
    userVote: userVote ?? null,
  };
}

// ═══ PRODUCT LISTINGS ═══

const DEFAULT_PAGE_SIZE = 25;

export async function fetchProductListings(
  productType: string,
  searchParams: URLSearchParams,
  specConfig: SpecFilterConfig,
  options?: { defaultSort?: SortOption; includeUserVotes?: boolean; pageSize?: number },
): Promise<{ products: ProductCard[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const sort = (searchParams.get('sort') || options?.defaultSort || 'popular') as SortOption;
  const parsedSize = Number.parseInt(searchParams.get('pageSize') || String(options?.pageSize || DEFAULT_PAGE_SIZE), 10);
  const pageSize = Number.isFinite(parsedSize) ? Math.min(Math.max(parsedSize, 1), 100) : DEFAULT_PAGE_SIZE;
  const parsedPage = Number.parseInt(searchParams.get('page') || '1', 10);
  const page = Number.isFinite(parsedPage) ? Math.max(parsedPage, 1) : 1;
  const skip = (page - 1) * pageSize;
  const brands = searchParams.getAll('brand');

  const where = buildProductWhere(productType, searchParams, specConfig, { brands });

  const products = sort === 'lowest' || sort === 'highest'
    ? await findProductCardsSortedByPrice(where, sort, pageSize, skip)
    : await findProductCards(where, buildOrderBy(sort), pageSize, skip);

  const total = await countProducts(where);

  let userVotes: Record<string, string> = {};
  if (options?.includeUserVotes !== false) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
        if (profile) {
          userVotes = await getUserVotes(profile.id, products.map((p) => p.id));
        }
      }
    } catch {
      // Not authenticated
    }
  }

  const totalPages = Math.ceil(total / pageSize);

  return {
    products: products.map((p) => mapToProductCard(p, (userVotes[p.id] as 'upvote' | 'downvote') || null)),
    total,
    page,
    pageSize,
    totalPages,
  };
}

// ═══ HOME PAGE SECTION HELPERS ═══

export async function fetchLowestPrices() {
  const products = await findProductCards({}, { createdAt: 'desc' }, 10);
  return products.map((p) => mapToProductCard(p, null));
}

export async function fetchBestDeals() {
  return findBestDeals();
}

export async function fetchTrendingProducts() {
  const allProducts = await findTrendingProducts();

  const ranked = allProducts.map((p) => {
    const stats = computeVoteStats(p.votes);
    return { ...p, ...stats };
  }).filter((p) => p.total >= 5);

  const trending = [...ranked]
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 6);

  const favorites = [...ranked]
    .filter((p) => p.approval !== null && p.approval >= 80)
    .sort((a, b) => (b.approval ?? 0) - (a.approval ?? 0))
    .slice(0, 6);

  return { trending, favorites };
}
