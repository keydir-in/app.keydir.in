/**
 * Dynamic product listing API — GET handler shared by all catalog categories
 * (keyboards, keycaps, switches, mouse). Resolves the category config from
 * the URL segment, then delegates to fetchProductListings. Streams an NDJSON
 * body (a metadata line, then one product object per line) so the client can
 * render products as they arrive instead of blocking on the full page.
 * Errors keep a plain JSON body so the client can read them with res.json().
 */
import { NextRequest, NextResponse } from 'next/server';
import { getCategoryConfig } from '@/lib/config/category-config';
import { cachedListings } from '@/lib/services/catalog-listings';

interface Props {
  params: Promise<{ category: string }>;
}

// Number of products flushed per network chunk; small batches + a yield
// between them let the transport deliver the top products first.
const FLUSH_BATCH = 4;

export async function GET(request: NextRequest, { params }: Props) {
  const { category } = await params;
  const config = getCategoryConfig(category);

  if (!config) {
    return NextResponse.json({ error: 'Unknown category' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();

  try {
    const result = await cachedListings(config.slug, qs, config.specConfig);

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const write = (s: string) => controller.enqueue(encoder.encode(s));
        write(
          `${JSON.stringify({
            total: result.total,
            page: result.page,
            pageSize: result.pageSize,
            totalPages: result.totalPages,
          })}\n`,
        );
        for (let i = 0; i < result.products.length; i += FLUSH_BATCH) {
          write(
            result.products
              .slice(i, i + FLUSH_BATCH)
              .map((p) => JSON.stringify(p))
              .join('\n') + '\n',
          );
          if (i + FLUSH_BATCH < result.products.length) {
            await new Promise((r) => setImmediate(r));
          }
        }
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=600, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error(`Failed to fetch ${category} listings:`, error);
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
  }
}
