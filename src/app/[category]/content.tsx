/**
 * Server-side content for catalog categories. Fetches banners, the active
 * product count, and the first page of the listing through the single shared
 * cachedListings() query (the same cache the NDJSON API route uses). The
 * returned product array is split into small batches, each rendered through
 * its own Suspense boundary by an async server component, so the initial
 * product grid streams into the HTML progressively (shell first, then one
 * batch of cards at a time) instead of arriving as one blocking block.
 *
 * The same listing is handed to the client as initialData so it can skip the
 * duplicate first NDJSON request and hydrate the already-streamed cards.
 */
import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { cachedBannersForLocation } from '@/lib/services/catalog-banners';
import { getCategoryConfig } from '@/lib/config/category-config';
import { CategoryContent } from '@/components/product/category-content';
import { ProductCard } from '@/components/product/product-card';
import { ProductCardSkeleton } from '@/components/skeleton';
import { cachedListings } from '@/lib/services/catalog-listings';
import { buildListingQueryFromSearchParams, type ListingSeed } from '@/lib/services/catalog-query';
import type { ProductCard as ProductCardType } from '@/types';

interface Props {
  category: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Cards per streaming batch. Kept small (5) so the grid fills in a few
// visible steps; matches the NDJSON route's flush granularity.
const BATCH_SIZE = 5;

// ponytail: setImmediate (event-loop yield) between batch gates is what lets
// the RSC stream flush each resolved boundary as its own network chunk — the
// same mechanism the NDJSON route uses between flush batches. It adds no real
// latency; React cannot emit separate chunks without a yield point.
function createFlushGates(count: number): Promise<void>[] {
  const gates: Promise<void>[] = [];
  let prev: Promise<void> = Promise.resolve();
  for (let i = 0; i < count; i++) {
    prev = prev.then(() => new Promise<void>((r) => setImmediate(r)));
    gates.push(prev);
  }
  return gates;
}

async function ProductBatch({ products, gate }: { products: ProductCardType[]; gate: Promise<void> }) {
  await gate;
  return <>{products.map((product) => <ProductCard key={product.id} product={product} />)}</>;
}

function BatchFallback({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </>
  );
}

function StreamedGrid({ products }: { products: ProductCardType[] }) {
  const batches: ProductCardType[][] = [];
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    batches.push(products.slice(i, i + BATCH_SIZE));
  }
  const gates = createFlushGates(batches.length);
  return (
    <div className="catalog-grid">
      {batches.map((batch, i) => (
        <Suspense key={i} fallback={<BatchFallback count={batch.length} />}>
          <ProductBatch products={batch} gate={gates[i]} />
        </Suspense>
      ))}
    </div>
  );
}

export default async function CategoryContentPage({ category, searchParams }: Props) {
  const config = getCategoryConfig(category);
  if (!config) return null;

  // Await searchParams first: it is the dynamic read that makes this component
  // a PPR hole, so the prerender pass suspends here and never executes the
  // banner query below. The banner query itself is cached ("use cache" +
  // cacheLife + `banners` tag), which also keeps it legal in dev's blocking
  // prerender of these generateStaticParams pages.
  const params = await searchParams;

  const [banners, totalCount] = await Promise.all([
    cachedBannersForLocation(config.slug),
    prisma.product.count({ where: { productType: config.slug, status: 'active' } }),
  ]);

  const query = buildListingQueryFromSearchParams(params, config.defaultSort);
  const listing = await cachedListings(config.slug, query, config.specConfig);

  const initialData: ListingSeed = {
    query,
    products: listing.products,
    total: listing.total,
    totalPages: listing.totalPages,
    pageSize: listing.pageSize,
  };

  return (
    <CategoryContent
      category={config.slug}
      banners={banners}
      totalCount={totalCount}
      initialData={initialData}
    >
      <StreamedGrid products={listing.products} />
    </CategoryContent>
  );
}
