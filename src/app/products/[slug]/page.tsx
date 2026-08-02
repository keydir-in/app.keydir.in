import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense, cache } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { VendorCard } from '@/components/product/vendor-card';
import dynamic from 'next/dynamic';
const PriceHistoryChart = dynamic(() => import('@/components/product/price-history-chart').then(m => m.PriceHistoryChart));
import { ProductHeroCommunity } from '@/components/product/product-hero-community';
import { ProductHeroSpecs } from '@/components/product/product-hero-specs';
import { ProductSpecs } from '@/components/product/product-specs';
import { findProductBySlug } from '@/lib/repositories/product-repository';
import { formatPrice, timeAgo, toNum } from '@/lib/utils';
import { computeVoteStats } from '@/lib/vote-utils';
import { getCurrentUserAndProfile } from '@/lib/profile/actions';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';

export const revalidate = 300;

const getProduct = cache(findProductBySlug);

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) return { title: 'Product Not Found' };

  const categoryLabel = product.productType.charAt(0).toUpperCase() + product.productType.slice(1);

  return {
    title: `${product.name} — Compare Prices | KeyDir`,
    description: `Compare prices for ${product.name} across Indian vendors. View the best deals, price history, and specifications for this ${categoryLabel.toLowerCase()}.`,
    openGraph: {
      title: `${product.name} — KeyDir`,
      description: `Compare prices for ${product.name} across Indian vendors. Find the lowest price for this ${categoryLabel.toLowerCase()}.`,
      url: `https://app.keydir.in/products/${slug}`,
      type: 'website',
      images: product.image ? [{ url: product.image, width: 800, height: 800, alt: product.name }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} — KeyDir`,
      description: `Compare prices for ${product.name} across Indian vendors. Find the lowest price.`,
      images: product.image ? [product.image] : [],
    },
    robots: { index: true, follow: true },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  const [product, { profile: currentUser }] = await Promise.all([
    getProduct(slug),
    getCurrentUserAndProfile(),
  ]);

  if (!product) notFound();

  const serializedVendorProducts = product.vendorProducts.map((vp) => ({
    ...vp,
    price: Number(vp.price),
    shippingCost: Number(vp.shippingCost),
    totalPrice: Number(vp.totalPrice),
    effectivePrice: Number(vp.effectivePrice),
    coupons: vp.coupons.map((c) => ({
      ...c,
      discountValue: Number(c.discountValue),
      minimumOrderAmount: Number(c.minimumOrderAmount),
    })),
    variants: vp.variants.map((v) => ({
      ...v,
      color: v.color as string[] | null,
      switches: v.switches as string[] | null,
      keycaps: v.keycaps as string[] | null,
      price: Number(v.price),
    })),
  }));

  let inCollection = false;
  let userVote: 'upvote' | 'downvote' | null = null;
  if (currentUser) {
    const [collectItem, voteItem] = await Promise.all([
      prisma.collection.findUnique({
        where: { profileId_productId: { profileId: currentUser.id, productId: product.id } },
      }),
      prisma.vote.findUnique({
        where: { profileId_productId: { profileId: currentUser.id, productId: product.id } },
      }),
    ]);
    inCollection = !!collectItem;
    userVote = (voteItem?.type as 'upvote' | 'downvote') || null;
  }

  const { upvotes, downvotes } = computeVoteStats(product.votes);
  const lowestPrice = serializedVendorProducts[0]?.effectivePrice ?? null;
  const highestPrice = serializedVendorProducts.length > 1
    ? serializedVendorProducts[serializedVendorProducts.length - 1]?.effectivePrice ?? null
    : null;
  const vendorCount = serializedVendorProducts.length;

  const lastUpdated = serializedVendorProducts.reduce<Date | null>((latest, vp) => {
    const newest = vp.priceHistory.at(-1)?.recordedAt ?? vp.updatedAt;
    return !latest || newest > latest ? newest : latest;
  }, null);

  const allHistory = serializedVendorProducts
    .flatMap((vp) =>
      vp.priceHistory.map((ph) => ({
        price: toNum(ph.price),
        recordedAt: ph.recordedAt,
        vendor: vp.vendor.name,
      }))
    )
    .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());

  const vendorColors: Record<string, string> = {};
  for (const vp of serializedVendorProducts) {
    if (vp.vendor.chartColor) {
      vendorColors[vp.vendor.name] = vp.vendor.chartColor;
    }
  }

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image ?? undefined,
    description: `${product.name} — prices from Indian vendors.`,
    brand: product.brand?.name ? { '@type': 'Brand', name: product.brand.name } : undefined,
    offers: serializedVendorProducts.map((vp) => ({
      '@type': 'Offer',
      price: vp.effectivePrice,
      priceCurrency: 'INR',
      availability: vp.availability === 'IN_STOCK'
        ? 'https://schema.org/InStock'
        : vp.availability === 'PREORDER'
          ? 'https://schema.org/PreOrder'
          : 'https://schema.org/OutOfStock',
      url: vp.vendorUrl ?? undefined,
      seller: { '@type': 'Organization', name: vp.vendor.name },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://app.keydir.in/' },
      { '@type': 'ListItem', position: 2, name: product.productType, item: `https://app.keydir.in/${product.productType}` },
      { '@type': 'ListItem', position: 3, name: product.name },
    ],
  };

  return (
    <>
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="page-body product-page">
        {/* Breadcrumb */}
        <div className="product-breadcrumb">
          <Link href="/" className="hover:text-[var(--text)]">Home</Link>
          {' / '}
          <Link href={`/${product.productType}`} className="hover:text-[var(--text)]">
            {product.productType}
          </Link>
          {' / '}
          <span className="text-[var(--text)]">{product.name}</span>
        </div>

        {/* ═══ HERO ═══ */}
        <section className="product-hero">
          {/* Product Image panel */}
          <div className="product-hero-image">
            <div className="neo-card product-hero-panel product-hero-image-card">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full aspect-square object-contain"
                  priority
                />
              ) : (
                <div className="w-full aspect-square bg-[var(--surface-raised)] flex items-center justify-center text-7xl font-bold font-[family-name:var(--f-m)] text-[var(--text-dim)]">
                  {product.name.charAt(0)}
                </div>
              )}
            </div>
          </div>

          {/* Product Summary panel */}
          <div className="product-hero-info">
            <div className="neo-card product-hero-panel">
              <div className="product-hero-summary-body">
                <h1 className="product-hero-name">{product.name}</h1>

                {lowestPrice && (
                  <div className="product-hero-price-block">
                    <span className="product-hero-price-label">PRICE</span>
                    <div className="product-hero-price-row">
                      <span className="product-hero-price">{formatPrice(toNum(lowestPrice))}</span>
                      {highestPrice && highestPrice !== lowestPrice && (
                        <>
                          <span className="product-hero-price-range-sep">→</span>
                          <span className="product-hero-price-alt">{formatPrice(toNum(highestPrice))}</span>
                        </>
                      )}
                    </div>
                    <span className="product-hero-price-sub">
                      Lowest across {vendorCount} vendor{vendorCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                <ProductHeroSpecs
                  productType={product.productType}
                  spec={product.keyboardSpec ?? product.switchSpec ?? product.keycapSpec ?? product.mouseSpec}
                />

                <div className="product-hero-overview">
                  <span className="product-hero-overview-label">DESCRIPTION</span>
                  {product.description?.trim() ? (
                    <p className="product-hero-overview-text">{product.description}</p>
                  ) : (
                    <p className="product-hero-overview-text product-hero-overview-empty">No product overview available.</p>
                  )}
                </div>

                <Suspense fallback={<div className="neo-card product-hero-panel" style={{ height: 160 }}><div className="skeleton-pulse" style={{ height: '100%' }} /></div>}>
                  <ProductHeroCommunity
                    productId={product.id}
                    productSlug={product.slug}
                    productName={product.name}
                    productImage={product.image}
                    productPrice={lowestPrice}
                    productCategory={product.productType}
                    upvotes={upvotes}
                    downvotes={downvotes}
                    userVote={userVote}
                    inCollection={inCollection}
                    showVoting={product.productType === 'keyboards' || product.productType === 'mouse'}
                    showCompare={product.productType === 'keyboards' || product.productType === 'mouse'}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ HERO STATS ═══ */}
        <div className="product-hero-stats">
          <div className="product-stat-card">
            <div className="product-stat-label">Available</div>
            <div className="product-stat-big">{vendorCount}</div>
            <div className="product-stat-unit">VENDOR{vendorCount !== 1 ? 'S' : ''}</div>
          </div>
          <div className="product-stat-card">
            <div className="product-stat-label">Price Range</div>
            {lowestPrice ? (
              <div className="product-stat-price-row">
                <span className="product-stat-big">{formatPrice(toNum(lowestPrice))}</span>
                {highestPrice && highestPrice !== lowestPrice && (
                  <>
                    <span className="product-stat-arrow">→</span>
                    <span className="product-stat-big alt">{formatPrice(toNum(highestPrice))}</span>
                  </>
                )}
              </div>
            ) : (
              <div className="product-stat-big">—</div>
            )}
          </div>
          <div className="product-stat-card">
            <div className="product-stat-label">Last Updated</div>
            <div className="product-stat-big">
              {lastUpdated ? lastUpdated.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
            </div>
            {lastUpdated && (
              <div className="product-stat-unit">{timeAgo(lastUpdated)}</div>
            )}
          </div>
        </div>

        {/* ═══ AVAILABLE VENDORS ═══ */}
        <section className="product-section">
          <div className="sec-head">
            <h2>
              AVAILABLE <em className="text-[var(--green)]">VENDORS</em>
            </h2>
            <div className="sec-tag text-[var(--green)]">
              {serializedVendorProducts.length} VENDOR{serializedVendorProducts.length !== 1 ? 'S' : ''}
            </div>
          </div>
          <div className="vendor-cards">
            {serializedVendorProducts.map((vp) => (
              <VendorCard
                key={vp.id}
                vendorProduct={vp}
              />
            ))}
          </div>
        </section>

        {/* ═══ PRICE HISTORY ═══ */}
        <section className="product-section">
          <div className="sec-head">
            <h2>
              <em className="text-[var(--yellow)]">PRICE HISTORY</em>
            </h2>
          </div>
          <Suspense fallback={<div className="spec-empty">Loading price history...</div>}>
            <PriceHistoryChart history={allHistory} vendorColors={vendorColors} />
          </Suspense>
        </section>

        {/* ═══ SPECIFICATIONS ═══ */}
        <ProductSpecs
          productType={product.productType}
          spec={product.keyboardSpec ?? product.switchSpec ?? product.keycapSpec ?? product.mouseSpec}
        />
      </div>

      <Footer />
    </>
  );
}
