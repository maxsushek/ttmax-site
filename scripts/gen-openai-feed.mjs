// scripts/gen-openai-feed.mjs
// Товарний фід для ChatGPT (OpenAI Product Feed, формат JSONL) з тих самих даних, що й сайт.
//
//   node scripts/gen-openai-feed.mjs            → out/feeds/openai-products.jsonl(.gz) + звіт
//
// Специфікація: https://developers.openai.com/commerce/specs/feed/ (звірено 15.10.2026).
// Фід НЕ віддається сайтом і НЕ краулиться: OpenAI приймає його пушем (SFTP) після схвалення
// заявки на chatgpt.com/merchants. Тому це локальний скрипт, а не маршрут — деплой і квота
// Vercel тут ні до чого.
//
// ⚠️ ДАНІ З SUPABASE — З ФАЙЛІВ У .feed-data/, а не з бази напряму: локально env Supabase
// немає. Перед генерацією їх треба оновити (SQL у коментарі до loadData нижче), інакше у фід
// підуть учорашні ціни або фото. Каталог (назви, варіанти, ціни з коду) береться з src/
// через jiti — тими самими функціями, що й сторінка товару, тож фід не розійдеться з сайтом.
//
// ⚠️ ВСЕ, ЩО ЙДЕ У ФІД, МУСИТЬ ЗБІГАТИСЯ З КАРТКОЮ НА САЙТІ: ціна, наявність, доставка,
// повернення. Розбіжність фіду й сторінки — підстава відхилити товар (так працюють і
// Google Merchant Center, і OpenAI). Тому числа не вписуються руками, а беруться з тих
// самих джерел: overrides → ціна, site_settings → доставка, jsonld.ts → 14 днів повернення.
// jiti 1.x (стоїть як залежність tailwind): синхронний require для TS з аліасом @/.
import createJiti from "jiti";
import { gzipSync } from "node:zlib";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(fileURLToPath(import.meta.url), { alias: { "@": path.join(ROOT, "src") } });

const { getAllProducts, getBrandBySlug, getCategoryBySlug, getMinPrice, isInStock } = jiti("@/data/catalog");
const { applyOverrides } = jiti("@/lib/catalog/overrides");
const { isHidden } = jiti("@/lib/catalog/hidden");
const { productLdDescription } = jiti("@/lib/seo/product-copy");
const { promoOldPrice } = jiti("@/data/catalog/promos");
const { isRacket, resolveCombo } = jiti("@/lib/catalog/racket");

const SITE = "https://ttmax.com.ua";
const LOCALE = "ua";
const CURRENCY = "UAH";
// Хмара Cloudinary — та сама, що в siteConfig.logoUrl (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME).
const CLOUD = "dh6vuxjko";
// Продавець — магазин (operator у siteConfig), а НЕ виробник. «Butterfly UA» на логотипі
// читалось би як офіційне представництво Butterfly, а OpenAI окремо зважає, чи продавець
// є виробником. Бренд товару — окреме поле brand.
const SELLER_NAME = "TTMAX";
// 14 днів — ст. 9 ЗУ «Про захист прав споживачів»; те саме число в jsonld.ts (RETURN_DAYS)
// і в тексті /returns.
const RETURN_DAYS = 14;

/**
 * Дані з Supabase, вивантажені у .feed-data/ (через Supabase SQL):
 *   media.json     — {slug: [public_id, …]} фото товарів у порядку sort, id (до 10 на товар):
 *     select json_object_agg(entity_slug, ids) from (select entity_slug,
 *       json_agg(public_id order by sort, id) filter (where rn <= 10) ids from (select *,
 *       row_number() over (partition by entity_slug order by sort, id) rn from entity_media
 *       where entity_type='product') t group by entity_slug) s;
 *   overrides.json — {key: {price, in_stock, updated_at}} з product_overrides;
 *   settings.json  — delivery_free_threshold, delivery_shipping_fee, delivery_ukrposhta_fee.
 */
function loadData() {
  const read = (f) => JSON.parse(readFileSync(path.join(ROOT, ".feed-data", f), "utf8"));
  const mediaBySlug = read("media.json");
  const rawOverrides = read("overrides.json");
  const settings = read("settings.json");

  // Та сама форма, що віддає getMediaMap() — інакше isHidden() побачить «без фото».
  const media = {};
  for (const [slug, ids] of Object.entries(mediaBySlug)) {
    media[`product:${slug}`] = ids.map((publicId, i) => ({ publicId, sort: i }));
  }
  // Та сама форма, що віддає getOverrides().
  const overrides = {};
  for (const [key, o] of Object.entries(rawOverrides)) {
    overrides[key] = {
      price: o.price == null ? undefined : Number(o.price),
      inStock: typeof o.in_stock === "boolean" ? o.in_stock : undefined,
    };
  }
  const fees = [settings.delivery_shipping_fee, settings.delivery_ukrposhta_fee]
    .map(Number)
    .filter((n) => Number.isFinite(n) && n >= 0);
  return {
    mediaBySlug,
    media,
    overrides,
    freeThreshold: Number(settings.delivery_free_threshold),
    // Найдешевший перевізник — так само Google показує мінімальну ставку з shippingDetails.
    shippingFee: Math.min(...fees),
  };
}

const money = (n) => `${n.toFixed(2)} ${CURRENCY}`;

/**
 * Пряме посилання на JPEG без водяного знаку.
 * ⚠️ Не cldUrl() із сайту: там f_auto (AVIF/WebP за заголовком Accept), а специфікація
 * просить JPEG або PNG. І без знаку TTMAX: майданчики товарних фідів (Google Merchant
 * Center прямо, OpenAI — за тими самими правилами якості) відхиляють фото з накладками.
 */
const imageUrl = (publicId) =>
  `https://res.cloudinary.com/${CLOUD}/image/upload/f_jpg,q_auto:good,c_limit,w_1600,h_1600/${encodeURI(publicId)}.jpg`;

/** «Накладка Butterfly Dignics 05 — купити в Україні | TTMAX» → «Накладка Butterfly Dignics 05». */
function baseTitle(p) {
  const t = p.title?.[LOCALE] ?? p.name[LOCALE];
  return t.split(/\s+[—-]\s+(?:купити|купить)/i)[0].replace(/\s*\|\s*TTMAX$/, "").trim();
}

const COLOR_UA = { red: "червона", black: "чорна" };
const COLOR_DICT = { red: "червоний", black: "чорний" };
const thicknessLabel = (t) => (/^\d/.test(t) ? `${t} мм` : t);
const GENDER = { men: "male", women: "female", unisex: "unisex" };

/** Плейн-текст опису. Експертний вердикт + офіційні характеристики — як у Product JSON-LD. */
function description(p, categoryName) {
  const expert = productLdDescription(p, LOCALE);
  if (expert) return expert;
  if (p.description?.[LOCALE]) return p.description[LOCALE];
  // Фолбек лише з фактів картки — без «відгуків» і обіцянок, яких на сторінці немає.
  const g = p.gear ?? {};
  const facts = [
    `${baseTitle(p)}.`,
    categoryName ? `Категорія: ${categoryName.toLowerCase()}.` : "",
    g.sizes?.length ? `Розміри: ${g.sizes.join(", ")}.` : "",
    g.colorways?.length ? `Кольори: ${g.colorways.map((c) => c[LOCALE]).join(", ")}.` : "",
    g.packSize ? `У пакованні: ${g.packSize}.` : "",
    g.volumeMl ? `Обʼєм: ${g.volumeMl} мл.` : "",
    `Оригінальна продукція ${getBrandBySlug(p.brandSlug)?.name ?? "Butterfly"}, доставка по Україні.`,
  ];
  return facts.filter(Boolean).join(" ");
}

function build() {
  const { mediaBySlug, media, overrides, freeThreshold, shippingFee } = loadData();
  const rows = [];
  const skipped = { hidden: [], noPrice: [], noImage: [] };

  for (const raw of getAllProducts()) {
    if (isHidden(raw, media)) {
      skipped.hidden.push(raw.slug);
      continue;
    }
    const p = applyOverrides(raw, overrides);
    const category = getCategoryBySlug(p.categorySlug);
    const categoryName = category?.name?.[LOCALE] ?? "";
    const brand = getBrandBySlug(p.brandSlug)?.name ?? p.brandSlug;
    const url = `${SITE}/${LOCALE}/${p.brandSlug}/${p.categorySlug}/${p.slug}`;

    // Збірна ракетка: ціна з компонентів мінус акційна знижка — як на картці (racket.ts).
    let price = getMinPrice(p);
    let oldPrice = promoOldPrice(p.slug, price);
    let images = mediaBySlug[p.slug] ?? [];
    if (isRacket(p)) {
      const combo = resolveCombo(p, overrides);
      price = combo.promoPrice;
      oldPrice = combo.oldPrice;
      // Своїх фото у збірок немає — сайт показує фото основи.
      if (!images.length && combo.blade) images = mediaBySlug[combo.blade.slug] ?? [];
    }
    if (!(typeof price === "number" && price > 0)) {
      skipped.noPrice.push(p.slug);
      continue;
    }
    if (!images.length) {
      skipped.noImage.push(p.slug);
      continue;
    }

    const common = {
      title: baseTitle(p),
      description: description(p, categoryName).slice(0, 5000),
      url,
      brand,
      seller_name: SELLER_NAME,
      seller_url: `${SITE}/${LOCALE}`,
      seller_privacy_policy: `${SITE}/${LOCALE}/privacy`,
      seller_tos: `${SITE}/${LOCALE}/terms`,
      image_url: imageUrl(images[0]),
      additional_image_urls: images.slice(1).map(imageUrl),
      condition: "new",
      product_category: ["Настільний теніс", categoryName].filter(Boolean).join(" > "),
      accepts_returns: true,
      return_deadline_in_days: RETURN_DAYS,
      return_policy: `${SITE}/${LOCALE}/returns`,
      is_eligible_search: true,
    };
    if (p.gear?.gender && GENDER[p.gear.gender]) common.gender = GENDER[p.gear.gender];

    /** Ціна, акція й доставка для конкретної ціни варіанта. */
    const pricing = (current) => {
      const out = {};
      // Акція: у фіді price — ЗВИЧАЙНА ціна, sale_price — поточна (так вимагає специфікація:
      // sale_price < price). На сайті це закреслена стара й актуальна.
      if (typeof oldPrice === "number" && oldPrice > current) {
        out.price = money(oldPrice);
        out.sale_price = money(current);
      } else {
        out.price = money(current);
      }
      // Безкоштовна доставка від порогу — як у Product JSON-LD і в кошику.
      out.shipping_price = money(current >= freeThreshold ? 0 : shippingFee);
      return out;
    };

    // Накладки: окремий рядок на кожну товщину × колір (група = товар).
    const rubberVariants = (p.variants ?? []).filter((v) => typeof v.price === "number" && v.price > 0);
    if (rubberVariants.length > 1) {
      for (const v of rubberVariants) {
        rows.push({
          item_id: `${p.slug}__${v.thickness}__${v.color}`,
          group_id: p.slug,
          listing_has_variations: true,
          variant_dict: { thickness: thicknessLabel(v.thickness), color: COLOR_DICT[v.color] ?? v.color },
          ...common,
          title: `${common.title} — ${thicknessLabel(v.thickness)}, ${COLOR_UA[v.color] ?? v.color}`.slice(0, 150),
          color: COLOR_DICT[v.color] ?? v.color,
          availability: v.inStock === true ? "in_stock" : "out_of_stock",
          ...pricing(v.price),
        });
      }
      continue;
    }

    const availability = isInStock(p) ? "in_stock" : "out_of_stock";
    // Одяг і взуття: рядок на розмір (ціна й наявність у нас не залежать від розміру).
    const sizes = p.gear?.sizes ?? [];
    if (sizes.length > 1) {
      for (const size of sizes) {
        rows.push({
          item_id: `${p.slug}__${size}`,
          group_id: p.slug,
          listing_has_variations: true,
          variant_dict: { size },
          ...common,
          title: `${common.title} — розмір ${size}`.slice(0, 150),
          size,
          availability,
          ...pricing(price),
        });
      }
      continue;
    }

    rows.push({ item_id: p.slug, ...common, title: common.title.slice(0, 150), availability, ...pricing(price) });
  }
  return { rows, skipped };
}

/** Перевірки, які специфікація робить на прийомі, — краще впасти тут, ніж отримати відмову. */
function validate(rows) {
  const problems = [];
  const ids = new Set();
  const REQUIRED = ["item_id", "title", "description", "url", "brand", "seller_name", "image_url", "availability", "price"];
  for (const r of rows) {
    for (const f of REQUIRED) if (!r[f]) problems.push(`${r.item_id}: порожнє ${f}`);
    if (ids.has(r.item_id)) problems.push(`${r.item_id}: дубль item_id`);
    ids.add(r.item_id);
    if (r.group_id && r.group_id === r.item_id) problems.push(`${r.item_id}: group_id = item_id`);
    if (r.title.length > 150) problems.push(`${r.item_id}: title > 150`);
    if (/\{\{|<[a-z/]|\]\(/i.test(r.description)) problems.push(`${r.item_id}: токен/HTML/markdown в описі`);
    if (!/^\d+\.\d{2} UAH$/.test(r.price)) problems.push(`${r.item_id}: формат ціни ${r.price}`);
  }
  return problems;
}

const { rows, skipped } = build();
const problems = validate(rows);
if (problems.length) {
  console.error(`✗ ${problems.length} проблем:\n  ${problems.slice(0, 30).join("\n  ")}`);
  process.exit(1);
}

const outDir = path.join(ROOT, "out", "feeds");
mkdirSync(outDir, { recursive: true });
const jsonl = rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
writeFileSync(path.join(outDir, "openai-products.jsonl"), jsonl);
writeFileSync(path.join(outDir, "openai-products.jsonl.gz"), gzipSync(jsonl));

const groups = new Set(rows.map((r) => r.group_id ?? r.item_id));
const byCat = {};
for (const r of rows) byCat[r.product_category] = (byCat[r.product_category] ?? 0) + 1;
console.log(`✓ ${rows.length} рядків (${groups.size} товарів) → out/feeds/openai-products.jsonl(.gz)`);
console.log(`  в наявності: ${rows.filter((r) => r.availability === "in_stock").length}, акції: ${rows.filter((r) => r.sale_price).length}`);
for (const [c, n] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) console.log(`  ${n.toString().padStart(4)}  ${c}`);
console.log(`  пропущено: приховані ${skipped.hidden.length}, без ціни ${skipped.noPrice.length}, без фото ${skipped.noImage.length}`);
if (skipped.noPrice.length) console.log(`    без ціни: ${skipped.noPrice.join(", ")}`);
if (skipped.noImage.length) console.log(`    без фото: ${skipped.noImage.join(", ")}`);
