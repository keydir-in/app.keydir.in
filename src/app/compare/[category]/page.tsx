/**
 * Dynamic comparison page per category (keyboards, mouse). Server-rendered
 * — reads product slugs from ?products= query param, fetches full product
 * data with specs and vendor pricing, computes vote stats, and passes
 * serialized data to the CompareClient component. Supports up to 4 products.
 */

import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/profile/actions';
import { cachedCompareProducts } from '@/lib/services/compare-cache';
import { CompareClient } from '../compare-client';
import { CompareLayout } from '@/components/compare/compare-layout';
import { CATEGORIES } from '../compare-config';
import { toNum } from '@/lib/utils';
import { computeVoteStats } from '@/lib/vote-utils';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ products?: string }>;
}


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const config = CATEGORIES[category];
  if (!config) return { robots: { index: false } };

  const label = category === 'keyboards' ? 'Keyboards' : 'Mice';
  return {
    title: `Compare ${label} Side by Side | KeyDir`,
    description: `Compare ${label.toLowerCase()} side by side. View specifications, prices from Indian vendors, and make an informed purchase decision.`,
    robots: { index: true, follow: true },
    openGraph: {
      title: `Compare ${label} — KeyDir`,
      description: `Compare ${label.toLowerCase()} side by side with specifications and prices from Indian vendors.`,
      url: `https://app.keydir.in/compare/${category}`,
    },
  };
}

function serializeSpec(spec: Record<string, unknown>): Record<string, unknown> {
  const exclude = new Set(['id', 'productId']);
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(spec)) {
    if (exclude.has(key)) continue;
    if (typeof value === 'object' && value !== null && 'toNumber' in value) {
      result[key] = (value as { toNumber(): number }).toNumber();
    } else {
      result[key] = value;
    }
  }
  return result;
}

export default async function CompareCategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  const config = CATEGORIES[category];
  if (!config) notFound();

  const { products: productsParam } = await searchParams;
  const slugs = productsParam
    ? productsParam.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 4)
    : [];

  const rawProducts = slugs.length >= 1
    ? await cachedCompareProducts(slugs, config.productType)
    : [];

  const productMap = new Map(rawProducts.map((p) => [p.slug, p]));
  const orderedProducts = slugs
    .map((s) => productMap.get(s))
    .filter((p): p is NonNullable<typeof p> => !!p);

  const currentUser = await getCurrentUser();

  let userCollections: Set<string> = new Set();
  let userVotes: Record<string, 'upvote' | 'downvote'> = {};
  if (currentUser && orderedProducts.length > 0) {
    const ids = orderedProducts.map((p) => p.id);
    const [collections, votes] = await Promise.all([
      prisma.collection.findMany({
        where: { profileId: currentUser.id, productId: { in: ids } },
        select: { productId: true },
      }),
      prisma.vote.findMany({
        where: { profileId: currentUser.id, productId: { in: ids } },
        select: { productId: true, type: true },
      }),
    ]);
    userCollections = new Set(collections.map((c) => c.productId));
    userVotes = Object.fromEntries(
      votes.map((v) => [v.productId, v.type as 'upvote' | 'downvote'])
    );
  }

  const serialized = orderedProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: p.image,
    productType: p.productType,
    brand: p.brand,
    spec: (p as Record<string, unknown>)[config.specKey]
      ? serializeSpec((p as Record<string, unknown>)[config.specKey] as Record<string, unknown>)
      : null,
    vendorProducts: p.vendorProducts.map((vp) => ({
      id: vp.id,
      totalPrice: toNum(vp.totalPrice),
      effectivePrice: toNum(vp.effectivePrice),
      shippingCost: toNum(vp.shippingCost),
      vendor: { name: vp.vendor.name, chartColor: vp.vendor.chartColor },
    })),
    upvotes: computeVoteStats(p.votes).upvotes,
    downvotes: computeVoteStats(p.votes).downvotes,
    userVote: userVotes[p.id] || null,
    inCollection: userCollections.has(p.id),
  }));

  return (
    <CompareLayout breadcrumb={config.breadcrumb} bannerLocation={config.categoryFilter}>
      <CompareClient
        initialSlugs={slugs}
        initialProducts={serialized}
        basePath={config.basePath}
        title={config.title}
        titleHighlight={config.titleHighlight}
        categoryFilter={config.categoryFilter}
        addLabel={config.addLabel}
        searchPlaceholder={config.searchPlaceholder}
        emptyMessage={config.emptyMessage}
        maxMessage={config.maxMessage}
        noResultsMessage={config.noResultsMessage}
        specGroups={config.specGroups}
        noSpecsMessage={config.noSpecsMessage}
      />
    </CompareLayout>
  );
}
