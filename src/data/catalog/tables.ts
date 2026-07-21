// src/data/catalog/tables.ts
// Тенісні столи (категорія `stoly`). Окремий файл, бо це стратегічна категорія росту:
// «тенісний стіл» — найбільший попит ніші (~2800/міс), а категорія довго стояла порожня.
// kind: "gear" + gearType: "table" — рендериться тим самим GearView (спеки в gear.*).
// ЦІНА: `priceFrom` НЕ задаємо свідомо → GearPurchasePanel показує «Ціна за запитом»
// і CTA «Запитати ціну» (tel:) замість кошика. Це і є «під замовлення».
// ⚠️ seriesSlug порожній, тому crossSell задаємо ЯВНО: інакше фолбек getCrossSell
// підтягне всі товари з порожньою серією (усе екіпірування).
import type { CatalogProduct } from "@/types/catalog";

export const catalogTables: CatalogProduct[] = [
  {
    id: "stil-butterfly-timo-boll-space-saver-22",
    slug: "stil-butterfly-timo-boll-space-saver-22",
    brandSlug: "butterfly",
    seriesSlug: "",
    categorySlug: "stoly",
    model: "Timo Boll Space Saver 22 ITTF",
    kind: "gear",
    name: {
      ua: "Тенісний стіл Butterfly Timo Boll Space Saver 22 ITTF Grey",
      ru: "Теннисный стол Butterfly Timo Boll Space Saver 22 ITTF Grey",
    },
    title: {
      ua: "Тенісний стіл Butterfly Timo Boll Space Saver 22 ITTF | TTMAX",
      ru: "Теннисный стол Butterfly Timo Boll Space Saver 22 ITTF | TTMAX",
    },
    description: {
      ua: "Професійний тенісний стіл Butterfly Timo Boll Space Saver 22: стільниця 22 мм, схвалення ITTF, складна конструкція на колесах, сітка в комплекті. Ціна за запитом.",
      ru: "Профессиональный теннисный стол Butterfly Timo Boll Space Saver 22: столешница 22 мм, одобрение ITTF, складная конструкция на колёсах, сетка в комплекте. Цена по запросу.",
    },
    level: "pro",
    specs: {},
    thicknessOptions: [],
    colors: [],
    variants: [],
    images: [],
    priority: 1,
    inStock: true,
    gear: {
      gearType: "table",
      tableThicknessMm: 22,
      sizeUnfolded: "274 × 152,5 × 76 см",
      sizeFolded: "152 × 160 × 48 см",
      weightKg: 97,
      ittf: true,
      usage: "indoor",
      rollaway: true,
    },
    targetKeyword: "тенісний стіл",
    searchVolume: 2800,
    // Сітка National League йде в комплекті зі столом — природний перелінк.
    crossSell: ["sitka-butterfly-national-league", "m-iachi-butterfly-s40-3-ittf-3-sht-v-up"],
  },
];
