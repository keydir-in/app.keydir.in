/**
 * PRICE DROPS section. Server component that fetches products with recent
 * price drops and passes them to the interactive grid client.
 */

import { PriceDropsClient } from './price-drops-client';
import { fetchPriceDrops } from '@/lib/services/product-service';

export async function PriceDrops() {
  const items = await fetchPriceDrops(12);
  return <PriceDropsClient items={items} />;
}
