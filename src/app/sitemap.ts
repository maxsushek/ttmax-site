import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { defaultLocale, locales, localeToLang } from "@/i18n/config";
import {
  getActiveBrands,
  getAllProducts,
  getIndexableCategories,
  getProductsByBrand,
  getProductsByBrandCategory,
  getProductsByCategory,
} from "@/data/catalog";
import { getAllPosts } from "@/data/blog";
import { allAuthors } from "@/data/authors";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // Шляхи без локалі; "" — головна. Лише сторінки, що мають товари (індексовані).
  const paths: { path: string; priority: number; freq: "weekly" | "monthly" }[] = [
    { path: "", priority: 1.0, freq: "weekly" },
    { path: "/about", priority: 0.5, freq: "monthly" },
    { path: "/contacts", priority: 0.5, freq: "monthly" },
    { path: "/delivery", priority: 0.4, freq: "monthly" },
    { path: "/payment", priority: 0.4, freq: "monthly" },
    { path: "/returns", priority: 0.4, freq: "monthly" },
    { path: "/privacy", priority: 0.3, freq: "monthly" },
    { path: "/terms", priority: 0.3, freq: "monthly" },
    { path: "/blog", priority: 0.6, freq: "weekly" },
  ];

  // Статті блогу (getAllPosts вже відсіює чернетки) + сторінки авторів.
  for (const post of getAllPosts()) {
    paths.push({ path: `/blog/${post.slug}`, priority: 0.6, freq: "monthly" });
  }
  for (const author of allAuthors) {
    paths.push({ path: `/author/${author.slug}`, priority: 0.3, freq: "monthly" });
  }

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

  // Комбо-ракетки мають noindex (routing.ts) — не подаємо їх у sitemap, інакше в GSC
  // з'явиться 95× «Submitted URL marked noindex» (суперечливі сигнали: «проіндексуй» + «не індексуй»).
  for (const p of getAllProducts().filter((p) => p.kind !== "racket")) {
    paths.push({
      path: `/${p.brandSlug}/${p.categorySlug}/${p.slug}`,
      priority: 0.6,
      freq: "monthly",
    });
  }

  for (const { path, priority, freq } of paths) {
    const languages: Record<string, string> = {};
    // hreflang має бути BCP-47 кодом МОВИ (uk), а не кодом локалі в URL (ua).
    // URL лишається /ua і /ru — змінюється лише ключ alternates (ua→uk, ru→ru) + x-default.
    for (const l of locales) languages[localeToLang[l]] = `${siteConfig.url}/${l}${path}`;
    languages["x-default"] = `${siteConfig.url}/${defaultLocale}${path}`;
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
