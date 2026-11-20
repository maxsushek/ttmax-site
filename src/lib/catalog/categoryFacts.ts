// src/lib/catalog/categoryFacts.ts
// «Головне» на початку кожної категорії й хаба: 3–5 фактів-відповідей одразу під H1.
//
// ⚠️ НАВІЩО (20.11.2026). Інтро категорій писались як вступ («оригінал, доставка по Україні»),
// а «Коротко» хабів стояло ВНИЗУ, під сіткою товарів. ШІ-асистенти й пошук беруть для відповіді
// перший змістовний текст сторінки — тож відповідь (скільки моделей, ціни, що беруть профі, умови)
// має бути першою. Тут вона ГЕНЕРУЄТЬСЯ з тих самих даних, що й сітка: каталог + ціни й наявність
// з адмінки (product_overrides), інвентар профі (data/proSetups.ts), умови доставки (config).
// Тому цифри не застаріють і не розійдуться з товарами нижче. Нічого «від себе» тут немає.
//
// Ті самі рядки (ua) йдуть у llms-файли категорій — див. lib/seo/llms.ts.
import type { Locale } from "@/i18n/config";
import type { CatalogProduct } from "@/types/catalog";
import { getMinPrice, isInStock } from "@/data/catalog";
import { inGroup, surfaceGroups } from "@/lib/catalog/routing";
import { DELIVERY_DAYS, daysLabel } from "@/config/delivery";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/utils/format";
import {
  PRO_STATS_PATH,
  PRO_SETUPS,
  bladeRanking,
  rubberRanking,
  setupRanking,
  setupsWithFamily,
  type Count,
  type SetupItem,
} from "@/data/proSetups";
import { getProductBySlug } from "@/data/catalog";
import { SIZE_CHART_PATH, hasSizeCharts } from "@/data/sizeCharts";

export type Fact = { text: string; link?: { href: string; label: string } };

type L = Record<Locale, string>;

function plural(n: number, forms: [string, string, string]): string {
  const m10 = n % 10;
  const m100 = n % 100;
  const i = m10 === 1 && m100 !== 11 ? 0 : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 1 : 2;
  return `${n} ${forms[i]}`;
}

const POS: Record<Locale, [string, string, string]> = {
  ua: ["позиція", "позиції", "позицій"],
  ru: ["позиция", "позиции", "позиций"],
};

const STYLE: Record<string, L> = {
  tenzor: { ua: "тензорні", ru: "тензорные" },
  gibrid: { ua: "гібридні", ru: "гибридные" },
  lipka: { ua: "липкі", ru: "липкие" },
  klasyka: { ua: "класичні", ru: "классические" },
  "korotki-shypy": { ua: "короткі шипи", ru: "короткие шипы" },
  "dovgi-shypy": { ua: "довгі шипи", ru: "длинные шипы" },
  antyspin: { ua: "антиспін", ru: "антиспин" },
};

const WEAR_HUBS = new Set(["futbolky", "kostyumy", "shorty", "kurtky", "shkarpetky", "zhinochyi"]);

function itemName(i: SetupItem): string {
  const p = i.product ? getProductBySlug(i.product) : undefined;
  return p?.model ?? i.name ?? "—";
}

const tops = (xs: Count[], k: number, locale: Locale) =>
  xs
    .filter((c) => c.key !== "custom")
    .slice(0, k)
    .map((c) => `${itemName(c.item)} (${c.n})`)
    .join(", ") || (locale === "ua" ? "—" : "—");

/** Перелік «назва — кількість» без нулів, за спаданням. */
function breakdown(rows: { label: string; n: number }[]): string {
  return rows
    .filter((r) => r.n > 0)
    .sort((a, b) => b.n - a.n)
    .map((r) => `${r.label} — ${r.n}`)
    .join(", ");
}

/**
 * Факти для сторінки розділу.
 * @param slug     slug категорії (nakladki, odyag…) або хаба (alc, futbolky…)
 * @param products товари, які бачить відвідувач у сітці (уже з цінами й наявністю з адмінки)
 */
export function categoryFacts(opts: {
  slug: string;
  kind: "category" | "surfaceGroup";
  products: CatalogProduct[];
  locale: Locale;
  /** Ціна позиції, якщо вона не в самому товарі (готова ракетка = сума компонентів зі знижкою). */
  priceOf?: (p: CatalogProduct) => number | undefined;
  /** Поріг безкоштовної доставки з налаштувань сайту (адмінка); за замовчуванням — siteConfig. */
  freeShippingFrom?: number;
}): Fact[] {
  const { slug, kind, products, locale } = opts;
  const priceOf = opts.priceOf ?? getMinPrice;
  const ua = locale === "ua";
  const out: Fact[] = [];
  if (products.length === 0) return out;

  // 1. Скільки, за скільки, що в наявності.
  const prices = products.map((p) => priceOf(p)).filter((x): x is number => typeof x === "number" && x > 0);
  const inStock = products.filter((p) => isInStock(p)).length;
  const n = products.length;
  const priceText =
    prices.length > 0
      ? Math.min(...prices) === Math.max(...prices)
        ? ua
          ? `ціна — ${formatPrice(prices[0]!)}`
          : `цена — ${formatPrice(prices[0]!)}`
        : ua
          ? `ціни від ${formatPrice(Math.min(...prices))} до ${formatPrice(Math.max(...prices))}`
          : `цены от ${formatPrice(Math.min(...prices))} до ${formatPrice(Math.max(...prices))}`
      : null;
  const stockText =
    inStock === n
      ? ua
        ? "усе в наявності"
        : "всё в наличии"
      : inStock === 0
        ? ua
          ? "усе — під замовлення"
          : "всё — под заказ"
        : ua
          ? `у наявності ${inStock}, решта — під замовлення`
          : `в наличии ${inStock}, остальное — под заказ`;
  out.push({ text: `${ua ? "У каталозі" : "В каталоге"} ${plural(n, POS[locale])}${priceText ? `, ${priceText}` : ""}; ${stockText}.` });

  // 2. Склад розділу — з даних товарів.
  if (kind === "category" && slug === "nakladki") {
    const by = new Map<string, number>();
    for (const p of products) if (p.playStyle) by.set(p.playStyle, (by.get(p.playStyle) ?? 0) + 1);
    const rows = [...by.entries()].map(([k, v]) => ({ label: STYLE[k]?.[locale] ?? k, n: v }));
    if (rows.length > 1) out.push({ text: `${ua ? "За типом" : "По типу"}: ${breakdown(rows)}.` });
  } else if (kind === "category" && slug === "osnovaniya") {
    const fam = { alc: 0, zlc: 0, wood: 0, other: 0 };
    for (const p of products) {
      const s = p.base?.surface;
      if (s === "alc" || s === "super-alc") fam.alc++;
      else if (s === "zlc" || s === "super-zlc") fam.zlc++;
      else if (s === "wood") fam.wood++;
      else fam.other++;
    }
    out.push({
      text: `${ua ? "За матеріалом" : "По материалу"}: ${breakdown([
        { label: ua ? "дерев'яні" : "деревянные", n: fam.wood },
        { label: "ALC / Super ALC", n: fam.alc },
        { label: "ZLC / Super ZLC", n: fam.zlc },
        { label: ua ? "інші волокна (CNF, ZLF, CAF, карбон)" : "другие волокна (CNF, ZLF, CAF, карбон)", n: fam.other },
      ])}.`,
    });
  } else if (kind === "category" && slug === "rakety") {
    const blades = new Map<string, number>();
    for (const p of products) if (p.combo) blades.set(p.combo.blade, (blades.get(p.combo.blade) ?? 0) + 1);
    if (blades.size > 0) {
      const names = [...blades.keys()].map((b) => getProductBySlug(b)?.model ?? b).join(", ");
      out.push({
        text: ua
          ? `Готові збірки «основа + 2 накладки» на ${plural(blades.size, ["основі", "основах", "основах"])}: ${names}.`
          : `Готовые сборки «основание + 2 накладки» на ${plural(blades.size, ["основании", "основаниях", "основаниях"])}: ${names}.`,
      });
    }
  } else if (kind === "category" && slug === "myachi") {
    const comp = products.filter((p) => p.gear?.stars === "3*").length;
    const train = products.filter((p) => p.gear?.stars && p.gear.stars !== "3*").length;
    if (comp + train > 0)
      out.push({
        text: ua
          ? `Змагальні 3* — ${comp}, тренувальні — ${train}.`
          : `Соревновательные 3* — ${comp}, тренировочные — ${train}.`,
      });
  } else if (kind === "category") {
    // Категорії з хабами (одяг, чохли, аксесуари): скільки в кожному підрозділі.
    const groups = surfaceGroups.filter((g) => g.category === slug);
    const rows = groups.map((g) => ({ label: g.name[locale].toLowerCase(), n: products.filter((p) => inGroup(p, g)).length }));
    if (rows.filter((r) => r.n > 0).length > 1) out.push({ text: `${ua ? "Розділи" : "Разделы"}: ${breakdown(rows)}.` });
  }

  // 3. Що реально стоїть у профі Butterfly (офіційні сторінки гравців).
  const statsLink = { href: PRO_STATS_PATH, label: ua ? "Статистика інвентаря профі" : "Статистика инвентаря профи" };
  const all = PRO_SETUPS.setups;
  if (all.length >= 10) {
    if (kind === "category" && slug === "nakladki") {
      const r = rubberRanking(all);
      const two = all.filter((s) => s.fh && s.bh).length;
      out.push({
        text: ua
          ? `У профі Butterfly на форхенді найчастіше ${itemName(r.fh[0]!.item)} (${r.fh[0]!.n} з ${two}), на бекхенді — ${itemName(r.bh[0]!.item)} (${r.bh[0]!.n}).`
          : `У профи Butterfly на форхенде чаще всего ${itemName(r.fh[0]!.item)} (${r.fh[0]!.n} из ${two}), на бэкхенде — ${itemName(r.bh[0]!.item)} (${r.bh[0]!.n}).`,
        link: statsLink,
      });
    } else if (kind === "category" && slug === "osnovaniya") {
      out.push({
        text: ua
          ? `Найпопулярніші основи у профі Butterfly: ${tops(bladeRanking(all), 3, locale)}.`
          : `Самые популярные основания у профи Butterfly: ${tops(bladeRanking(all), 3, locale)}.`,
        link: statsLink,
      });
    } else if (kind === "category" && slug === "rakety") {
      const best = setupRanking(all)[0];
      if (best)
        out.push({
          text: ua
            ? `Найчастіша збірка у профі Butterfly з основ у продажу: ${itemName(best.blade)} + ${itemName(best.fh)} на форхенді / ${itemName(best.bh)} на бекхенді (${best.n}).`
            : `Самая частая сборка у профи Butterfly из оснований в продаже: ${itemName(best.blade)} + ${itemName(best.fh)} на форхенде / ${itemName(best.bh)} на бэкхенде (${best.n}).`,
          link: statsLink,
        });
    } else if (kind === "surfaceGroup" && (slug === "alc" || slug === "zlc")) {
      const fam = setupsWithFamily(slug);
      if (fam.length >= 5) {
        const r = rubberRanking(fam);
        out.push({
          text: ua
            ? `У профі Butterfly на основах ${slug.toUpperCase()}: найчастіше ${tops(bladeRanking(fam), 3, locale)}; на форхенді — ${itemName(r.fh[0]!.item)}, на бекхенді — ${itemName(r.bh[0]!.item)}.`
            : `У профи Butterfly на основаниях ${slug.toUpperCase()}: чаще всего ${tops(bladeRanking(fam), 3, locale)}; на форхенде — ${itemName(r.fh[0]!.item)}, на бэкхенде — ${itemName(r.bh[0]!.item)}.`,
          link: statsLink,
        });
      }
    }
  }

  // 4. Розмір — для одягу й взуття.
  if (hasSizeCharts() && ((kind === "category" && (slug === "odyag" || slug === "obuv")) || (kind === "surfaceGroup" && WEAR_HUBS.has(slug)))) {
    out.push({
      text: ua
        ? "Розмір обирайте за офіційними таблицями Butterfly: заміри виробу, мірки тіла, розміри кросівок EU / JPN / US."
        : "Размер выбирайте по официальным таблицам Butterfly: замеры изделия, мерки тела, размеры кроссовок EU / JPN / US.",
      link: { href: SIZE_CHART_PATH, label: ua ? "Розмірна сітка Butterfly" : "Размерная сетка Butterfly" },
    });
  }

  // 5. Доставка й оплата — з тих самих налаштувань, що сторінка /delivery і розмітка Offer.
  const np = daysLabel(DELIVERY_DAYS.np, locale);
  const up = daysLabel(DELIVERY_DAYS.ukrposhta, locale);
  const free = formatPrice(opts.freeShippingFrom ?? siteConfig.freeShippingThreshold);
  out.push({
    text: ua
      ? `Доставка Новою Поштою за ${np} (Укрпоштою — ${up}), безкоштовно від ${free}; оплата при отриманні.`
      : `Доставка Новой Почтой за ${np} (Укрпочтой — ${up}), бесплатно от ${free}; оплата при получении.`,
    link: { href: "/delivery", label: ua ? "Доставка й оплата" : "Доставка и оплата" },
  });
  return out;
}
