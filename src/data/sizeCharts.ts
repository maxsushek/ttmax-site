// src/data/sizeCharts.ts
// Розмірна сітка Butterfly: сторінка /{locale}/rozmirna-sitka і блок на картках одягу та взуття.
//
// ⚠️ НАВІЩО (19.11.2026). Хаби футболок і жіночого одягу та FAQ взуття радили «звіритися з
// таблицею розмірів на картці», але таблиці розмірів на сайті не було ніде — лише вибір
// розміру. А з ChatGPT люди приходять саме на футболки, шорти й жіночий одяг (PostHog, 16.11),
// і питання «який розмір узяти» ШІ ставлять постійно.
//
// ⚠️ ДЖЕРЕЛА. За цими числами людина обирає розмір і платить за доставку, тож тут лише офіційні
// таблиці Butterfly, звірені з першоджерелом (scripts/size-charts/data.json → gen-size-charts.mjs →
// sizeChartsData.ts). Значення — як у джерелі: без округлень, без «типових для спортивного одягу»
// чисел і без власних перерахунків між шкалами (EU ↔ US ↔ см у різних брендів різні).
//
// ⚠️ ЄВРОПЕЙСЬКА Й ЯПОНСЬКА КОЛЕКЦІЇ МАЮТЬ РІЗНІ СІТКИ (і навіть різні букви розмірів: у японській
// після L ідуть O та XO). Тому таблиці привʼязані до моделей ЯВНО — списком у models[slug].charts.
// Нова модель у каталозі таблиці не отримує, доки її не додано в data.json: посилання на загальну
// сторінку краще, ніж чужа сітка на картці.
import type { Locale } from "@/i18n/config";
import type { CatalogProduct } from "@/types/catalog";
import { SIZE_CHARTS_DATA } from "@/data/sizeChartsData";

type L = Record<Locale, string>;

export type SizeChartSource = {
  label: L;
  /** Офіційна адреса документа чи сторінки. */
  url: string;
  /** true — сайт Butterfly (Tamasu); false — офіційний дилер. */
  official: boolean;
  /**
   * Якщо звіряли за архівною копією (магазин Butterfly Europe закритий від автоматичних
   * запитів) — дата копії YYYY-MM-DD і її адреса у web.archive.org.
   */
  snapshot: string | null;
  archiveUrl: string | null;
};

export type SizeChart = {
  /** Якір на сторінці: /rozmirna-sitka#<id>. */
  id: string;
  title: L;
  /** Що саме в таблиці: мірки тіла, мірки виробу чи відповідність шкал — одним-двома реченнями. */
  lead: L;
  columns: { key: string; label: L }[];
  /** Значення клітинок — рядком, як у джерелі (діапазони, дроби, дужки). */
  rows: Record<string, string>[];
  note: L | null;
  sources: SizeChartSource[];
  /**
   * Типи товарів (GearSpec.gearType), яких стосується таблиця. Лише для посилань на сторінку
   * з лістингів і з карток без власної таблиці — на картку таблиця потрапляє тільки через
   * models[slug].charts.
   */
  gearTypes: string[];
};

/** Що показати на картці конкретної моделі. */
export type SizeModelInfo = {
  /** id таблиць саме для цієї моделі, у порядку показу. */
  charts: string[];
  /** Примітка про модель з офіційного опису Butterfly: колодка, повнота, крій. */
  note: L | null;
};

export type SizeChartsData = {
  /** Дата звірки з джерелами (видимо на сторінці, lastmod у sitemap). */
  checked: string;
  page: {
    metaTitle: L;
    metaDescription: L;
    h1: L;
    intro: Record<Locale, string[]>;
    /** Як зняти мірки — кроки (HowTo). */
    howTo: { name: L; text: L }[];
    howToTitle: L;
    faq: { q: L; a: L }[];
  };
  /** Розділи сторінки по порядку: заголовок + id таблиць + посилання на розділи каталогу. */
  sections: { id: string; title: L; text: L | null; charts: string[]; links: { label: L; href: string }[] }[];
  charts: SizeChart[];
  models: Record<string, SizeModelInfo>;
};

export const SIZE_CHARTS: SizeChartsData = SIZE_CHARTS_DATA;

export const SIZE_CHART_PATH = "/rozmirna-sitka";

export function hasSizeCharts(): boolean {
  return SIZE_CHARTS.charts.length > 0;
}

export function getSizeChart(id: string): SizeChart | null {
  return SIZE_CHARTS.charts.find((c) => c.id === id) ?? null;
}

export function sizeModelInfo(slug: string): SizeModelInfo | null {
  return SIZE_CHARTS.models[slug] ?? null;
}

/** Таблиці для картки товару — лише ті, що явно призначені моделі (див. ⚠️ вище). */
export function sizeChartsForProduct(product: CatalogProduct): SizeChart[] {
  const info = sizeModelInfo(product.slug);
  if (!info) return [];
  return info.charts.map(getSizeChart).filter((c): c is SizeChart => c !== null);
}

/** Чи є таблиця на сторінці /rozmirna-sitka (а не лише на картці моделі) — для якоря в посиланні. */
export function isPageChart(id: string): boolean {
  return SIZE_CHARTS.sections.some((s) => s.charts.includes(id));
}

/** Чи є для цього типу товару (футболка, кросівки…) хоч одна таблиця. */
export function isSizedGearType(gearType: string): boolean {
  return SIZE_CHARTS.charts.some((c) => c.gearTypes.includes(gearType));
}

/**
 * Що показує блок «Розмірна сітка» на картці (components/catalog/SizeHelp.tsx):
 * "table" — таблиця саме цієї моделі (або примітка до неї), "link" — лише посилання на
 * сторінку сітки, null — блоку немає (напульсник, кепка). Одне правило на SizeHelp і на
 * посилання біля вибору розміру в панелі покупки: посилання не може вести до блоку, якого немає.
 */
export function sizeHelpKind(product: CatalogProduct): "table" | "link" | null {
  const gear = product.gear;
  if (!gear) return null;
  const note = sizeModelInfo(product.slug)?.note ?? null;
  if (!isSizedGearType(gear.gearType) && !note) return null;
  return sizeChartsForProduct(product).length === 0 && !note ? "link" : "table";
}

