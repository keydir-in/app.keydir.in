import { NextRequest, NextResponse } from 'next/server';
import { fetchProductListings, MOUSE_SPEC_CONFIG } from '@/lib/services/product-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const { products, total, page, pageSize, totalPages } = await fetchProductListings('mouse', searchParams, MOUSE_SPEC_CONFIG, {
    includeUserVotes: false,
  });
  const response = NextResponse.json({ products, total, page, pageSize, totalPages });
  response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=300');
  return response;
}
