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
import { DELIVERY_DAYS, daysLabel } from "@/config/delivery";
import { siteConfig, socialProfiles } from "@/config/site";
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
import { allProfiles } from "@/data/playerProfiles";
import { PLAYERS } from "@/data/players";
import { productIndexable } from "@/lib/catalog/indexability";
import { inGroup, isFiberGroup, surfaceGroups } from "@/lib/catalog/routing";
import { getRichContent } from "@/data/catalog/categoryContent";
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

/**
 * Товари, які реально можна купити: усе не сховане (є фото, не знято з продажу).
 *
 * ⚠️ НЕ фільтруємо по productIndexable. Мʼячі, чохли, одяг, взуття й аксесуари мають
 * noindex на рівні КАРТКИ (у них немає власного тексту), але продаються і стоять у
 * лістингу. Якщо їх прибрати, асистент відповість «у TTMAX немає мʼячів» — а вони є.
 * Для таких товарів нижче даємо посилання на сторінку РОЗДІЛУ, а не на noindex-картку.
 */
function sellable(media: EntityMediaMap, overrides: OverridesMap): CatalogProduct[] {
  return getAllProducts()
    .filter((p) => !isHidden(p, media))
    .map((p) => applyOverrides(p, overrides));
}

/**
 * Куди вести асистента для товару без власної сторінки в індексі: у підкатегорію-хаб,
 * якщо товар у неї входить (клей → /aksessuary/klei), інакше в категорію.
 */
function sectionPath(p: CatalogProduct): string {
  const hub = surfaceGroups.find((g) => !isFiberGroup(g) && inGroup(p, g));
  return hub ? `/${hub.category}/${hub.slug}` : `/${p.categorySlug}`;
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
  if (p.gear?.volumeMl) bits.push(`обʼєм ${p.gear.volumeMl} мл`);
  if (p.gear?.packSize) bits.push(`в упаковці ${p.gear.packSize}`);
  if (p.gear?.stars && p.gear.stars !== "трен.") bits.push(`клас ${p.gear.stars}`);
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
    `- Графік: ${siteConfig.hours.display[UA]}, без вихідних`,
    `- Працює з ${siteConfig.foundingYear} року`,
    // Офіційні профілі — щоб асистент міг звʼязати акаунти з магазином і не прийняв
    // сторонній акаунт із схожою назвою за наш. Ті самі адреси, що в sameAs розмітки.
    ...socialProfiles(contact.social).map((s) => `- ${s.name}: ${s.href}`),
    `- Мови сайту: українська (${url("/ua")}), російська (${url("/ru")})`,
    `- Валюта: UAH. Ціни оновлено: ${PRICE_LIST_EFFECTIVE_DATE}`,
    `- Доставка: Нова Пошта ${contact.shippingFee} грн (${daysLabel(DELIVERY_DAYS.np, UA)}),` +
      ` Укрпошта ${contact.ukrposhtaFee} грн (${daysLabel(DELIVERY_DAYS.ukrposhta, UA)});` +
      ` безкоштовно від ${contact.freeShippingThreshold} грн; відправка протягом` +
      ` ${daysLabel(DELIVERY_DAYS.handling, UA, true)} (пн–пт)`,
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

  // Підкатегорії-хаби й колекції основ — окремі сторінки з текстом і FAQ. Асистенту на запит
  // «клей для накладок» чи «довгі шипи» краще вести сюди, ніж на всю категорію.
  out.push("", "## Підкатегорії", "");
  for (const g of surfaceGroups) {
    const inG = products.filter((p) => inGroup(p, g));
    if (inG.length === 0) continue;
    const prices = inG.map(getMinPrice).filter((n): n is number => typeof n === "number");
    const from = prices.length ? `від ${Math.min(...prices)} грн` : "";
    const count = plural(inG.length, "позиція", "позиції", "позицій");
    // Перша теза «Коротко» — щоб асистент одразу знав, про що сторінка й кому вона.
    const gist = getRichContent(g.slug)?.summary?.[0]?.[UA];
    out.push(`- [${g.h1[UA]}](${url(`/ua/${g.category}/${g.slug}`)}) — ${count} ${from}${gist ? `. ${gist}` : ""}`.trim());
  }

  out.push("", "## Довідник і поради", "");
  for (const post of getAllPosts()) {
    out.push(`- [${post.h1[UA]}](${url(`/ua/blog/${post.slug}`)}) — ${post.excerpt[UA]}`);
  }

  // Гравці: інвентар з офіційних сторінок Butterfly з датою «станом на».
  const profiles = allProfiles();
  if (profiles.length > 0) {
    out.push("", "## Гравці: на чому грають", "", `- [Усі гравці](${url("/ua/igroki")})`);
    for (const pr of profiles) {
      const eq = pr.equipment;
      const kit = [eq.blade.name, eq.fh?.name, eq.bh?.name].filter(Boolean).join(" + ");
      out.push(`- [${PLAYERS[pr.slug].name[UA]}](${url(`/ua/igroki/${pr.slug}`)}) — ${kit} (Butterfly, станом на ${eq.asOf})`);
    }
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
    "Окремими файлами — беріть той, що під запит (повний файл великий):",
    "",
    ...llmsParts({ media, overrides }).map((p) => `- [${p.title}](${url(`/llms/${p.slug}.txt`)}) — ${p.note}`),
    "",
    `- [llms-full.txt](${url("/llms-full.txt")}) — усе разом (~0,9 МБ)`,
    `- [sitemap.xml](${url("/sitemap.xml")})`,
    "",
  );
  return out.join("\n");
}

type LlmsOpts = { media: EntityMediaMap; overrides: OverridesMap; contact: ContactInfo };

/** Товари однієї категорії: ціна, наявність, сторінка, характеристики, «Коротко», FAQ. */
function productLines(inCat: CatalogProduct[]): string[] {
  const out: string[] = [];
  for (const p of inCat) {
    const path = `/${p.brandSlug}/${p.categorySlug}/${p.slug}`;
    out.push(
      `### ${p.name[UA]}`,
      `- Ціна: ${money(getMinPrice(p))}${isInStock(p) ? ", в наявності" : ", під замовлення"}`,
      // У товарів без власної сторінки в індексі (екіпірування) посилаємось на розділ:
      // вести асистента на noindex-картку означало б радити сторінку, яку ми самі
      // закрили від пошуку.
      productIndexable(p)
        ? `- Сторінка: ${url(`/ua${path}`)} (рос. ${url(`/ru${path}`)})`
        : `- Розділ: ${url(`/ua${sectionPath(p)}`)} (картка без окремої сторінки)`,
    );
    const specs = specLine(p);
    if (specs) out.push(`- Характеристики: ${specs}`);
    const e = getExpert(p.slug);
    if (e) {
      out.push(`- Коротко: ${e.verdict[UA]}`);
      if (e.official[UA]) out.push(`- Дані виробника: ${e.official[UA]}`);
      for (const f of e.faq.slice(0, 4)) out.push(`- Питання: ${f.q[UA]} — ${f.a[UA]}`);
    } else if (p.seoBlocks?.length) {
      // Екіпірування з власним текстом (gearCopy.ts) — ті самі факти, що на картці.
      out.push(`- Коротко: ${p.seoBlocks[0]?.p[UA].join(" ")}`);
      for (const f of (p.faq ?? []).slice(0, 3)) out.push(`- Питання: ${f.q[UA]} — ${f.a[UA]}`);
    }
    out.push("");
  }
  return out;
}

/** Гайди підкатегорій: «Коротко» і FAQ — ті самі тексти, що на сторінках хабів. */
function guideLines(products: CatalogProduct[]): string[] {
  const out: string[] = [];
  for (const g of surfaceGroups) {
    const rich = getRichContent(g.slug);
    if (!rich || !products.some((p) => inGroup(p, g))) continue;
    out.push(`### ${g.h1[UA]} — ${url(`/ua/${g.category}/${g.slug}`)}`);
    for (const s of rich.summary ?? []) out.push(`- ${s[UA]}`);
    for (const f of rich.faq.slice(0, 5)) out.push(`- Питання: ${f.q[UA]} — ${f.a[UA]}`);
    if (rich.updated) out.push(`- Оновлено: ${rich.updated}`);
    out.push("");
  }
  return out;
}

/** Статті: FAQ (у повному файлі) або ще й «Коротко» + дата (в окремому файлі довідника). */
function postLines(withSummary: boolean): string[] {
  const out: string[] = [];
  for (const post of getAllPosts()) {
    if (!withSummary && (!post.faq || post.faq.length === 0)) continue;
    out.push(`### ${post.h1[UA]} — ${url(`/ua/blog/${post.slug}`)}`);
    if (withSummary) {
      out.push(`- Оновлено: ${post.dateModified}`);
      // Перший розділ статті — answer-first «Коротко»: прямий ответ на запит статті.
      const first = post.sections[0];
      if (first) for (const para of first.p[UA]) out.push(`- ${para}`);
    }
    for (const f of post.faq ?? []) out.push(`- Питання: ${f.q[UA]} — ${f.a[UA]}`);
    out.push("");
  }
  return out;
}

/** Гравці: інвентар (Butterfly, з датою), головні титули, коротко. */
function playerLines(): string[] {
  const out: string[] = [];
  for (const pr of allProfiles()) {
    const eq = pr.equipment;
    out.push(`### ${PLAYERS[pr.slug].name[UA]} (${PLAYERS[pr.slug].nameEn}) — ${url(`/ua/igroki/${pr.slug}`)}`);
    out.push(`- ${pr.summary[UA]}`);
    const rubbers = eq.bh
      ? `форхенд ${eq.fh?.name ?? "—"}, бекхенд ${eq.bh.name}`
      : `накладка ${eq.fh?.name ?? "—"} (сторону Butterfly не вказує)`;
    out.push(`- Інвентар (Butterfly, станом на ${eq.asOf}): основа ${eq.blade.name}; ${rubbers}. Джерело: ${eq.source}`);
    for (const a of pr.achievements.slice(0, 6)) out.push(`- ${a.year}: ${a.event[UA]} — ${a.result[UA]}`);
    out.push("");
  }
  return out;
}

export type LlmsPart = { slug: string; title: string; note: string };

/**
 * Частини llms-full.txt окремими файлами /llms/<slug>.txt.
 *
 * ⚠️ НАВІЩО (03.11.2026): llms-full.txt виріс до ~885 КБ (~250 тис. токенів). ШІ-інструменти
 * обрізають такий файл на початку — до гайдів і статей (вони в кінці) асистент не доходив.
 * Тепер llms.txt веде на частину під запит: «основи» — 270 КБ замість 885. Повний файл
 * лишається для тих, хто шукає саме його.
 */
export function llmsParts(opts: Pick<LlmsOpts, "media" | "overrides">): LlmsPart[] {
  const products = sellable(opts.media, opts.overrides);
  const parts: LlmsPart[] = [];
  for (const c of getIndexableCategories()) {
    const n = products.filter((p) => p.categorySlug === c.slug).length;
    if (n > 0) parts.push({ slug: c.slug, title: c.name[UA], note: `${plural(n, "позиція", "позиції", "позицій")}: ціни, наявність, характеристики, FAQ` });
  }
  parts.push({ slug: "gaidy", title: "Як обрати: гайди підкатегорій", note: "«Коротко» й FAQ хабів (основи ALC/ZLC, шипи, клей тощо)" });
  parts.push({ slug: "dovidnyk", title: "Довідник: статті блогу", note: "«Коротко» й FAQ кожної статті" });
  if (allProfiles().length > 0) parts.push({ slug: "gravtsi", title: "Гравці: на чому грають", note: "інвентар за даними Butterfly з датою, титули" });
  return parts;
}

/** Одна частина: короткий заголовок + дані. Компанію не дублюємо — вона в llms.txt. */
export function buildLlmsPart(slug: string, opts: LlmsOpts): string | null {
  const part = llmsParts(opts).find((p) => p.slug === slug);
  if (!part) return null;
  const products = sellable(opts.media, opts.overrides);
  const head = [
    `# ${siteConfig.name} — ${part.title}`,
    "",
    `> ${part.note}. Частина повних даних магазину; карта всіх частин — ${url("/llms.txt")}.`,
    `> Мова — українська; ціни в UAH, оновлено: ${PRICE_LIST_EFFECTIVE_DATE}.`,
    "",
  ];
  let body: string[];
  if (slug === "gaidy") body = guideLines(products);
  else if (slug === "dovidnyk") body = postLines(true);
  else if (slug === "gravtsi") body = playerLines();
  else body = productLines(products.filter((p) => p.categorySlug === slug));
  return [...head, ...body].join("\n");
}

/**
 * llms-full.txt — готові відповіді: ціни, наявність, характеристики, FAQ (усе в одному файлі).
 *
 * ⚠️ Повні тексти статей сюди НЕ включаємо свідомо: фактуру несуть FAQ і характеристики,
 * а статті роздули б файл у рази без нової інформації (у sparkservice цей файл вийшов
 * ~800 КБ саме через тексти). Стаття лишається посиланням.
 */
export function buildLlmsFull(opts: LlmsOpts): string {
  const { media, overrides, contact } = opts;
  const products = sellable(media, overrides);
  const out = company(contact);

  out.push(
    "Формат: розділ на категорію, у кожному — товар, ціна, наявність, характеристики,",
    "далі FAQ і статті-довідники. Дані згенеровано з того ж джерела, що й сторінки сайту.",
    `Те саме окремими файлами (менші, зручніші): див. розділ «Повні дані» в ${url("/llms.txt")}.`,
    "",
  );

  for (const c of getIndexableCategories()) {
    const inCat = products.filter((p) => p.categorySlug === c.slug);
    if (inCat.length === 0) continue;
    out.push(`## ${c.name[UA]} (${inCat.length})`, "", ...productLines(inCat));
  }

  out.push("## Як обрати: гайди підкатегорій", "", ...guideLines(products));
  out.push("## Питання й відповіді з довідника", "", ...postLines(false));
  if (allProfiles().length > 0) out.push("## Гравці: на чому грають", "", ...playerLines());

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
    "/ua/igroki",
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
    `Founded: ${siteConfig.foundingYear}`,
    `Hours: ${siteConfig.hours.display[UA]}, без вихідних`,
    ...socialProfiles(contact.social).map((s) => `Profile: ${s.href}`),
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
