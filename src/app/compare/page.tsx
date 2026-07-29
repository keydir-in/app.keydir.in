/**
 * Compare index page. Redirects to /compare/keyboards as the default
 * comparison category. No UI rendered at this route.
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Compare Keyboards & Mice | KeyDir',
  description: 'Compare mechanical keyboards and mice side by side. View specifications, prices, and vendor information to make an informed purchase decision.',
  robots: { index: false, follow: false },
};

export default function ComparePage() {
  redirect('/compare/keyboards');
}
