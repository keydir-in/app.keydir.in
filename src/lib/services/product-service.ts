/**
 * Product business logic layer. Builds category-specific spec filter configs,
 * maps DB results to ProductCard views, and provides paginated product
 * listings with filtering, sorting, and user vote enrichment.
 */
import { computeVoteStats } from '@/lib/vote-utils';
import type { ProductCard } from '@/types';
import {
  findProductCards,
  countProducts,
  getUserVotes,
  findBestDeals,
  findTrendingProducts,
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

// ═══ CATEGORY SPEC CONFIGS ═══

export const KEYBOARD_SPEC_CONFIG: SpecFilterConfig = {
  specRelationKey: 'keyboardSpec',
  arrayKeys: [
    'keyboardStyle', 'mountingStyle', 'plateMaterial',
    'pcbType', 'connectivity', 'firmware',
    'switchCompat', 'switchType', 'switchBrand', 'switchModel',
    'keycapLegendType', 'keycapLegendPlacement',
  ],
  stringKeys: [
    'layout', 'caseMaterial', 'lighting', 'ledOrientation',
    'keycapMaterial', 'keycapProfile', 'switchStemMaterial', 'switchSpringType',
  ],
  booleanKeys: [
    'flexCuts', 'detachableCable', 'perKeyRgb', 'switchesIncluded',
    'factoryLubed', 'handLubed', 'switchLongPole', 'switchDustproofStem',
  ],
};

export const SWITCH_SPEC_CONFIG: SpecFilterConfig = {
  specRelationKey: 'switchSpec',
  arrayKeys: ['switchCompat', 'switchType', 'switchBrand', 'switchModel'],
  stringKeys: ['switchStemMaterial', 'switchTopHousing', 'switchBottomHousing', 'switchSpringType'],
  booleanKeys: [
    'factoryLubed', 'handLubed', 'factoryFilmed', 'breakInProgress',
    'switchLongPole', 'switchLedDiffuser', 'switchDustproofStem', 'switchLightPipe',
  ],
};

export const KEYCAP_SPEC_CONFIG: SpecFilterConfig = {
  specRelationKey: 'keycapSpec',
  arrayKeys: [
    'keycapProfile', 'keycapLayoutSupport', 'keycapMaterial', 'keycapManufacturing',
    'keycapLegends', 'keycapLegendPlacement', 'keycapLanguage', 'keycapKeyCount',
    'keycapStemCompat', 'keycapManufacturer',
  ],
  stringKeys: ['keycapThickness', 'keycapColorway', 'keycapDesigner'],
  booleanKeys: ['keycapNovelties', 'keycapSpacebars', 'keycapAccentKeys', 'keycapArtisan'],
};

export const MOUSE_SPEC_CONFIG: SpecFilterConfig = {
  specRelationKey: 'mouseSpec',
  arrayKeys: ['mouseConnection', 'mousePollingRate', 'mouseGripType', 'mouseCompatibility', 'mouseAccessories'],
  stringKeys: [
    'mouseSensor', 'mouseShape', 'mouseHandOrientation', 'mouseSize',
    'mouseSwitches', 'mouseEncoder', 'mouseScrollWheel', 'mouseChargingPort',
    'mouseFeet', 'mouseShellMaterial', 'mouseColor', 'mouseWarranty', 'mouseLod',
  ],
  booleanKeys: ['mouseRgb', 'mouseSoftwareRequired', 'mouseOnboardMemory'],
};

// ═══ CARD MAPPING ═══

export function mapToProductCard(
  p: ProductWithRelations,
  userVote?: 'upvote' | 'downvote' | null,
): ProductCard {
  const { upvotes, downvotes, approval } = computeVoteStats(p.votes);
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: p.image,
    brand: p.brand,
    productType: p.productType,
    lowestPrice: p.vendorProducts[0]?.effectivePrice ?? null,
    originalPrice: p.vendorProducts[0]?.totalPrice ?? null,
    hasCoupons: (p.vendorProducts[0]?._count?.coupons ?? 0) > 0,
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
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || String(options?.pageSize || DEFAULT_PAGE_SIZE), 10), 100);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const skip = (page - 1) * pageSize;
  const brands = searchParams.getAll('brand');

  const where = buildProductWhere(productType, searchParams, specConfig, { brands });
  const orderBy = buildOrderBy(sort);

  const [products, total] = await Promise.all([
    findProductCards(where, orderBy, pageSize, skip),
    countProducts(where),
  ]);

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
