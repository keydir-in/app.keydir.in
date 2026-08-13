/**
 * Lowest prices server component. Fetches the latest product additions
 * and passes them to LowestPricesClient for interactive filtering and
 * display.
 */

import { LowestPricesClient } from './lowest-prices-client';
import { cachedLowestPrices } from '@/lib/services/home-sections';

export async function LowestPrices() {
  const items = await cachedLowestPrices();
  if (items.length === 0) return null;
  return <LowestPricesClient items={items} />;
}
