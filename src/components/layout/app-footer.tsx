'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './footer';

export function AppFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith('/profile')) return null;
  return <Footer />;
}
