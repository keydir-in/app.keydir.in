/**
 * Homepage for KeyDir. ISR-enabled (revalidate every 300s) with
 * streaming Suspense boundaries. Hero title/subtitle/actions render
 * immediately while data-dependent sections stream in.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Footer } from '@/components/layout/footer';
import { HeroBanner } from '@/components/banner/hero-banner';
import { LowestPrices } from '@/components/product/lowest-prices';
import { prisma } from '@/lib/prisma';
import { getBannersForLocation } from '@/lib/admin/banner-actions';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'KeyDir — Track Mechanical Keyboard Prices Across India',
  description:
    'Compare prices from multiple Indian vendors, view price history, and find the best deal on mechanical keyboards, switches, keycaps, and mice across India.',
  openGraph: {
    title: 'KeyDir — Track Mechanical Keyboard Prices Across India',
    description:
      'Compare prices from multiple Indian vendors, view price history, and find the best deal on mechanical keyboards and desk peripherals.',
    url: 'https://app.keydir.in',
  },
  twitter: {
    title: 'KeyDir — Track Mechanical Keyboard Prices Across India',
    description:
      'Compare prices from multiple Indian vendors, view price history, and find the best deal on mechanical keyboards and desk peripherals.',
  },
};

type ProductTypeCount = { productType: string; _count: number };

const FEATURES = [
  {
    icon: '⌨',
    title: 'Keyboards',
    desc: 'Browse mechanical keyboards from Indian vendors with pricing, specs, layouts, and availability.',
    href: '/keyboards',
    slug: 'keyboards',
  },
  {
    icon: '⚪',
    title: 'Switches',
    desc: 'Linear · Tactile · Clicky · Hall Effect · Magnetic · Silent switches compared.',
    href: '/switches',
    slug: 'switches',
  },
  {
    icon: '⬛',
    title: 'Keycaps',
    desc: 'Browse keycap sets by profile, material, compatibility, and colorway.',
    href: '/keycaps',
    slug: 'keycaps',
  },
  {
    icon: '🖱',
    title: 'Mouse',
    desc: 'Gaming and productivity mice with sensor, weight, connectivity, and pricing.',
    href: '/mouse',
    slug: 'mouse',
  },
];

async function HeroStats({ promise }: { promise: Promise<ProductTypeCount[]> }) {
  const productTypeCounts = await promise;
  const getCount = (slug: string) => productTypeCounts.find((c) => c.productType === slug)?._count ?? 0;
  const kbCount = getCount('keyboards');
  const swCount = getCount('switches');
  const kcCount = getCount('keycaps');
  const msCount = getCount('mouse');

  return (
    <div className="hero-stats">
      <div className="stat-box"><span className="stat-num">{kbCount}</span><span className="stat-label">Keyboards</span></div>
      <div className="stat-box"><span className="stat-num">{swCount}</span><span className="stat-label">Switches</span></div>
      <div className="stat-box"><span className="stat-num">{kcCount}</span><span className="stat-label">Keycaps</span></div>
      <div className="stat-box"><span className="stat-num">{msCount}</span><span className="stat-label">Mice</span></div>
    </div>
  );
}

async function HeroTerminal({ promise }: { promise: Promise<ProductTypeCount[]> }) {
  const productTypeCounts = await promise;
  const totalProducts = productTypeCounts.reduce((sum, c) => sum + c._count, 0);

  return (
    <div className="hero-right" style={{ animation: 'fade-up .7s .15s ease both' }}>
      <div className="terminal">
        <div className="t-bar">
          <div className="t-dot" />
          <div className="t-dot" />
          <div className="t-dot" />
          <span style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginLeft: '8px' }}>keydir_status.sh</span>
        </div>
        <div className="t-line"><span className="t-prompt">$</span><span>./directory --info</span></div>
        <div className="t-line"><span className="t-ok">✓</span><span>product_db: ONLINE</span></div>
        <div className="t-line"><span className="t-ok">✓</span><span>products: {totalProducts}</span></div>
        <div className="t-line"><span className="t-ok">✓</span><span>community: ACTIVE</span></div>
        <div className="t-dim">──────────────────</div>
        <div className="t-line"><span className="t-warn">▲</span><span>region: INDIA 🇮🇳</span></div>
        <div className="t-line"><span className="t-warn">▲</span><span>updated: DAILY</span></div>
        <div className="t-dim">──────────────────</div>
        <div className="t-line"><span className="t-ok">●</span><span>STATUS: ONLINE</span></div>
      </div>
    </div>
  );
}

async function HomeBanners({ promise }: { promise: Promise<Awaited<ReturnType<typeof getBannersForLocation>>> }) {
  const banners = await promise;
  if (banners.length === 0) return null;
  return <HeroBanner banners={banners} />;
}

function StatsFallback() {
  return (
    <div className="hero-stats">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="stat-box"><span className="stat-num">--</span><span className="stat-label">&nbsp;</span></div>
      ))}
    </div>
  );
}

function TerminalFallback() {
  return (
    <div className="hero-right" style={{ animation: 'fade-up .7s .15s ease both' }}>
      <div className="terminal">
        <div className="t-bar">
          <div className="t-dot" />
          <div className="t-dot" />
          <div className="t-dot" />
          <span style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginLeft: '8px' }}>keydir_status.sh</span>
        </div>
        <div className="t-dim">Loading...</div>
      </div>
    </div>
  );
}

async function FeaturesSection({ promise }: { promise: Promise<ProductTypeCount[]> }) {
  const productTypeCounts = await promise;
  const countMap: Record<string, number> = {};
  for (const c of productTypeCounts) countMap[c.productType] = c._count;

  return (
    <section style={{ padding: '48px 0 40px' }}>
      <div className="sec-head">
        <h2>WHAT&apos;S <em style={{ color: 'var(--green)' }}>INSIDE</em></h2>
        <div className="sec-tag" style={{ color: 'var(--green)' }}>4 SECTIONS</div>
      </div>
      <div className="hi-grid">
        {FEATURES.map((feat) => {
          const count = countMap[feat.slug] ?? 0;
          return (
            <Link key={feat.slug} href={feat.href} className="hi-card">
              <span className="hi-card-icon">{feat.icon}</span>
              <div className="hi-card-title">{feat.title}</div>
              <div className="hi-card-desc">{feat.desc}</div>
              <div className="hi-card-count"><strong>{count.toLocaleString('en-IN')}</strong> Products</div>
              <div className="hi-card-link">
                Browse <span className="hi-card-link-arrow">→</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const countsPromise = prisma.product.groupBy({ by: ['productType'], _count: true });
  const bannersPromise = getBannersForLocation('home');

  return (
    <>
      <main className="page-hero">
        <div className="hero-grid">
          <div className="hero-left">
            <div className="hero-eyebrow">
              <span className="dot" /> SYSTEM_ONLINE // INDIA_KEYBOARD_DB_v2
            </div>

            <h1 className="page-hero-title" style={{ animation: 'fade-up .65s .08s ease both' }}>
              INDIA<br />
              MECHANICAL<br />
              <span className="outline">KEYBOARD</span><br />
              DIRECTORY.
            </h1>

            <p className="page-hero-sub" style={{ animation: 'fade-up .65s .16s ease both' }}>
              Discover mechanical keyboards, switches, keycaps, mice, and more from Indian vendors. Compare prices,
              specifications, availability, and historical pricing — all in one place.
            </p>

            <div className="hero-actions">
              <Link href="/keyboards" className="btn-primary">Browse Keyboards →</Link>
              <a href="#deals" className="btn-secondary">Recent Additions</a>
            </div>

            <Suspense fallback={<StatsFallback />}>
              <HeroStats promise={countsPromise} />
            </Suspense>
          </div>

          <Suspense fallback={<TerminalFallback />}>
            <HeroTerminal promise={countsPromise} />
          </Suspense>
        </div>
      </main>

      <div className="marquee-strip">
        <div className="marquee-track">
          <span>KEYBOARDS</span><span className="sep">{'///'}</span><span>SWITCHES</span><span className="sep">{'///'}</span><span>KEYCAPS</span><span className="sep">{'///'}</span><span>MOUSE</span><span className="sep">{'///'}</span><span>MOUSEPADS</span><span className="sep">{'///'}</span><span>GLASS PADS</span><span className="sep">{'///'}</span><span>DESKMATS</span><span className="sep">{'///'}</span><span>BAREBONES</span><span className="sep">{'///'}</span><span>CUSTOM CABLES</span><span className="sep">{'///'}</span><span>STABILIZERS</span><span className="sep">{'///'}</span>
          <span>KEYBOARDS</span><span className="sep">{'///'}</span><span>SWITCHES</span><span className="sep">{'///'}</span><span>KEYCAPS</span><span className="sep">{'///'}</span><span>MOUSE</span><span className="sep">{'///'}</span><span>MOUSEPADS</span><span className="sep">{'///'}</span><span>GLASS PADS</span><span className="sep">{'///'}</span><span>DESKMATS</span><span className="sep">{'///'}</span><span>BAREBONES</span><span className="sep">{'///'}</span><span>CUSTOM CABLES</span><span className="sep">{'///'}</span><span>STABILIZERS</span><span className="sep">{'///'}</span>
        </div>
      </div>

      <Suspense fallback={null}>
        <HomeBanners promise={bannersPromise} />
      </Suspense>

      <div className="page-body">
        {/* What's Inside */}
        <Suspense fallback={null}>
          <FeaturesSection promise={countsPromise} />
        </Suspense>

        {/* Recent Additions */}
        <section id="deals" style={{ paddingBottom: '48px' }}>
          <Suspense fallback={null}>
            <LowestPrices />
          </Suspense>
        </section>

        {/* Community Request CTA */}
        <section style={{ paddingBottom: '64px' }}>
          <div className="cta-section" style={{ background: 'var(--cta-bg)', position: 'relative', overflow: 'hidden' }}>
            <div className="section-tag-label"><span className="dot" /> SYSTEM_ONLINE // COMMUNITY_REQUEST</div>
            <h2 style={{ fontFamily: 'var(--f-d)', fontSize: 'clamp(2.5rem,6vw,5rem)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-.05em', lineHeight: .9, marginBottom: '1.5rem' }}>
              CAN&apos;T FIND<br />YOUR PRODUCT?
            </h2>
            <p style={{ fontFamily: 'var(--f-m)', fontSize: '.95rem', maxWidth: '500px', marginBottom: '2rem', lineHeight: 1.75, color: 'var(--cta-text-muted)' }}>
              Missing a keyboard, switch, keycap, vendor, or group buy? Help us improve KeyDir by submitting it to our
              team. We&apos;re constantly expanding the directory with your help.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a href="https://github.com/SHADOW269/Keydir.in" target="_blank" rel="noopener" className="btn-primary">CONTACT US →</a>
              <a href="https://github.com/SHADOW269/Keydir.in/issues" target="_blank" rel="noopener" className="btn-secondary">SUBMIT PRODUCT →</a>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
