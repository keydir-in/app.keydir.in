/**
 * Client-side product compare tray state manager. Reads the compare list
 * from localStorage. The tray is currently read-only — nothing writes to it
 * anymore.
 */
export interface CompareTrayItem {
  slug: string;
  name: string;
  image: string | null;
  price: number | null;
  category: string;
}

const KEY = 'keydir_compare';

let category: string | null = null;
let products: CompareTrayItem[] = [];

export function loadCompareFromStorage(): { category: string | null; products: CompareTrayItem[] } {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.category && Array.isArray(parsed.products)) {
        category = parsed.category;
        products = parsed.products;
        return { category, products: [...products] };
      }
    }
  } catch {}
  return { category: null, products: [] };
}
