/**
 * PRICE DROPS section. Server component that fetches products with recent
 * price drops and passes them to the interactive grid client.
 */

import { PriceDropsClient } from './price-drops-client';
import { cachedPriceDrops } from '@/lib/services/home-sections';

export async function PriceDrops() {
  const items = await cachedPriceDrops(12);
  return <PriceDropsClient items={items} />;
}
