/**
 * Server-to-server cache revalidation endpoint. Product/price/spec data is
 * written by an external scraper/admin system, so this is how it tells the
 * app to drop the affected Data Cache entries. No UI calls this.
 *
 * Auth: shared secret (REVALIDATION_SECRET) compared with
 * crypto.timingSafeEqual to avoid timing leaks. Only a fixed set of actions
 * is accepted — arbitrary tags are never taken from the request body.
 */
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { timingSafeEqual } from 'node:crypto';
import { CACHE, invalidateTags } from '@/lib/cache';
import { CATEGORY_SLUGS } from '@/lib/config/category-config';
import { CATALOG_LISTINGS_TAG } from '@/lib/services/catalog-listings';

const MAX_BODY_BYTES = 8 * 1024;
const ACTIONS = new Set(['product', 'filters', 'switch-options', 'all-products']);
// Catalog pages share the `filters` tag, so revalidating the tag covers
// every category; the path revalidation below keeps those pages fresh too.
const CATALOG_PATHS = CATEGORY_SLUGS;

function secretsMatch(expected: string, provided: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Reads the request body up to MAX_BODY_BYTES bytes and returns its text, or
 * null when it exceeds the cap. Content-Length must not be trusted — a client
 * can omit it or send chunked encoding, so the cap is enforced on the stream
 * itself rather than on a header.
 */
async function readBodyLimited(request: NextRequest): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(decoder.decode(value, { stream: true }));
  }
  chunks.push(decoder.decode());
  return chunks.join('');
}

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATION_SECRET;
  if (!secret) {
    console.error('Revalidation requested but REVALIDATION_SECRET is not set');
    return NextResponse.json({ error: 'Server not configured for revalidation' }, { status: 503 });
  }

  const auth = request.headers.get('authorization');
  if (!auth) {
    return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
  }

  const raw = await readBodyLimited(request);
  if (raw === null) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Reject any shape that isn't a plain object with a string action. slug is
  // only meaningful for the `product` action, validated there.
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const action = (body as { action?: unknown }).action;
  if (typeof action !== 'string') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (!ACTIONS.has(action)) {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  const provided = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  if (!secretsMatch(secret, provided)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  switch (action) {
    case 'product': {
      const rawSlug = (body as { slug?: unknown }).slug;
      if (typeof rawSlug !== 'string') {
        return NextResponse.json({ error: 'slug is required' }, { status: 400 });
      }
      const normalized = rawSlug.trim().slice(0, 200);
      if (!normalized) {
        return NextResponse.json({ error: 'slug is required' }, { status: 400 });
      }
      invalidateTags(CACHE.product(normalized));
      revalidatePath(`/products/${normalized}`);
      return NextResponse.json({ ok: true, invalidated: [CACHE.product(normalized)] });
    }
    case 'filters': {
      invalidateTags(CACHE.filters, CATALOG_LISTINGS_TAG);
      revalidatePath('/', 'layout');
      for (const cat of CATALOG_PATHS) revalidatePath(`/${cat}`);
      return NextResponse.json({ ok: true, invalidated: [CACHE.filters] });
    }
    case 'switch-options': {
      invalidateTags(CACHE.switchOptions);
      return NextResponse.json({ ok: true, invalidated: [CACHE.switchOptions] });
    }
    case 'all-products': {
      invalidateTags(CACHE.productDetailAll, CATALOG_LISTINGS_TAG);
      for (const cat of CATALOG_PATHS) revalidatePath(`/${cat}`);
      return NextResponse.json({ ok: true, invalidated: [CACHE.productDetailAll] });
    }
  }
}