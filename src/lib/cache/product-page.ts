/**
 * Cached product-page data. The product detail query is the heaviest DB work
 * per request; caching it (plus the sound-test list and the switch picker)
 * turns repeat visits into data-cache reads. Per-slug tags let price/spec/
 * coupon/sound-test mutations invalidate exactly one product's entries.
 *
 * Product detail stays on the durable per-slug unstable_cache (perSlugCache):
 * the page is auth-dynamic so the PPR/client-router benefits of an outer
 * "use cache" scope don't apply, and the Date rehydration it requires would
 * be re-serialized for no gain. The sound-test list and switch picker are
 * plain serializable data and do get the outer Cache Components scope.
 */
import { unstable_cache, cacheLife, cacheTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { findProductBySlug, type ProductWithDetails } from '@/lib/repositories/product-repository';
import { CACHE, perSlugCache } from '@/lib/cache';
import type { SoundTestItem, SwitchOption } from '@/types';

// unstable_cache stores JSON: on cache hits Date fields arrive as ISO strings,
// on misses they stay Date objects. Serializing up front (and rehydrating the
// two fields the page treats as Dates) keeps both paths identical.
function toSerializable<T>(value: T): T {
  if (value instanceof Date) return value.toISOString() as unknown as T;
  if (Array.isArray(value)) return value.map(toSerializable) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = toSerializable(v);
    return out as unknown as T;
  }
  return value;
}

async function loadProductDetail(slug: string): Promise<{
  product: ProductWithDetails;
  switchImages: Record<string, string | null>;
} | null> {
  const product = await findProductBySlug(slug);
  if (!product) return null;

  // Resolve linked switch product images so the Components → Switches cards
  // can show a thumbnail (vendor-row style) instead of a text-only block.
  const rawSpec: Record<string, unknown> | null =
    product.keyboardSpec ?? product.switchSpec ?? product.keycapSpec ?? product.mouseSpec;
  const switchOpts = Array.isArray(rawSpec?.switches)
    ? (rawSpec!.switches as Record<string, unknown>[])
    : [];
  const linkedIds = switchOpts
    .map((s) => s.linkedSwitchId)
    .filter((x): x is string => typeof x === 'string' && !!x);

  const switchImages: Record<string, string | null> = {};
  if (linkedIds.length) {
    const rows = await prisma.product.findMany({
      where: { id: { in: linkedIds } },
      select: { id: true, image: true },
    });
    for (const r of rows) switchImages[r.id] = r.image;
  }

  return { product: toSerializable(product), switchImages };
}

const rawGetProductDetail = perSlugCache(
  'product-detail',
  90,
  CACHE.product,
  loadProductDetail,
  [CACHE.productDetailAll],
);

export async function getProductDetail(slug: string) {
  const data = await rawGetProductDetail(slug);
  if (!data) return null;
  for (const vp of data.product.vendorProducts) {
    for (const ph of vp.priceHistory) ph.recordedAt = new Date(ph.recordedAt);
    vp.updatedAt = new Date(vp.updatedAt);
  }
  return data;
}

async function loadSoundTests(slug: string): Promise<SoundTestItem[]> {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!product) return [];

  const rows = await prisma.soundTest.findMany({
    where: { productId: product.id },
    orderBy: { createdAt: 'desc' },
    include: { profile: { select: { username: true } }, switchProduct: { select: { name: true } } },
  });

  return rows.map((st) => ({
    id: st.id,
    audioUrl: st.audioUrl,
    duration: st.duration,
    keyboardName: st.keyboardName,
    foamUsed: st.foamUsed,
    pcbDetails: st.pcbDetails,
    plate: st.plate,
    switchName: st.switchProduct?.name ?? st.switchName,
    springWeight: st.springWeight,
    isLubed: st.isLubed,
    isFilmed: st.isFilmed,
    otherMods: st.otherMods,
    keycapsName: st.keycapsName,
    keycapsMaterial: st.keycapsMaterial,
    keycapsProfile: st.keycapsProfile,
    additionalMods: st.additionalMods,
    createdAt: st.createdAt.toISOString(),
    username: st.profile.username,
    profileId: st.profileId,
  }));
}

const rawGetSoundTests = perSlugCache('sound-tests', 60, CACHE.soundTests, loadSoundTests);

export async function getSoundTests(slug: string): Promise<SoundTestItem[]> {
  'use cache';
  cacheLife('catalog');
  cacheTag(CACHE.soundTests(slug));
  return rawGetSoundTests(slug);
}

const rawGetSwitchOptions = unstable_cache(
  async (): Promise<SwitchOption[]> =>
    prisma.product.findMany({
      where: { productType: 'switches', status: 'active' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ['switch-options'],
  { revalidate: 600, tags: [CACHE.switchOptions] },
);

export async function getSwitchOptions(): Promise<SwitchOption[]> {
  'use cache';
  cacheLife('options');
  cacheTag(CACHE.switchOptions);
  return rawGetSwitchOptions();
}
