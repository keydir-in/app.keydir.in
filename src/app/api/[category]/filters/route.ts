/**
 * Dynamic filter options API — GET handler shared by all catalog categories.
 * Resolves the category from the URL segment and delegates to
 * buildFilterResponse, which returns spec/brand/vendor/price filter options.
 */
import { NextRequest, NextResponse } from 'next/server';
import { buildFilterResponse } from '@/lib/filters';
import { getCategoryConfig } from '@/lib/config/category-config';

interface Props {
  params: Promise<{ category: string }>;
}

export async function GET(_request: NextRequest, { params }: Props) {
  const { category } = await params;

  if (!getCategoryConfig(category)) {
    return NextResponse.json({ error: 'Unknown category' }, { status: 404 });
  }

  try {
    const response = await buildFilterResponse(category);
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return response;
  } catch (error) {
    console.error(`Failed to fetch ${category} filters:`, error);
    return NextResponse.json({ error: 'Failed to load filters' }, { status: 500 });
  }
}
