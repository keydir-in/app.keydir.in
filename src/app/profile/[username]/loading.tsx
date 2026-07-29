/**
 * Loading state for the profile page. Shows a skeleton layout matching
 * the profile hero, stats row, and tabbed content area.
 */

import { ProfilePageSkeleton } from '@/components/skeleton';

export default function ProfileLoading() {
  return (
    <main className="page-body">
      <ProfilePageSkeleton />
    </main>
  );
}
