import { buildFilterResponse } from '@/lib/filters';

export async function GET() {
  const response = await buildFilterResponse('keycaps');
  response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return response;
}
