import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { defaultLocale, locales, localeToLang } from "@/i18n/config";
import {
  catalogSeries,
  getActiveBrands,
  getAllProducts,
  getIndexableCategories,
  getProductsByBrand,
  getProductsByBrandCategory,
  getProductsByCategory,
  getProductsBySeries,
} from "@/data/catalog";
import { surfaceGroups } from "@/lib/catalog/routing";
import { getAllPosts } from "@/data/blog";
import { allAuthors } from "@/data/authors";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // Шляхи без локалі; "" — головна. Лише сторінки, що мають товари (індексовані).
  // lastMod — РЕАЛЬНА дата зміни (де відома). Без неї Google отримує час білда `now`
  // на кожному деплої й перестає довіряти датам. Для статей беремо dateModified.
  const paths: { path: string; priority: number; freq: "weekly" | "monthly"; lastMod?: Date }[] = [
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
    paths.push({
      path: `/blog/${post.slug}`,
      priority: 0.6,
      freq: "monthly",
      lastMod: new Date(post.dateModified),
    });
  }
  for (const author of allAuthors) {
    paths.push({ path: `/author/${author.slug}`, priority: 0.3, freq: "monthly" });
  }

  for (const c of getIndexableCategories()) {
    if (getProductsByCategory(c.slug).length > 0) {
      paths.push({ path: `/${c.slug}`, priority: 0.8, freq: "weekly" });
    }
  }

  // Хаби серій (/{category}/{series}) і колекції за волокном (/osnovaniya/alc|zlc).
  // Роутер їх генерує й індексує, а sitemap про них не знав узагалі — 32 URL були поза мапою,
  // причому частина з них не має жодного внутрішнього посилання, тобто інакше їх не знайти.
  // Поріг >= 2 тримаємо однаковий із routing.ts, щоб мапа не суперечила noindex.
  for (const s of catalogSeries) {
    for (const c of getIndexableCategories()) {
      const n = getProductsBySeries(s.slug).filter((p) => p.categorySlug === c.slug).length;
      if (n >= 2) paths.push({ path: `/${c.slug}/${s.slug}`, priority: 0.6, freq: "weekly" });
    }
  }
  for (const g of surfaceGroups) {
    const n = getProductsByCategory(g.category).filter((p) =>
      g.surfaces.includes(p.base?.surface ?? ""),
    ).length;
    if (n > 0) paths.push({ path: `/${g.category}/${g.slug}`, priority: 0.6, freq: "weekly" });
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

  for (const { path, priority, freq, lastMod } of paths) {
    const languages: Record<string, string> = {};
    // hreflang має бути BCP-47 кодом МОВИ (uk), а не кодом локалі в URL (ua).
    // URL лишається /ua і /ru — змінюється лише ключ alternates (ua→uk, ru→ru) + x-default.
    for (const l of locales) languages[localeToLang[l]] = `${siteConfig.url}/${l}${path}`;
    languages["x-default"] = `${siteConfig.url}/${defaultLocale}${path}`;
    for (const locale of locales) {
      entries.push({
        url: `${siteConfig.url}/${locale}${path}`,
        lastModified: lastMod ?? now,
        changeFrequency: freq,
        priority,
        alternates: { languages },
      });
    }
  }

  return entries;
}
