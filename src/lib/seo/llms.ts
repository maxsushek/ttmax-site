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
import { GLOSSARY, GLOSSARY_CATEGORIES, glossaryByCategory, glossaryTermPath } from "@/data/glossary";
import { allProfiles } from "@/data/playerProfiles";
import {
  PRO_SETUPS,
  PRO_STATS_PATH,
  bladeRanking,
  proSetupUrl,
  rubberRanking,
  setupRanking,
  setupsWithBlade,
  setupsWithRubber,
  type Count,
  type SetupItem,
} from "@/data/proSetups";
import {
  SIZE_CHARTS,
  SIZE_CHART_PATH,
  getSizeChart,
  hasSizeCharts,
  isPageChart,
  sizeChartsForProduct,
  type SizeChart,
} from "@/data/sizeCharts";
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
    out.push(
      "",
      "## Гравці: на чому грають",
      "",
      `- [Статистика інвентаря профі Butterfly](${url(`/ua${PRO_STATS_PATH}`)}) — ${proStatsNote()}. Повний текст — ${url("/llms/inventar.txt")}`,
      `- [Усі гравці](${url("/ua/igroki")})`,
    );
    for (const pr of profiles) {
      const eq = pr.equipment;
      const kit = [eq.blade.name, eq.fh?.name, eq.bh?.name].filter(Boolean).join(" + ");
      out.push(`- [${PLAYERS[pr.slug].name[UA]}](${url(`/ua/igroki/${pr.slug}`)}) — ${kit} (Butterfly, станом на ${eq.asOf})`);
    }
  }

  // Словник: короткі визначення термінів — найчастіше цитований формат («що таке X»).
  if (GLOSSARY.length > 0) {
    out.push(
      "",
      "## Словник настільного тенісу",
      "",
      `- [Словник: ${plural(GLOSSARY.length, "термін", "терміни", "термінів")}](${url("/ua/slovnyk")}) — правила ITTF, удари, обертання, накладки й основи; у кожного терміна свій якір (#slug). Повний текст — ${url("/llms/slovnyk.txt")}`,
    );
  }

  // Розмірна сітка: офіційні таблиці Butterfly — відповідь на «який розмір узяти».
  if (hasSizeCharts()) {
    out.push(
      "",
      "## Розмірна сітка Butterfly",
      "",
      `- [${SIZE_CHARTS.page.h1[UA]}](${url(`/ua${SIZE_CHART_PATH}`)}) — ${sizeChartsNote()}; звірено з джерелами Butterfly ${SIZE_CHARTS.checked}. Повний текст таблиць — ${url("/llms/rozmiry.txt")}`,
    );
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
    const pro = proLine(p.slug, p.kind ?? "rubber");
    if (pro) out.push(pro);
    const specs = specLine(p);
    if (specs) out.push(`- Характеристики: ${specs}`);
    // Одяг і взуття: якір таблиці розмірів саме для цієї моделі (тип + стать + лінійка).
    const sizeChart = sizeChartsForProduct(p).find((c) => isPageChart(c.id));
    if (sizeChart) out.push(`- Розмірна сітка: ${sizeChart.title[UA]} — ${url(`/ua${SIZE_CHART_PATH}#${sizeChart.id}`)}`);
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
      // Таблиці-довідники з каталогу (specTable) — саме їх асистенти цитують, тож даємо
      // повністю, markdown-таблицею. Звичайні редакційні таблиці статей тут не дублюємо.
      for (const s of post.sections) {
        if (!s.specTable || !s.table) continue;
        out.push("", `#### ${s.h[UA]}`);
        out.push(`| ${s.table.columns.map((c) => c[UA]).join(" | ")} |`);
        out.push(`|${s.table.columns.map(() => "---").join("|")}|`);
        for (const row of s.table.rows) {
          out.push(`| ${row.map((c) => (c.href ? `[${c[UA]}](${url(`/ua${c.href}`)})` : c[UA])).join(" | ")} |`);
        }
      }
    }
    for (const f of post.faq ?? []) out.push(`- Питання: ${f.q[UA]} — ${f.a[UA]}`);
    out.push("");
  }
  return out;
}

/** Словник: термін — визначення — посилання на якір і докладну сторінку. */
function glossaryLines(): string[] {
  const out: string[] = [];
  for (const c of GLOSSARY_CATEGORIES) {
    const items = glossaryByCategory(c.key, "ua");
    if (items.length === 0) continue;
    out.push(`### ${c.title[UA]}`);
    for (const g of items) {
      const aka = g.aka.ua.length ? ` (також: ${g.aka.ua.join(", ")})` : "";
      const more = g.href ? ` Докладно: ${url(`/ua${g.href}`)}` : "";
      out.push(`- **${g.term.ua}**${aka} — ${g.def.ua} [${url(`/ua${glossaryTermPath(g)}`)}]${more}`);
    }
    out.push("");
  }
  return out;
}

/**
 * «16 таблиць: одяг…» — підпис частини й рядка в llms.txt.
 * ⚠️ Перелік складено руками (назви розділів містять двокрапки й бренд — у рядок через кому вони
 * не лягають). Зʼявиться новий розділ у scripts/size-charts/data.json — дописати сюди.
 */
function sizeChartsNote(): string {
  const onPage = SIZE_CHARTS.sections.reduce((n, sec) => n + sec.charts.length, 0);
  return `${plural(onPage, "таблиця", "таблиці", "таблиць")} за офіційними даними Butterfly: одяг європейської та японської колекцій, кросівки Lezoline, шкарпетки`;
}

/**
 * Розмірна сітка: ті самі таблиці, що на сторінці /rozmirna-sitka, у Markdown.
 * Числа — з офіційних джерел Butterfly (див. data/sizeCharts.ts), тут нічого не перераховуємо.
 */
function sizeChartLines(): string[] {
  const page = url(`/ua${SIZE_CHART_PATH}`);
  const out: string[] = [`Сторінка: ${page} (рос. ${url(`/ru${SIZE_CHART_PATH}`)}). Звірено з джерелами: ${SIZE_CHARTS.checked}.`, ""];
  for (const para of SIZE_CHARTS.page.intro[UA]) out.push(para);
  out.push("");
  const table = (c: SizeChart, heading: string) => {
    out.push(heading, c.lead[UA], "");
    out.push(`| ${c.columns.map((col) => col.label[UA]).join(" | ")} |`);
    out.push(`| ${c.columns.map(() => "---").join(" | ")} |`);
    for (const r of c.rows) out.push(`| ${c.columns.map((col) => r[col.key] ?? "").join(" | ")} |`);
    if (c.note) out.push("", `Примітка: ${c.note[UA]}`);
    out.push("", `Джерело: ${c.sources.map((src) => `${src.label[UA]} — ${src.url}`).join("; ")}`, "");
  };
  for (const s of SIZE_CHARTS.sections) {
    out.push(`### ${s.title[UA]} — ${page}#${s.id}`);
    if (s.text) out.push(s.text[UA]);
    out.push("");
    for (const id of s.charts) {
      const c = getSizeChart(id);
      if (!c) continue;
      table(c, `#### ${c.title[UA]} — ${page}#${c.id}`);
    }
  }
  // Заміри окремих моделей (японська колекція): на сайті вони показані на картці моделі.
  const perModel = SIZE_CHARTS.charts.filter((c) => !isPageChart(c.id));
  if (perModel.length > 0) {
    out.push("### Заміри окремих моделей японської колекції", "На сайті ці таблиці показано на картці відповідної моделі.", "");
    for (const c of perModel) table(c, `#### ${c.title[UA]}`);
  }
  if (SIZE_CHARTS.page.howTo.length > 0) {
    out.push(`### ${SIZE_CHARTS.page.howToTitle[UA]}`);
    SIZE_CHARTS.page.howTo.forEach((st, i) => out.push(`${i + 1}. ${st.name[UA]}: ${st.text[UA]}`));
    out.push("");
  }
  if (SIZE_CHARTS.page.faq.length > 0) {
    out.push("### Питання й відповіді");
    for (const f of SIZE_CHARTS.page.faq) out.push(`- Питання: ${f.q[UA]} — ${f.a[UA]}`);
    out.push("");
  }
  return out;
}

/** Назва позиції інвентарю профі для текстових файлів. */
function proItem(i: SetupItem | null): string {
  if (!i) return "—";
  if (i.custom) return `${i.custom.label.ua}${i.custom.spec ? ` (${i.custom.spec.ua})` : ""}`;
  const p = i.product ? getAllProducts().find((x) => x.slug === i.product) : undefined;
  return p?.model ?? i.name ?? "—";
}

const proTop = (xs: Count[], k = 3) => xs.slice(0, k).map((c) => `${c.key === "custom" ? "основи на замовлення" : proItem(c.item)} (${c.n})`).join(", ");

function proStatsNote(): string {
  return `${plural(PRO_SETUPS.setups.length, "гравець", "гравці", "гравців")} Butterfly: основи, накладки на форхенді й бекхенді, дата й джерело кожного рядка`;
}

/** Рядок для товару в llms: що стоїть у гравців Butterfly (основа — накладки, накладка — основи). */
function proLine(slug: string, kind: string): string | null {
  const d = PRO_SETUPS.checked;
  if (kind === "base") {
    const list = setupsWithBlade(slug);
    if (list.length === 0) return null;
    const r = rubberRanking(list);
    return `- Гравці Butterfly на цій основі: ${list.length} (форхенд: ${proTop(r.fh)}; бекхенд: ${proTop(r.bh)}) — офіційні сторінки гравців Butterfly Japan, перевірено ${d}; список: ${url(`/ua${PRO_STATS_PATH}`)}`;
  }
  if (kind === "rubber") {
    const uses = setupsWithRubber(slug);
    if (uses.length === 0) return null;
    const fh = uses.filter((u) => u.side === "fh" || u.side === "both").length;
    const bh = uses.filter((u) => u.side === "bh" || u.side === "both").length;
    return `- У гравців Butterfly: ${uses.length} (на форхенді ${fh}, на бекхенді ${bh}); найчастіше з основами ${proTop(bladeRanking(uses.map((u) => u.setup)))} — офіційні сторінки гравців Butterfly Japan, перевірено ${d}`;
  }
  return null;
}

/** Статистика інвентаря профі: підсумок, рейтинги, повний список із джерелом кожного рядка. */
function proSetupLines(): string[] {
  const all = PRO_SETUPS.setups;
  const r = rubberRanking(all);
  const blades = bladeRanking(all);
  const two = all.filter((s) => s.fh && s.bh).length;
  const out: string[] = [
    `Сторінка: ${url(`/ua${PRO_STATS_PATH}`)} (рос. ${url(`/ru${PRO_STATS_PATH}`)}). Джерело: ${PRO_SETUPS.source} — офіційні сторінки гравців Butterfly Japan, перевірено ${PRO_SETUPS.checked}.`,
    `Сторони накладок Butterfly не підписує: форхенд і бекхенд — за сталим порядком «основа → форхенд → бекхенд»; якщо накладка Butterfly одна, сторону не вказано.`,
    "",
    `Підсумок: ${all.length} гравців. Форхенд (з ${two}, у кого вказано обидві накладки): ${proTop(r.fh, 5)}. Бекхенд: ${proTop(r.bh, 5)}. Основи: ${proTop(blades, 6)}.`,
    "",
    "### Найчастіші збірки (основа з продажу + форхенд + бекхенд)",
  ];
  for (const x of setupRanking(all).filter((x) => x.n >= 2)) {
    out.push(`- ${proItem(x.blade)} + ${proItem(x.fh)} / ${proItem(x.bh)} — ${x.n}: ${x.who.map((w) => w.name).join(", ")}`);
  }
  out.push("", "### Інвентар гравців", "", "| Гравець | Країна | Основа | Форхенд | Бекхенд | Станом на | Джерело |", "| --- | --- | --- | --- | --- | --- | --- |");
  for (const s of [...all].sort((a, b) => a.name.localeCompare(b.name))) {
    const fh = s.single ? `${proItem(s.single)} (сторону не вказано)` : proItem(s.fh);
    const bh = s.single ? "—" : proItem(s.bh);
    out.push(`| ${s.name} | ${s.country ?? "—"} | ${proItem(s.blade)} | ${fh} | ${bh} | ${s.asOf} | ${proSetupUrl(s)} |`);
  }
  out.push("");
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
  if (PRO_SETUPS.setups.length > 0) parts.push({ slug: "inventar", title: "Статистика інвентаря профі Butterfly", note: proStatsNote() });
  if (GLOSSARY.length > 0) parts.push({ slug: "slovnyk", title: "Словник настільного тенісу", note: `${plural(GLOSSARY.length, "термін", "терміни", "термінів")} із визначеннями` });
  if (hasSizeCharts()) parts.push({ slug: "rozmiry", title: "Розмірна сітка Butterfly", note: sizeChartsNote() });
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
  else if (slug === "slovnyk") body = glossaryLines();
  else if (slug === "rozmiry") body = sizeChartLines();
  else if (slug === "inventar") body = proSetupLines();
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
  if (GLOSSARY.length > 0) out.push("## Словник настільного тенісу", "", ...glossaryLines());
  if (hasSizeCharts()) out.push("## Розмірна сітка Butterfly", "", ...sizeChartLines());
  if (PRO_SETUPS.setups.length > 0) out.push("## Статистика інвентаря профі Butterfly", "", ...proSetupLines());

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
    `/ua${PRO_STATS_PATH}`,
    "/ua/slovnyk",
    ...(hasSizeCharts() ? [`/ua${SIZE_CHART_PATH}`] : []),
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
