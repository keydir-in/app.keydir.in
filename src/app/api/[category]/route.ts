/**
 * Dynamic product listing API — GET handler shared by all catalog categories
 * (keyboards, keycaps, switches, mouse). Resolves the category config from
 * the URL segment, then delegates to fetchProductListings. Returns JSON with
 * products, total count, and pagination metadata.
 */
import { NextRequest, NextResponse } from 'next/server';
import { fetchProductListings } from '@/lib/services/product-service';
import { getCategoryConfig } from '@/lib/config/category-config';

interface Props {
  params: Promise<{ category: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  const { category } = await params;
  const config = getCategoryConfig(category);

  if (!config) {
    return NextResponse.json({ error: 'Unknown category' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);

  try {
    const result = await fetchProductListings(config.slug, searchParams, config.specConfig, {
      includeUserVotes: false,
    });
    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=300');
    return response;
  } catch (error) {
    console.error(`Failed to fetch ${category} listings:`, error);
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
  }
}
