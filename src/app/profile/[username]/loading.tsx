/**
 * Loading state for the profile page. Shows a skeleton layout matching
 * the profile hero, stats row, and tabbed content area 1:1 so there is
 * no layout shift when the real data streams in.
 */

import { ProfilePageSkeleton } from '@/components/skeleton';

export default function ProfileLoading() {
  return <ProfilePageSkeleton />;
}
