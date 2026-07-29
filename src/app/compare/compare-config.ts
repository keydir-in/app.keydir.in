/**
 * Comparison category configuration. Defines per-category settings (keyboards,
 * mouse) including product type, spec key, UI labels, search placeholders,
 * and spec group definitions used by the compare pages and client component.
 */

import { KEYBOARD_SPEC_GROUPS, MOUSE_SPEC_GROUPS } from '@/components/compare/spec-defs';
import type { SpecGroup } from '@/components/compare/compare-types';

export interface CategoryConfig {
  productType: string;
  specKey: string;
  breadcrumb: string;
  title: string;
  titleHighlight: string;
  addLabel: string;
  searchPlaceholder: string;
  emptyMessage: string;
  maxMessage: string;
  noResultsMessage: string;
  noSpecsMessage: string;
  basePath: string;
  categoryFilter: string;
  specGroups: SpecGroup[];
}

export const CATEGORIES: Record<string, CategoryConfig> = {
  keyboards: {
    productType: 'keyboards',
    specKey: 'keyboardSpec',
    breadcrumb: 'Compare Keyboards',
    title: 'COMPARE',
    titleHighlight: 'KEYBOARDS',
    addLabel: 'Add Keyboard',
    searchPlaceholder: 'Search keyboards...',
    emptyMessage: 'Select keyboards to compare.',
    maxMessage: 'Maximum of 4 keyboards. Remove one to add another.',
    noResultsMessage: 'No keyboards found.',
    noSpecsMessage: 'No specification data available for these keyboards.',
    basePath: '/compare/keyboards',
    categoryFilter: 'keyboards',
    specGroups: KEYBOARD_SPEC_GROUPS,
  },
  mouse: {
    productType: 'mouse',
    specKey: 'mouseSpec',
    breadcrumb: 'Compare Mice',
    title: 'COMPARE',
    titleHighlight: 'MICE',
    addLabel: 'Add Mouse',
    searchPlaceholder: 'Search mice...',
    emptyMessage: 'Select mice to compare.',
    maxMessage: 'Maximum of 4 mice. Remove one to add another.',
    noResultsMessage: 'No mice found.',
    noSpecsMessage: 'No specification data available for these mice.',
    basePath: '/compare/mouse',
    categoryFilter: 'mouse',
    specGroups: MOUSE_SPEC_GROUPS,
  },
};
