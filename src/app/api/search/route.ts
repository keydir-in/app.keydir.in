/**
 * Global search API endpoint — GET handler that queries products, vendors,
 * and brands by name (case-insensitive). Requires a minimum 2-character
 * query string; returns empty arrays for short or missing queries.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ products: [], vendors: [], brands: [] });
  }

  const pattern = { contains: q, mode: 'insensitive' as const };

  const [products, vendors, brands] = await Promise.all([
    prisma.product.findMany({
      where: {
        OR: [
          { name: pattern },
          { brand: { name: pattern } },
        ],
      },
      select: {
        name: true,
        slug: true,
        image: true,
        brand: { select: { name: true } },
        productType: true,
      },
      take: 8,
    }),
    prisma.vendor.findMany({
      where: { name: pattern },
      select: { name: true, slug: true },
      take: 5,
    }),
    prisma.brand.findMany({
      where: { name: pattern },
      select: { name: true, slug: true },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    products: products.map((p) => ({
      name: p.name,
      slug: p.slug,
      image: p.image,
      brand: p.brand?.name ?? null,
      category: p.productType,
      categorySlug: p.productType,
    })),
    vendors: vendors.map((v) => ({ name: v.name, slug: v.slug })),
    brands: brands.map((b) => ({ name: b.name, slug: b.slug })),
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' },
  });
}
