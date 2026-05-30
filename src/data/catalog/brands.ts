// src/data/catalog/brands.ts
import type { CatalogBrand, CatalogSeries } from "@/types/catalog";

export const catalogBrands: CatalogBrand[] = [
  {
    slug: "butterfly",
    name: "Butterfly",
    title: {
      uk: "Butterfly — накладки, основи, ракетки | офіційний інвентар в Україні",
      ru: "Butterfly — накладки, основания, ракетки | официальный инвентарь в Украине",
    },
    description: {
      uk: "Butterfly в Україні: накладки (Tenergy, Dignics, Zyre, Rozena), основи, готові ракетки, аксесуари. Офіційний товар, гарантія, доставка.",
      ru: "Butterfly в Украине: накладки (Tenergy, Dignics, Zyre, Rozena), основания, готовые ракетки, аксессуары. Официальный товар, гарантия, доставка.",
    },
    intro: {
      uk: "Японський бренд №1 у настільному тенісі. Технології Spring Sponge X, High Tension, Ricosheet. Накладки серій Dignics, Tenergy, Glayzer, Rozena, Zyre.",
      ru: "Японский бренд №1 в настольном теннисе. Технологии Spring Sponge X, High Tension, Ricosheet. Накладки серий Dignics, Tenergy, Glayzer, Rozena, Zyre.",
    },
    isActive: true,
  },
  // Заглушки под расширение (фильтр «бренд» + бренд-хабы). Активируются при добавлении товаров.
  { slug: "donic", name: "Donic", title: { uk: "Donic — настільний теніс", ru: "Donic — настольный теннис" }, description: { uk: "", ru: "" }, isActive: false },
  { slug: "joola", name: "Joola", title: { uk: "Joola — настільний теніс", ru: "Joola — настольный теннис" }, description: { uk: "", ru: "" }, isActive: false },
  { slug: "yasaka", name: "Yasaka", title: { uk: "Yasaka — настільний теніс", ru: "Yasaka — настольный теннис" }, description: { uk: "", ru: "" }, isActive: false },
  { slug: "tibhar", name: "Tibhar", title: { uk: "Tibhar — настільний теніс", ru: "Tibhar — настольный теннис" }, description: { uk: "", ru: "" }, isActive: false },
  { slug: "nittaku", name: "Nittaku", title: { uk: "Nittaku — настільний теніс", ru: "Nittaku — настольный теннис" }, description: { uk: "", ru: "" }, isActive: false },
  { slug: "dhs", name: "DHS", title: { uk: "DHS — настільний теніс", ru: "DHS — настольный теннис" }, description: { uk: "", ru: "" }, isActive: false },
  { slug: "stiga", name: "Stiga", title: { uk: "Stiga — настільний теніс", ru: "Stiga — настольный теннис" }, description: { uk: "", ru: "" }, isActive: false },
];

// Серии Butterfly (фильтр «серия» + срезы /nakladki/{series}).
export const catalogSeries: CatalogSeries[] = [
  { slug: "dignics", brandSlug: "butterfly", name: "Dignics" },
  { slug: "tenergy", brandSlug: "butterfly", name: "Tenergy" },
  { slug: "glayzer", brandSlug: "butterfly", name: "Glayzer" },
  { slug: "rozena", brandSlug: "butterfly", name: "Rozena" },
  { slug: "zyre", brandSlug: "butterfly", name: "Zyre" },
  { slug: "bryce", brandSlug: "butterfly", name: "Bryce" },
  { slug: "roundell", brandSlug: "butterfly", name: "Roundell" },
  { slug: "sriver", brandSlug: "butterfly", name: "Sriver" },
  { slug: "tackiness", brandSlug: "butterfly", name: "Tackiness" },
  { slug: "feint", brandSlug: "butterfly", name: "Feint" },
  { slug: "ilius", brandSlug: "butterfly", name: "Ilius" },
  { slug: "impartial", brandSlug: "butterfly", name: "Impartial" },
  { slug: "aibiss", brandSlug: "butterfly", name: "Aibiss" },
  { slug: "flextra", brandSlug: "butterfly", name: "Flextra" },
];

export default catalogBrands;
