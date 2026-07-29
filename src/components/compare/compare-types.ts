/**
 * Compare-specific TypeScript interfaces for product data, spec groups,
 * and spec row definitions used across compare page components.
 * Exports: CompareProduct, SpecGroup, SpecRow
 */

export interface CompareProduct {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  productType: string;
  brand: { name: string; slug: string } | null;
  spec: Record<string, unknown> | null;
  vendorProducts: {
    id: string;
    totalPrice: number;
    effectivePrice: number;
    shippingCost: number;
    vendor: { name: string; chartColor: string | null };
  }[];
  upvotes: number;
  downvotes: number;
  userVote: 'upvote' | 'downvote' | null;
  inCollection: boolean;
}

export type SpecGroup = {
  title: string;
  collapsible?: boolean;
  rows: SpecRow[];
};

export type SpecRow = {
  label: string;
  key: string;
  type: 'string' | 'string[]' | 'boolean' | 'number' | 'number_g' | 'number_mm' | 'number_mAh' | 'number_Hz' | 'number_deg' | 'number_M' | 'number_unit';
  unit?: string;
};
