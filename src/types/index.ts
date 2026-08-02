/**
 * Shared TypeScript type definitions for the Keydir application.
 * Defines core domain types: VendorProductWithVendor, ProductCard,
 * ScrapeStatus, and SortOption used across product listing and detail views.
 */
export type ScrapeStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'MANUAL_OVERRIDE' | 'NEEDS_REVIEW';

export type SortOption = 'lowest' | 'highest' | 'newest' | 'popular' | 'vendors' | 'drops';

export type Availability = 'IN_STOCK' | 'PREORDER' | 'GROUP_BUY' | 'COMING_SOON' | 'OUT_OF_STOCK';

export interface VendorProductWithVendor {
  id: string;
  price: number | { toNumber(): number };
  shippingCost: number | { toNumber(): number };
  shippingIncluded: boolean;
  totalPrice: number | { toNumber(): number };
  effectivePrice: number | { toNumber(): number };
  stockStatus: string;
  availability?: Availability;
  lastChecked?: Date;
  lastCheckedAt?: Date | null;
  vendorUrl: string;
  scrapeStatus?: ScrapeStatus;
  scrapeError?: string | null;
  vendor: {
    name: string;
    slug: string;
    logo: string | null;
    affiliateLink: string | null;
    couponsEnabled?: boolean;
    coupons?: Array<{
      id: string;
      code: string;
      title: string | null;
      description: string | null;
      discountType: string;
      discountValue: number;
      affiliateLink: string | null;
      startDate: Date | null;
      endDate: Date | null;
      enabled: boolean;
      priority: number;
    }>;
  };
  variants?: Array<{
    id: string;
    name: string;
    color: string[] | null;
    switches: string[] | null;
    keycaps: string[] | null;
    price: number | { toNumber(): number };
    stockStatus: string;
    variantUrl: string | null;
    sku: string | null;
    isDefault: boolean;
  }>;
  coupons?: Array<{
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
    minimumOrderAmount: number;
    expiryDate: Date | null;
    couponUrl: string | null;
    description: string | null;
    enabled: boolean;
  }>;
}

export interface ProductCard {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  brand: { name: string } | null;
  productType: string;
  lowestPrice: number | null;
  originalPrice: number | null;
  hasCoupons: boolean;
  vendorCount: number;
  upvotes: number;
  downvotes: number;
  approval: number | null;
  userVote: 'upvote' | 'downvote' | null;
}
