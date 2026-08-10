/**
 * Centralized Cloudinary folder generation. Every upload route and
 * delete routine should derive its folder from here so the hierarchy
 * stays consistent across the entire codebase.
 *
 * Hierarchy:
 *   keydir/
 *   ├── products/{category}/{productSlug}/
 *   ├── banners/{bannerType}/
 *   ├── brands/{brandSlug}/
 *   ├── vendors/{vendorSlug}/
 *   ├── users/{username}/
 *   ├── avatars/{username}/
 *   └── misc/
 */

const ROOT = 'keydir';

const VALID_CATEGORIES = ['keyboards', 'switches', 'keycaps', 'mouse'] as const;

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function productFolder(category: string, productSlug: string): string {
  const cat = VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])
    ? category
    : 'misc';
  return `${ROOT}/products/${cat}/${slug(productSlug) || 'unnamed'}`;
}

export function bannerFolder(bannerType: string): string {
  const safe = slug(bannerType) || 'misc';
  return `${ROOT}/banners/${safe}`;
}

export function brandFolder(brandSlug: string): string {
  return `${ROOT}/brands/${slug(brandSlug) || 'unnamed'}`;
}

export function vendorFolder(vendorSlug: string): string {
  return `${ROOT}/vendors/${slug(vendorSlug) || 'unnamed'}`;
}

export function userFolder(username: string): string {
  return `${ROOT}/users/${slug(username) || 'unnamed'}`;
}

export function avatarFolder(username: string): string {
  return `${ROOT}/avatars/${slug(username) || 'unnamed'}`;
}

export function miscFolder(subfolder?: string): string {
  return subfolder ? `${ROOT}/misc/${slug(subfolder)}` : `${ROOT}/misc`;
}

export function soundTestsFolder(): string {
  return `${ROOT}/sound-tests`;
}
