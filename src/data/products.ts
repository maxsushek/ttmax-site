import type { Product } from "@/types";

/**
 * Featured products shown on homepage.
 * Currently Butterfly-only. To extend with other brands later — just add rows
 * with brand: "DHS", brand: "Stiga", etc. The Product type already supports it.
 */
export const featuredProducts: ReadonlyArray<Product> = [
  {
    id: "butterfly-timo-boll-alc",
    brand: "Butterfly",
    model: "Timo Boll ALC",
    category: "base",
    price: 8200,
    badge: "hit",
    accentColor: "#E8FF47",
    emoji: "🏓",
  },
  {
    id: "butterfly-viscaria",
    brand: "Butterfly",
    model: "Viscaria",
    category: "base",
    price: 9300,
    badge: "new",
    accentColor: "#FF6B81",
    emoji: "🎯",
  },
  {
    id: "butterfly-tenergy-05",
    brand: "Butterfly",
    model: "Tenergy 05",
    category: "rubber",
    price: 3500,
    badge: "hit",
    accentColor: "#2ED573",
    emoji: "⚡",
  },
  {
    id: "butterfly-dignics-09c",
    brand: "Butterfly",
    model: "Dignics 09c",
    category: "rubber",
    price: 4900,
    badge: "new",
    accentColor: "#A29BFE",
    emoji: "💎",
  },
  {
    id: "butterfly-rozena",
    brand: "Butterfly",
    model: "Rozena",
    category: "rubber",
    price: 1500,
    badge: "sale",
    accentColor: "#54A0FF",
    emoji: "🌟",
  },
  {
    id: "butterfly-hadrawshield",
    brand: "Butterfly",
    model: "Hadrawshield",
    category: "base",
    price: 3700,
    accentColor: "#E8FF47",
    emoji: "🛡",
  },
  {
    id: "butterfly-g40-3-star",
    brand: "Butterfly",
    model: "G40+ 3-Star (3 шт)",
    category: "ball",
    price: 280,
    badge: "hit",
    accentColor: "#FF6B81",
    emoji: "⚪",
  },
  {
    id: "butterfly-mizutani-shirt",
    brand: "Butterfly",
    model: "Mizutani Shirt",
    category: "apparel",
    price: 950,
    accentColor: "#2ED573",
    emoji: "🎽",
  },
];
