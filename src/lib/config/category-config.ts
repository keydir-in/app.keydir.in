/**
 * Single source of truth for catalog category behavior: spec filter keys,
 * price bounds, sort default, display strings, and SEO metadata.
 *
 * Client-safe: only `import type` is used, so nothing server-only leaks
 * into client bundles.
 */
import type { SpecFilterConfig } from '@/lib/services/spec-filter-builder';
import type { SortOption } from '@/types';

export interface CategorySeo {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
}

export interface CategoryConfig {
  /** Route + DB productType value (plural). */
  slug: 'keyboards' | 'keycaps' | 'switches' | 'mouse';
  /** Singular value consumed by SubmitProductCTA. */
  submitType: 'keyboard' | 'keycap' | 'switch' | 'mouse';
  displayName: string;
  emptyIcon: string;
  defaultSort: SortOption;
  /**
   * Lower price bound for the filter slider. null = derive from data.
   * Upper bound is always dynamic (null here → data max, fallback 100000).
   */
  priceMin: number | null;
  priceMax: number | null;
  specConfig: SpecFilterConfig;
  seo: CategorySeo;
}

const CATEGORIES: Record<CategoryConfig['slug'], CategoryConfig> = {
  keyboards: {
    slug: 'keyboards',
    submitType: 'keyboard',
    displayName: 'Keyboards',
    emptyIcon: '⌨',
    defaultSort: 'lowest',
    priceMin: 1499,
    priceMax: null,
    specConfig: {
      specRelationKey: 'keyboardSpec',
      arrayKeys: [
        'keyboardStyle', 'mountingStyle', 'plateMaterial',
        'pcbType', 'connectivity', 'firmware',
      ],
      stringKeys: [
        'layout', 'caseMaterial', 'lighting', 'ledOrientation',
      ],
      booleanKeys: [
        'flexCuts', 'detachableCable', 'perKeyRgb', 'switchesIncluded',
      ],
    },
    seo: {
      title: 'Mechanical Keyboards — Compare Prices | KeyDir',
      description:
        'Browse mechanical keyboards from Indian vendors. Compare prices, layouts, switch types, and availability. Find the best keyboard deals in India.',
      ogTitle: 'Mechanical Keyboards — KeyDir',
      ogDescription:
        'Browse mechanical keyboards from Indian vendors. Compare prices, layouts, and switch types.',
    },
  },
  keycaps: {
    slug: 'keycaps',
    submitType: 'keycap',
    displayName: 'Keycap Sets',
    emptyIcon: '🔍',
    defaultSort: 'lowest',
    priceMin: null,
    priceMax: null,
    specConfig: {
      specRelationKey: 'keycapSpec',
      arrayKeys: [
        'keycapProfile', 'keycapLayoutSupport', 'keycapMaterial', 'keycapManufacturing',
        'keycapLegends', 'keycapLegendPlacement', 'keycapLanguage', 'keycapKeyCount',
        'keycapStemCompat', 'keycapManufacturer',
      ],
      stringKeys: ['keycapThickness', 'keycapColorway', 'keycapDesigner'],
      booleanKeys: ['keycapNovelties', 'keycapSpacebars', 'keycapAccentKeys', 'keycapArtisan'],
    },
    seo: {
      title: 'Keycaps — Compare Prices | KeyDir',
      description:
        'Browse keycap sets from Indian vendors. Compare prices, profiles, materials, and compatibility. Find the perfect keycaps for your mechanical keyboard.',
      ogTitle: 'Keycaps — KeyDir',
      ogDescription:
        'Browse keycap sets from Indian vendors. Compare prices, profiles, materials, and compatibility.',
    },
  },
  switches: {
    slug: 'switches',
    submitType: 'switch',
    displayName: 'Switches',
    emptyIcon: '🔍',
    defaultSort: 'lowest',
    priceMin: null,
    priceMax: null,
    specConfig: {
      specRelationKey: 'switchSpec',
      arrayKeys: ['switchCompat', 'switchType', 'switchBrand', 'switchModel'],
      stringKeys: [
        'switchStemMaterial', 'switchTopHousing', 'switchBottomHousing', 'switchSpringType',
      ],
      booleanKeys: [
        'factoryLubed', 'handLubed', 'factoryFilmed', 'breakInProgress',
        'switchLongPole', 'switchLedDiffuser', 'switchDustproofStem', 'switchLightPipe',
      ],
    },
    seo: {
      title: 'Mechanical Keyboard Switches — Compare Prices | KeyDir',
      description:
        'Browse mechanical keyboard switches from Indian vendors. Compare linear, tactile, and clicky switches by price, actuation force, and type.',
      ogTitle: 'Mechanical Keyboard Switches — KeyDir',
      ogDescription:
        'Browse mechanical keyboard switches from Indian vendors. Compare linear, tactile, and clicky switches.',
    },
  },
  mouse: {
    slug: 'mouse',
    submitType: 'mouse',
    displayName: 'Mice',
    emptyIcon: '🔍',
    defaultSort: 'lowest',
    priceMin: null,
    priceMax: null,
    specConfig: {
      specRelationKey: 'mouseSpec',
      arrayKeys: [
        'mouseConnection', 'mousePollingRate', 'mouseGripType',
        'mouseCompatibility', 'mouseAccessories',
      ],
      stringKeys: [
        'mouseSensor', 'mouseShape', 'mouseHandOrientation', 'mouseSize',
        'mouseSwitches', 'mouseEncoder', 'mouseScrollWheel', 'mouseChargingPort',
        'mouseFeet', 'mouseShellMaterial', 'mouseColor', 'mouseWarranty', 'mouseLod',
      ],
      booleanKeys: ['mouseRgb', 'mouseSoftwareRequired', 'mouseOnboardMemory'],
    },
    seo: {
      title: 'Gaming & Productivity Mice — Compare Prices | KeyDir',
      description:
        'Browse gaming and productivity mice from Indian vendors. Compare prices, sensor types, weight, connectivity, and find the best deals.',
      ogTitle: 'Gaming & Productivity Mice — KeyDir',
      ogDescription:
        'Browse gaming and productivity mice from Indian vendors. Compare prices, sensor types, weight, and connectivity.',
    },
  },
};

export const CATEGORY_SLUGS = Object.keys(CATEGORIES) as CategoryConfig['slug'][];

export function getCategoryConfig(
  slug: string | undefined | null,
): CategoryConfig | undefined {
  return slug ? CATEGORIES[slug as CategoryConfig['slug']] : undefined;
}
