import type { Brand } from "@/types";

/**
 * Currently displays Butterfly product lines (collections) — used by the
 * Brands section on the homepage. The Brand type stays untouched so adding
 * full brands later is just a matter of replacing/extending this array.
 *
 * To go multi-brand in future: replace with [{ id: 'butterfly', name: 'Butterfly', flag: '🇯🇵', ... },
 * { id: 'dhs', name: 'DHS', flag: '🇨🇳', ... }, ...]
 */
export const brands: ReadonlyArray<Brand> = [
  { id: "tenergy", name: "Tenergy", flag: "🔥", productsCount: 12 },
  { id: "dignics", name: "Dignics", flag: "💎", productsCount: 4 },
  { id: "rozena", name: "Rozena", flag: "🌟", productsCount: 1 },
  { id: "viscaria", name: "Viscaria / ALC", flag: "🎯", productsCount: 8 },
  { id: "hadraw", name: "Hadraw / Defense", flag: "🛡", productsCount: 5 },
  { id: "wear", name: "Butterfly Wear", flag: "🎽", productsCount: 24 },
];
