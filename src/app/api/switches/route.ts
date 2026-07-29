import { NextRequest, NextResponse } from 'next/server';
import { fetchProductListings, SWITCH_SPEC_CONFIG } from '@/lib/services/product-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const { products, total, page, pageSize, totalPages } = await fetchProductListings('switches', searchParams, SWITCH_SPEC_CONFIG, {
    defaultSort: 'popular',
    includeUserVotes: false,
  });
  const response = NextResponse.json({ products, total, page, pageSize, totalPages });
  response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=300');
  return response;
}
