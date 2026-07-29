/**
 * Root layout for KeyDir — the Indian mechanical keyboard price tracker.
 * Wraps all pages with ThemeProvider (dark/light mode), progress bar,
 * scroll-reveal animations, and global CSS. Exports site-wide metadata
 * and configures Space Grotesk + JetBrains Mono font variables.
 */

import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeScript } from '@/components/theme-script';
import { ClientShell } from '@/components/client-shell';
import './base.css';
import './catalog.css';
import './globals.css';
import './skeleton.css';
import './shared-pages.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--f-d',
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--f-m',
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  display: 'optional',
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAFA' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'KeyDir — Track Mechanical Keyboard Prices Across India',
    template: '%s | KeyDir',
  },
  description:
    'Compare prices from multiple Indian vendors, view price history, and find the best deal on mechanical keyboards, switches, keycaps, and mice across India.',
  keywords: [
    'mechanical keyboard',
    'price tracker',
    'India',
    'keyboard vendors',
    'keycaps',
    'switches',
    'keyboard price comparison',
    'Indian keyboard store',
  ],
  openGraph: {
    title: 'KeyDir — Track Mechanical Keyboard Prices Across India',
    description:
      'Compare prices from multiple Indian vendors, view price history, and find the best deal on mechanical keyboards and desk peripherals.',
    url: 'https://app.keydir.in',
    siteName: 'KeyDir',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KeyDir — Track Mechanical Keyboard Prices Across India',
    description:
      'Compare prices from multiple Indian vendors, view price history, and find the best deal on mechanical keyboards and desk peripherals.',
  },
  metadataBase: new URL('https://app.keydir.in'),
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head />
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} min-h-screen flex flex-col font-[family-name:var(--f-d)]`}
      >
        <ThemeScript />
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <ThemeProvider>
          <ClientShell />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'KeyDir',
                url: 'https://app.keydir.in',
                description: 'Track mechanical keyboard prices across Indian vendors.',
                potentialAction: {
                  '@type': 'SearchAction',
                  target: {
                    '@type': 'EntryPoint',
                    urlTemplate: 'https://app.keydir.in/keyboards?q={search_term_string}',
                  },
                  'query-input': 'required name=search_term_string',
                },
              }),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'KeyDir',
                url: 'https://app.keydir.in',
                description: 'Indian mechanical keyboard price comparison platform.',
              }),
            }}
          />
          <div id="main-content">{children}</div>
          <Script
            src="https://cloud.umami.is/script.js"
            data-website-id="daeeffe3-c516-4399-8875-451d8ae110ff"
            strategy="lazyOnload"
          />
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
