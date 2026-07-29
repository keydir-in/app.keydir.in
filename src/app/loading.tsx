/**
 * Loading state for the homepage. Shows skeleton placeholders for the
 * hero banner and hero content while server-rendered data is fetching.
 */

import { HeroBannerSkeleton, HeroContentSkeleton } from '@/components/skeleton';

export default function HomeLoading() {
  return (
    <main className="page-body">
      <HeroBannerSkeleton />
      <HeroContentSkeleton />
    </main>
  );
}
