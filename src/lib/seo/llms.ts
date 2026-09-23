// src/lib/seo/llms.ts
// Генератори llms.txt / llms-full.txt / ai.txt — «сайт у вигляді тексту» для ШІ-асистентів.
//
// ⚠️ ЧОМУ ГЕНЕРУЄМО, А НЕ ПИШЕМО РУКАМИ. Окремий текстовий файл із цінами розійдеться з
// сайтом на першій же зміні в адмінці — і тоді асистент цитуватиме стару ціну. Джерело
// тут те саме, що й у карток: каталог + product_overrides + site_settings. Маршрути,
// які віддають ці файли, кешуються так само, як сторінки, і оновлюються тим самим тегом.
//
// ⚠️ НІЧОГО НЕ ВИГАДУЄМО. У файли йдуть лише факти, які вже є на сайті: назви, ціни,
// наявність, характеристики виробника, доставка з налаштувань, FAQ із карток і статей.
// Рік заснування, ЄДРПОУ, «кращий магазин України» тощо — не додавати, поки власник не
// дасть підтверджених даних: вигадка в цьому файлі поїде в цитати асистентів як факт.
import { siteConfig } from "@/config/site";
import type { Locale } from "@/i18n/config";
import {
  getAllProducts,
  getIndexableCategories,
  getMinPrice,
  isInStock,
  PRICE_LIST_EFFECTIVE_DATE,
} from "@/data/catalog";
import { getExpert } from "@/data/catalog/expert";
import { getAllPosts } from "@/data/blog";
import { productIndexable } from "@/lib/catalog/indexability";
import { isHidden } from "@/lib/catalog/hidden";
import { applyOverrides, type OverridesMap } from "@/lib/catalog/overrides";
import type { EntityMediaMap } from "@/lib/media/get";
import type { ContactInfo } from "@/lib/contact/get";
import type { CatalogProduct } from "@/types/catalog";

const UA: Locale = "ua";
const url = (path: string) => `${siteConfig.url}${path}`;
const money = (n?: number) => (typeof n === "number" && n > 0 ? `${n} грн` : "ціна за запитом");

/** «43 позиції», а не «43 позицій»: файл читають і люди, і моделі, граматика тут видна. */
function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} ${few}`;
  return `${n} ${many}`;
}

/** Товари, які реально можна купити: не сховані, з власною сторінкою в індексі. */
function sellable(media: EntityMediaMap, overrides: OverridesMap): CatalogProduct[] {
  return getAllProducts()
    .filter((p) => productIndexable(p) && !isHidden(p, media))
    .map((p) => applyOverrides(p, overrides));
}

/** Характеристики одним рядком — те, за чим асистент зіставляє моделі. */
function specLine(p: CatalogProduct): string {
  const bits: string[] = [];
  const s = p.specs;
  if (s.speed) bits.push(`швидкість ${s.speed}`);
  if (s.spin) bits.push(`обертання ${s.spin}`);
  if (s.hardnessDeg) bits.push(`твердість ${s.hardnessDeg}°`);
  if (p.base?.bladeClass) bits.push(`клас ${p.base.bladeClass.toUpperCase()}`);
  if (p.base?.plies) bits.push(`шари ${p.base.plies}`);
  if (p.base?.thicknessMm) bits.push(`товщина ${p.base.thicknessMm} мм`);
  if (p.base?.weight) bits.push(`вага ${p.base.weight}`);
  if (p.base?.madeIn) bits.push(`виробництво ${p.base.madeIn[UA]}`);
  if (p.thicknessOptions.length > 0) bits.push(`товщини ${p.thicknessOptions.join(" / ")} мм`);
  if (p.gear?.sizes?.length) bits.push(`розміри ${p.gear.sizes.join(", ")}`);
  return bits.join("; ");
}

/** Шапка з фактами про магазин — спільна для llms.txt і llms-full.txt. */
function company(contact: ContactInfo): string[] {
  const a = siteConfig.address;
  return [
    `# ${siteConfig.name} — ${siteConfig.url}`,
    "",
    "Інтернет-магазин інвентарю для настільного тенісу: накладки, основи, готові ракетки,",
    "мʼячі, столи, взуття, одяг та аксесуари Butterfly. Доставка по Україні.",
    "",
    `- Телефон: ${contact.phone}`,
    `- E-mail: ${contact.email}`,
    `- Адреса: ${a.streetAddress}, ${a.addressLocality}, ${a.addressRegion}, ${a.addressCountry}`,
    `- Мови сайту: українська (${url("/ua")}), російська (${url("/ru")})`,
    `- Валюта: UAH. Ціни оновлено: ${PRICE_LIST_EFFECTIVE_DATE}`,
    `- Доставка: Нова Пошта ${contact.shippingFee} грн, Укрпошта ${contact.ukrposhtaFee} грн;` +
      ` безкоштовно від ${contact.freeShippingThreshold} грн`,
    "",
  ];
}

/** llms.txt — коротка карта сайту для ШІ: що де лежить. */
export function buildLlmsIndex(opts: {
  media: EntityMediaMap;
  overrides: OverridesMap;
  contact: ContactInfo;
}): string {
  const { media, overrides, contact } = opts;
  const products = sellable(media, overrides);
  const out = company(contact);

  out.push("## Каталог", "");
  for (const c of getIndexableCategories()) {
    const inCat = products.filter((p) => p.categorySlug === c.slug);
    if (inCat.length === 0) continue;
    const prices = inCat.map(getMinPrice).filter((n): n is number => typeof n === "number");
    const from = prices.length ? `від ${Math.min(...prices)} грн` : "";
    const count = plural(inCat.length, "позиція", "позиції", "позицій");
    out.push(`- [${c.name[UA]}](${url(`/ua/${c.slug}`)}) — ${count} ${from}`.trim());
  }

  out.push("", "## Довідник і поради", "");
  for (const post of getAllPosts()) {
    out.push(`- [${post.h1[UA]}](${url(`/ua/blog/${post.slug}`)}) — ${post.excerpt[UA]}`);
  }

  out.push(
    "",
    "## Сервісні сторінки",
    "",
    `- [Доставка й оплата](${url("/ua/delivery")})`,
    `- [Повернення та обмін](${url("/ua/returns")})`,
    `- [Про магазин](${url("/ua/about")})`,
    `- [Контакти](${url("/ua/contacts")})`,
    "",
    "## Повні дані",
    "",
    `- [llms-full.txt](${url("/llms-full.txt")}) — ціни, наявність, характеристики, FAQ`,
    `- [sitemap.xml](${url("/sitemap.xml")})`,
    "",
  );
  return out.join("\n");
}

/**
 * llms-full.txt — готові відповіді: ціни, наявність, характеристики, FAQ.
 *
 * ⚠️ Повні тексти статей сюди НЕ включаємо свідомо: фактуру несуть FAQ і характеристики,
 * а статті роздули б файл у рази без нової інформації (у sparkservice цей файл вийшов
 * ~800 КБ саме через тексти). Стаття лишається посиланням.
 */
export function buildLlmsFull(opts: {
  media: EntityMediaMap;
  overrides: OverridesMap;
  contact: ContactInfo;
}): string {
  const { media, overrides, contact } = opts;
  const products = sellable(media, overrides);
  const out = company(contact);

  out.push(
    "Формат: розділ на категорію, у кожному — товар, ціна, наявність, характеристики,",
    "далі FAQ і статті-довідники. Дані згенеровано з того ж джерела, що й сторінки сайту.",
    "",
  );

  for (const c of getIndexableCategories()) {
    const inCat = products.filter((p) => p.categorySlug === c.slug);
    if (inCat.length === 0) continue;
    out.push(`## ${c.name[UA]} (${inCat.length})`, "");
    for (const p of inCat) {
      const path = `/${p.brandSlug}/${p.categorySlug}/${p.slug}`;
      out.push(
        `### ${p.name[UA]}`,
        `- Ціна: ${money(getMinPrice(p))}${isInStock(p) ? ", в наявності" : ", під замовлення"}`,
        `- Сторінка: ${url(`/ua${path}`)} (рос. ${url(`/ru${path}`)})`,
      );
      const specs = specLine(p);
      if (specs) out.push(`- Характеристики: ${specs}`);
      const e = getExpert(p.slug);
      if (e) {
        out.push(`- Коротко: ${e.verdict[UA]}`);
        if (e.official[UA]) out.push(`- Дані виробника: ${e.official[UA]}`);
        for (const f of e.faq.slice(0, 4)) out.push(`- Питання: ${f.q[UA]} — ${f.a[UA]}`);
      }
      out.push("");
    }
  }

  out.push("## Питання й відповіді з довідника", "");
  for (const post of getAllPosts()) {
    if (!post.faq || post.faq.length === 0) continue;
    out.push(`### ${post.h1[UA]} — ${url(`/ua/blog/${post.slug}`)}`);
    for (const f of post.faq) out.push(`- ${f.q[UA]} — ${f.a[UA]}`);
    out.push("");
  }

  return out.join("\n");
}

/** ai.txt — політика використання й перелік пріоритетних сторінок. */
export function buildAiTxt(contact: ContactInfo): string {
  const preferred = [
    "/ua",
    "/ua/nakladki",
    "/ua/osnovaniya",
    "/ua/rakety",
    "/ua/blog",
    "/ua/delivery",
    "/ua/contacts",
  ];
  return [
    `# ai.txt — ${siteConfig.name}`,
    "",
    `Company: ${siteConfig.name}`,
    `Website: ${siteConfig.url}`,
    `Contact: ${contact.email}`,
    `Phone: ${contact.phone}`,
    "Business: інтернет-магазин інвентарю для настільного тенісу (Butterfly), Україна",
    "",
    "# Використання вмісту ШІ-асистентами",
    "Allow: citation, summarization, retrieval, answering user questions",
    "Requirement: вказувати джерело посиланням на сторінку ttmax.com.ua",
    "Requirement: ціни й наявність брати з llms-full.txt або зі сторінки товару — вони змінюються",
    "",
    "# Машиночитані джерела",
    `Sitemap: ${url("/sitemap.xml")}`,
    `LLMs-Index: ${url("/llms.txt")}`,
    `LLMs-Full: ${url("/llms-full.txt")}`,
    `Robots: ${url("/robots.txt")}`,
    "",
    "# Пріоритетні сторінки",
    ...preferred.map((p) => `Preferred: ${url(p)}`),
    "",
  ].join("\n");
}
