import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { locales } from "@/i18n/config";
import {
  getActiveBrands,
  getAllProducts,
  getIndexableCategories,
  getProductsByBrand,
  getProductsByBrandCategory,
  getProductsByCategory,
} from "@/data/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // Шляхи без локалі; "" — головна. Лише сторінки, що мають товари (індексовані).
  const paths: { path: string; priority: number; freq: "weekly" | "monthly" }[] = [
    { path: "", priority: 1.0, freq: "weekly" },
  ];

  for (const c of getIndexableCategories()) {
    if (getProductsByCategory(c.slug).length > 0) {
      paths.push({ path: `/${c.slug}`, priority: 0.8, freq: "weekly" });
    }
  }

  for (const brand of getActiveBrands()) {
    if (getProductsByBrand(brand.slug).length === 0) continue;
    paths.push({ path: `/${brand.slug}`, priority: 0.7, freq: "weekly" });
    for (const c of getIndexableCategories()) {
      if (getProductsByBrandCategory(brand.slug, c.slug).length > 0) {
        paths.push({ path: `/${brand.slug}/${c.slug}`, priority: 0.7, freq: "weekly" });
      }
    }
  }

  for (const p of getAllProducts()) {
    paths.push({
      path: `/${p.brandSlug}/${p.categorySlug}/${p.slug}`,
      priority: 0.6,
      freq: "monthly",
    });
  }

  for (const { path, priority, freq } of paths) {
    const languages: Record<string, string> = {};
    for (const l of locales) languages[l] = `${siteConfig.url}/${l}${path}`;
    for (const locale of locales) {
      entries.push({
        url: `${siteConfig.url}/${locale}${path}`,
        lastModified: now,
        changeFrequency: freq,
        priority,
        alternates: { languages },
      });
    }
  }

  return entries;
}
