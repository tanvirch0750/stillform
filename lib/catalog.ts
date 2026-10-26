import referenceProducts from '../public/storefront-data.json';

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
export type Size = typeof SIZES[number];
export const MAX_QUANTITY = 99;

export interface Product {
  id: string;
  route: string;
  name: string;
  image: string;
  description: string;
  price: number;
  sizes: readonly Size[];
}

// Integer USD cents, matching the displayed reference product prices.
// Ashfield's $199 price is preserved; its inconsistent $120 comparison price
// is deliberately not used as a sale/discount input.
const prices: Record<string, number> = {
  'riverfield-hoodie': 12900, 'skyfire-hoodie': 12900, 'ironhorn-hoodie': 12900,
  'silent-horizon-shirt': 6900, 'archive-silhouette-shirt': 6900, 'riverline-fade-shirt': 6900,
  'vanilla-overshirt': 9900, 'forest-textured-overshirt': 9900, 'ashfield-waffle-overshirt': 19900,
  'burnt-orange': 8900, 'sandstone-crew': 8900, 'midnight-crew': 8900,
  'butterfly-wing-sweatshirt': 9900, 'northern-lights-glow': 9900, 'drpcase-sweatshirt': 9900,
};

export const products: Product[] = referenceProducts.map((product) => {
  const id = product.route.split('/').at(-1)!;
  if (!Number.isInteger(prices[id])) throw new Error(`Missing demo price for ${id}`);
  return { ...product, id, price: prices[id], sizes: SIZES };
});

export const getProduct = (id: string) => products.find((product) => product.id === id);
export const getProductByRoute = (route: string) => products.find((product) => product.route === route.replace(/\/$/, ''));
export const money = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

export interface BagItem { productId: string; size: Size; quantity: number }
export const itemKey = (item: Pick<BagItem, 'productId' | 'size'>) => `${item.productId}:${item.size}`;

export function sanitizeItems(value: unknown): BagItem[] {
  if (!Array.isArray(value)) return [];
  const merged = new Map<string, BagItem>();
  for (const raw of value.slice(0, 1000)) {
    if (!raw || typeof raw !== 'object') continue;
    const { productId, size, quantity } = raw;
    if (typeof productId !== 'string' || !getProduct(productId) || !SIZES.includes(size) || !Number.isInteger(quantity) || quantity < 1) continue;
    const key = itemKey({ productId, size });
    merged.set(key, { productId, size, quantity: Math.min(MAX_QUANTITY, (merged.get(key)?.quantity || 0) + quantity) });
  }
  return [...merged.values()];
}

export function totals(items: BagItem[], code: string | null, shipping = 0) {
  const subtotal = items.reduce((sum, item) => sum + (getProduct(item.productId)?.price || 0) * item.quantity, 0);
  const discount = code === 'WINTER50' ? Math.round(subtotal * 0.5) : 0;
  return { subtotal, discount, shipping, total: subtotal - discount + shipping };
}
