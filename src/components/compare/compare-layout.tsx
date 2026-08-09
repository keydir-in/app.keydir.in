/**
 * Compare page layout wrapper that combines navbar, optional public banners,
 * a breadcrumb trail, and the footer around the main compare content area.
 * Exports: CompareLayout
 */

import { Footer } from '@/components/layout/footer';
import { PublicBanners } from '@/components/banner/public-banners';
import Link from 'next/link';

interface Props {
  breadcrumb: string;
  bannerLocation?: string;
  children: React.ReactNode;
}

export function CompareLayout({ breadcrumb, bannerLocation, children }: Props) {
  return (
    <>
      {bannerLocation && <PublicBanners location={bannerLocation} />}
      <div className="page-body compare-page">
        <div className="product-breadcrumb">
          <Link href="/" className="hover:text-[var(--text)]">Home</Link>
          {' / '}
          <span className="text-[var(--text)]">{breadcrumb}</span>
        </div>
        {children}
      </div>
      <Footer />
    </>
  );
}
