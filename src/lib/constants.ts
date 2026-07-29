/**
 * Application constants: sort options, banner and filter interfaces,
 * and availability status mappings with labels and badge CSS classes.
 */
import type { SortOption } from '@/types';

export const SORT_OPTIONS: { value: SortOption; label: string; mobileLabel: string }[] = [
  { value: 'lowest', label: 'Lowest Price', mobileLabel: 'Lowest ▼' },
  { value: 'highest', label: 'Highest Price', mobileLabel: 'Highest ▼' },
  { value: 'newest', label: 'Newest', mobileLabel: 'Newest ▼' },
  { value: 'popular', label: 'Most Upvoted', mobileLabel: 'Upvoted ▼' },
  { value: 'vendors', label: 'Most Vendors', mobileLabel: 'Vendors ▼' },
];

export interface Banner {
  id: string;
  title: string;
  desktopImage: string | null;
  mobileImage: string | null;
  linkUrl: string | null;
  linkType: string;
  openNewTab: boolean;
}

export interface FilterOptions {
  specs: Record<string, string[] | boolean[]>;
  brands: string[];
  vendors: string[];
  priceMin: number;
  priceMax: number;
}

export const AVAILABILITY_KEYS = ['in_stock', 'preorder', 'group_buy', 'coming_soon', 'out_of_stock'] as const;

export const AVAILABILITY_MAP: Record<string, { label: string; class: string; icon?: string }> = {
  IN_STOCK: { label: 'In Stock', class: 'b-green', icon: '✓' },
  PREORDER: { label: 'Preorder', class: 'b-yellow', icon: '◷' },
  GROUP_BUY: { label: 'Group Buy', class: 'b-blue', icon: '◎' },
  COMING_SOON: { label: 'Coming Soon', class: 'b-orange', icon: '⏳' },
  OUT_OF_STOCK: { label: 'Out of Stock', class: 'b-red', icon: '✕' },
  in_stock: { label: 'In Stock', class: 'b-green', icon: '✓' },
  preorder: { label: 'Preorder', class: 'b-yellow', icon: '◷' },
  group_buy: { label: 'Group Buy', class: 'b-blue', icon: '◎' },
  coming_soon: { label: 'Coming Soon', class: 'b-orange', icon: '⏳' },
  out_of_stock: { label: 'Out of Stock', class: 'b-red', icon: '✕' },
};
