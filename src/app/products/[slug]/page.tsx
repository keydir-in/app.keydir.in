import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense, cache } from 'react';
import { Footer } from '@/components/layout/footer';
import { VendorRow } from '@/components/product/vendor-row';
import { ProductHeroCommunity } from '@/components/product/product-hero-community';
import { ProductHeroStats } from '@/components/product/product-hero-stats';
import { BookmarkButton } from '@/components/product/bookmark-button';
import { ProductHeroSpecs } from '@/components/product/product-hero-specs';
import { ProductGallery } from '@/components/product/product-gallery';
import { ProductTabs } from '@/components/product/product-tabs';
import { findProductBySlug } from '@/lib/repositories/product-repository';
import { resolveBestDeal } from '@/lib/services/coupon-utils';
import { formatPrice, toNum } from '@/lib/utils';
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

  // Gallery shows the primary image first (matches listing cards), then any
  // extra ProductImage rows by sortOrder. Falls back to the single image.
  const galleryImages = (() => {
    const urls = product.images.map((i) => i.url);
    if (product.image) urls.unshift(product.image);
    return [...new Set(urls.filter((u): u is string => !!u))];
  })();

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

  // Resolve linked switch product images so the Components → Switches cards
  // can show a thumbnail (vendor-row style) instead of a text-only block.
  const rawSpec: Record<string, unknown> | null = product.keyboardSpec ?? product.switchSpec ?? product.keycapSpec ?? product.mouseSpec;
  const switchOpts = Array.isArray(rawSpec?.switches) ? (rawSpec!.switches as Record<string, unknown>[]) : [];
  const linkedIds = switchOpts.map((s) => s.linkedSwitchId).filter((x): x is string => typeof x === 'string' && !!x);
  const switchImages: Record<string, string | null> = {};
  if (linkedIds.length) {
    const rows = await prisma.product.findMany({
      where: { id: { in: linkedIds } },
      select: { id: true, image: true },
    });
    for (const r of rows) switchImages[r.id] = r.image;
  }
  const spec: Record<string, unknown> | null = rawSpec
    ? { ...rawSpec, switches: switchOpts.map((s) => ({ ...s, image: s.image ?? switchImages[s.linkedSwitchId as string] ?? null })) }
    : null;

  let userVote: 'upvote' | 'downvote' | null = null;
  let inCollection = false;
  if (currentUser) {
    const [voteItem, collectionItem] = await Promise.all([
      prisma.vote.findUnique({
        where: { profileId_productId: { profileId: currentUser.id, productId: product.id } },
      }),
      prisma.collection.findUnique({
        where: { profileId_productId: { profileId: currentUser.id, productId: product.id } },
      }),
    ]);
    userVote = (voteItem?.type as 'upvote' | 'downvote') || null;
    inCollection = !!collectionItem;
  }

  const { upvotes, downvotes } = computeVoteStats(product.votes);
  const vendorCount = serializedVendorProducts.length;

  // Price range spans every priced, non-discontinued variant across all
  // vendors (in-stock preferred) — not just vendor group prices.
  const allVariants = serializedVendorProducts.flatMap((vp) =>
    vp.variants
      .filter((v) => toNum(v.price) > 0 && v.stockStatus !== 'discontinued')
      .map((v) => ({
        price: toNum(v.price),
        originalPrice: v.originalPrice != null && toNum(v.originalPrice) > 0 ? toNum(v.originalPrice) : null,
        buyable: v.availability !== 'OUT_OF_STOCK' && v.availability !== 'COMING_SOON' && v.availability !== 'GROUP_BUY',
      })),
  );
  const pricedPool = allVariants.some((v) => v.buyable) ? allVariants.filter((v) => v.buyable) : allVariants;
  const uniquePrices = [...new Set(pricedPool.map((v) => v.price))].sort((a, b) => a - b);
  const rangeMin = uniquePrices[0] ?? null;
  const rangeMax = uniquePrices.length > 1 ? uniquePrices[uniquePrices.length - 1] : null;

  // Lowest current price = cheapest in-stock variant; falls back to any priced
  // variant, then the cheapest vendor group price. A vendor coupon that beats
  // the raw variant price wins instead, so the hero matches the cards.
  const bestVariant = pricedPool.reduce<(typeof pricedPool)[number] | null>(
    (min, v) => (min === null || v.price < min.price ? v : min),
    null,
  );
  const bestCouponDeal = serializedVendorProducts.reduce<{ price: number; original: number; code: string } | null>(
    (min, vp) => {
      const deal = resolveBestDeal(toNum(vp.totalPrice), vp.coupons);
      if (deal.couponCode == null) return min;
      if (min == null || deal.finalPrice < min.price) return { price: deal.finalPrice, original: toNum(vp.totalPrice), code: deal.couponCode };
      return min;
    },
    null,
  );
  const rawVariantPrice = bestVariant?.price ?? null;
  const couponWins = bestCouponDeal != null && (rawVariantPrice == null || bestCouponDeal.price < rawVariantPrice);
  const lowestPrice = couponWins
    ? bestCouponDeal!.price
    : rawVariantPrice ?? serializedVendorProducts[0]?.effectivePrice ?? null;
  const couponCode = couponWins ? bestCouponDeal!.code : null;
  const originalPrice = couponWins
    ? bestCouponDeal!.original
    : bestVariant?.originalPrice != null && lowestPrice != null && bestVariant.originalPrice > lowestPrice
      ? bestVariant.originalPrice
      : null;
  const savings = originalPrice != null && lowestPrice != null ? originalPrice - lowestPrice : null;
  const savingsPct = savings != null && originalPrice != null ? Math.round((savings / originalPrice) * 100) : null;

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
        stockStatus: ph.stockStatus,
      }))
    )
    .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());

  // Stats: lowest/highest are all-time (across full history); average/current
  // are current prices on the same shipping-inclusive basis (effectivePrice)
  // the hero and vendor rows use. current reuses lowestPrice so the chart
  // agrees with the hero exactly. Ignore 0/placeholder entries.
  const effectivePrices = serializedVendorProducts
    .map((vp) => toNum(vp.effectivePrice))
    .filter((p) => p > 0);
  const historyPrices = allHistory.map((h) => h.price).filter((p) => p > 0);
  const lowest = historyPrices.length > 0 ? Math.min(...historyPrices) : null;
  const highest = historyPrices.length > 0 ? Math.max(...historyPrices) : null;
  const average = effectivePrices.length > 0
    ? Math.round(effectivePrices.reduce((sum, p) => sum + p, 0) / effectivePrices.length)
    : null;
  const current = lowestPrice != null
    ? toNum(lowestPrice)
    : effectivePrices.length > 0
      ? Math.min(...effectivePrices)
      : null;
  const priceStats = { lowest, highest, average, current };

  const vendorColors: Record<string, string> = {};
  for (const vp of serializedVendorProducts) {
    if (vp.vendor.chartColor) {
      vendorColors[vp.vendor.name] = vp.vendor.chartColor;
    }
  }

  const couponByVendor: Record<string, string> = {};
  for (const vp of serializedVendorProducts) {
    const active = vp.coupons.find(
      (c) => c.enabled && (!c.expiryDate || new Date(c.expiryDate) > new Date())
    );
    if (active) couponByVendor[vp.vendor.name] = active.code;
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
              <ProductGallery images={galleryImages} name={product.name} />
            </div>
          </div>

          {/* Product Summary panel */}
          <div className="product-hero-info">
            <div className="neo-card product-hero-panel">
              <div className="product-hero-summary-body">
                <div className="product-hero-title-row">
                  <div className="product-hero-title">
                    {product.brand?.name && (
                      <div className="product-hero-brand">{product.brand.name}</div>
                    )}
                    <h1 className="product-hero-name">{product.name}</h1>
                  </div>
                  <BookmarkButton productId={product.id} initialSaved={inCollection} />
                </div>

                {lowestPrice != null && (
                  <div className="product-hero-price-block">
                    <div className="product-hero-price-row">
                      {originalPrice && (
                        <span className="product-hero-price-original">{formatPrice(originalPrice)}</span>
                      )}
                      <span className="product-hero-price">{formatPrice(toNum(lowestPrice))}</span>
                      {couponCode && (
                        <span className="product-hero-coupon">🏷️ {couponCode}</span>
                      )}
                    </div>
                    {savings != null && savings > 0 && (
                      <span className="product-hero-price-save">
                        Save {formatPrice(savings)}
                        {savingsPct != null ? ` (${savingsPct}% off)` : ''}
                      </span>
                    )}
                    <span className="product-hero-price-sub">
                      Lowest across {vendorCount} vendor{vendorCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                <ProductHeroSpecs
                  productType={product.productType}
                  spec={spec}
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
                    upvotes={upvotes}
                    downvotes={downvotes}
                    userVote={userVote}
                    showVoting={product.productType === 'keyboards' || product.productType === 'mouse'}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ HERO STATS ═══ */}
        <ProductHeroStats
          vendorCount={vendorCount}
          rangeMin={rangeMin}
          rangeMax={rangeMax}
          lastUpdated={lastUpdated}
        />

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
              <VendorRow
                key={vp.id}
                vendorProduct={vp}
              />
            ))}
          </div>
        </section>

        {/* ═══ PRICE HISTORY + SPECIFICATIONS (TABS) ═══ */}
        <ProductTabs
          productType={product.productType}
          spec={spec}
          history={allHistory}
          vendorColors={vendorColors}
          coupons={couponByVendor}
          priceStats={priceStats}
        />
      </div>

      <Footer />
    </>
  );
}
