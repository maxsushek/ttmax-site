// scripts/check-merchant-feed.mjs
// Перевірка товарного фіду Google Merchant Center (/{ua,ru}/google-merchant.xml) на вимоги
// специфікації — краще впасти тут, ніж отримати відхилені товари в Merchant Center.
//
//   node scripts/check-merchant-feed.mjs                       → зібрати фід локально з .feed-data/
//                                                                 у out/feeds/ і перевірити
//   node scripts/check-merchant-feed.mjs https://ttmax.com.ua  → перевірити живі фіди сайту
//
// Локальний режим бере ціни/фото/доставку з .feed-data/ (як gen-openai-feed.mjs — SQL у його
// шапці), бо локально env Supabase немає. Генератор той самий, що й у маршруті сайту.
import createJiti from "jiti";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = ["ua", "ru"];
const base = process.argv[2]?.replace(/\/$/, "");

async function localFeeds() {
  process.env.NEXT_PUBLIC_SITE_URL ||= "https://ttmax.com.ua";
  const jiti = createJiti(fileURLToPath(import.meta.url), { alias: { "@": path.join(ROOT, "src") } });
  const { merchantXmlChunks } = jiti("@/lib/feeds/google-merchant");
  const read = (f) => JSON.parse(readFileSync(path.join(ROOT, ".feed-data", f), "utf8"));
  const media = {};
  for (const [slug, ids] of Object.entries(read("media.json")))
    media[`product:${slug}`] = ids.map((publicId, i) => ({ publicId, sort: i }));
  const overrides = {};
  for (const [key, o] of Object.entries(read("overrides.json")))
    overrides[key] = {
      price: o.price == null ? undefined : Number(o.price),
      inStock: typeof o.in_stock === "boolean" ? o.in_stock : undefined,
    };
  const s = read("settings.json");
  const delivery = {
    freeShippingThreshold: Number(s.delivery_free_threshold),
    shippingFee: Number(s.delivery_shipping_fee),
    ukrposhtaFee: Number(s.delivery_ukrposhta_fee),
  };
  const out = {};
  mkdirSync(path.join(ROOT, "out", "feeds"), { recursive: true });
  for (const locale of LOCALES) {
    out[locale] = [...merchantXmlChunks({ locale, media, overrides, delivery })].join("");
    writeFileSync(path.join(ROOT, "out", "feeds", `google-merchant-${locale}.xml`), out[locale]);
  }
  return out;
}

async function liveFeeds() {
  const out = {};
  for (const locale of LOCALES) {
    const res = await fetch(`${base}/${locale}/google-merchant.xml`);
    if (!res.ok) throw new Error(`${locale}: HTTP ${res.status}`);
    out[locale] = await res.text();
  }
  return out;
}

const unx = (s) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const all = (xml, tag) => [...xml.matchAll(new RegExp(`<g:${tag}>([\\s\\S]*?)</g:${tag}>`, "g"))].map((m) => unx(m[1]));
const one = (xml, tag) => all(xml, tag)[0];

// Літери, яких немає в іншій мові: фід мовою, що не збігається з мовою сторінки, Google відхиляє.
const FOREIGN = { ua: /[ыэёъ]/i, ru: /[іїєґ]/i };
const REQUIRED = ["id", "title", "description", "link", "image_link", "availability", "price", "brand", "condition"];

function validate(locale, xml) {
  const problems = [];
  const warn = [];
  if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) problems.push("немає XML-декларації");
  if (!xml.trimEnd().endsWith("</rss>")) problems.push("фід обірваний (немає </rss>)");
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  const ids = new Set();
  const groups = new Map();
  const stats = { items: items.length, sale: 0, highlights: 0, details: 0, descLen: 0, byCat: {} };

  for (const it of items) {
    const id = one(it, "id") ?? "?";
    for (const f of REQUIRED) if (!one(it, f)) problems.push(`${id}: порожнє ${f}`);
    if (ids.has(id)) problems.push(`${id}: дубль id`);
    ids.add(id);
    if (id.length > 50 || !/^[A-Za-z0-9._-]+$/.test(id)) problems.push(`${id}: id > 50 або не ASCII`);
    const title = one(it, "title") ?? "";
    if (title.length > 150) problems.push(`${id}: title ${title.length} > 150`);
    if (/купити|купить|TTMAX|знижк|скидк|акці|акци|безкоштовн|бесплатн/i.test(title)) problems.push(`${id}: рекламні слова в title — ${title}`);
    const desc = one(it, "description") ?? "";
    stats.descLen += desc.length;
    if (desc.length > 5000) problems.push(`${id}: description ${desc.length} > 5000`);
    if (/\{\{|<[a-z/]|\]\(/i.test(desc)) problems.push(`${id}: токен/HTML/markdown в описі`);
    if (FOREIGN[locale].test(title) || FOREIGN[locale].test(desc)) warn.push(`${id}: літери іншої мови — ${title}`);
    const price = one(it, "price") ?? "";
    if (!/^\d+\.\d{2} UAH$/.test(price)) problems.push(`${id}: формат ціни ${price}`);
    const sale = one(it, "sale_price");
    if (sale) {
      stats.sale++;
      if (!(parseFloat(sale) < parseFloat(price))) problems.push(`${id}: sale_price ${sale} ≥ price ${price}`);
    }
    if (!one(it, "link")?.startsWith(`https://`) || !one(it, "link")?.includes(`/${locale}/`)) problems.push(`${id}: link не на /${locale}/`);
    if (!/^https:\/\/res\.cloudinary\.com\/.+\.jpg$/.test(one(it, "image_link") ?? "")) problems.push(`${id}: image_link`);
    if (/l_text|_znak-TT/.test(it)) problems.push(`${id}: водяний знак у фото`);
    if (all(it, "additional_image_link").length > 10) problems.push(`${id}: > 10 додаткових фото`);
    const hl = all(it, "product_highlight");
    if (hl.length) stats.highlights++;
    if (hl.length > 10) problems.push(`${id}: > 10 product_highlight`);
    for (const h of hl) if (h.length > 150) problems.push(`${id}: product_highlight ${h.length} > 150`);
    if (all(it, "attribute_name").length) stats.details++;
    if (!all(it, "shipping").length) problems.push(`${id}: немає shipping`);
    const cat = one(it, "google_product_category");
    stats.byCat[cat] = (stats.byCat[cat] ?? 0) + 1;
    const g = one(it, "item_group_id");
    if (g) {
      if (g === id) problems.push(`${id}: item_group_id = id`);
      const sig = ["color", "size"].filter((t) => one(it, t)).join("+");
      if (!groups.has(g)) groups.set(g, new Set());
      groups.get(g).add(sig);
    }
  }
  // У групі всі варіанти мусять розрізнятися однаковим набором атрибутів.
  for (const [g, sigs] of groups) if (sigs.size > 1) problems.push(`група ${g}: різні атрибути варіантів (${[...sigs].join(" / ")})`);
  return { problems, warn, stats, groups: groups.size, bytes: Buffer.byteLength(xml) };
}

const feeds = base ? await liveFeeds() : await localFeeds();
let failed = false;
for (const locale of LOCALES) {
  const { problems, warn, stats, groups, bytes } = validate(locale, feeds[locale]);
  console.log(`\n== ${locale}: ${stats.items} пропозицій, ${groups} груп варіантів, ${(bytes / 1024 / 1024).toFixed(2)} МБ`);
  console.log(`   акції: ${stats.sale}, з product_highlight: ${stats.highlights}, з product_detail: ${stats.details}, середній опис: ${Math.round(stats.descLen / Math.max(stats.items, 1))} симв.`);
  console.log(`   категорії Google: ${Object.entries(stats.byCat).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c}×${n}`).join(", ")}`);
  if (warn.length) console.log(`   ⚠ ${warn.length} попереджень:\n     ${warn.slice(0, 10).join("\n     ")}`);
  if (problems.length) {
    failed = true;
    console.log(`   ✗ ${problems.length} проблем:\n     ${problems.slice(0, 30).join("\n     ")}`);
  } else console.log("   ✓ вимоги специфікації виконано");
}
if (!base) console.log("\n→ out/feeds/google-merchant-{ua,ru}.xml");
process.exit(failed ? 1 : 0);
