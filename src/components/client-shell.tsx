'use client';

import { lazy, Suspense } from 'react';

const ScrollReveal = lazy(
  () => import('@/components/scroll-reveal').then((m) => ({ default: m.ScrollReveal }))
);
const UrlCleanup = lazy(
  () => import('@/components/url-cleanup').then((m) => ({ default: m.UrlCleanup }))
);
const ProgressBar = lazy(
  () => import('@/components/progress-bar').then((m) => ({ default: m.ProgressBar }))
);

export function ClientShell() {
  return (
    <Suspense fallback={null}>
      <UrlCleanup />
      <ProgressBar />
      <ScrollReveal />
    </Suspense>
  );
}
