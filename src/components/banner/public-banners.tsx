/**
 * Server component that fetches banners for a given location slug and
 * renders them via the HeroBanner carousel. Returns null when no
 * banners are configured for the location.
 */

import { cachedBannersForLocation } from '@/lib/services/catalog-banners';
import { HeroBanner } from '@/components/banner/hero-banner';

export async function PublicBanners({ location }: { location: string }) {
  const banners = await cachedBannersForLocation(location);
  if (banners.length === 0) return null;
  return <HeroBanner banners={banners} />;
}
