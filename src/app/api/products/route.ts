/**
 * Products API endpoint — GET handler that returns paginated keyboard product
 * listings. Accepts search/filter params and delegates to fetchProductListings.
 * Returns JSON with products, total count, and pagination metadata.
 */
import { NextRequest, NextResponse } from 'next/server';
import { fetchProductListings, KEYBOARD_SPEC_CONFIG } from '@/lib/services/product-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const { products, total, page, pageSize, totalPages } = await fetchProductListings('keyboards', searchParams, KEYBOARD_SPEC_CONFIG, {
    includeUserVotes: false,
  });
  const response = NextResponse.json({ products, total, page, pageSize, totalPages });
  response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=300');
  return response;
}
