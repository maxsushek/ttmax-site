// src/data/proSetups.ts
// Інвентар гравців Butterfly: основа + накладки кожного контрактного гравця з офіційних сторінок
// Butterfly Japan (butterfly.co.jp/players/detail/<page>.html, блок «使用用具» з датою «станом на»).
//
// ⚠️ НАВІЩО (20.11.2026). На питання «яку накладку ставити на Viscaria» / «на яку основу ставлять
// Dignics 09C» ні в нас, ні в конкурентів не було відповіді з фактами — лише думки. Тут факти:
// що реально стоїть у ≈100 гравців Butterfly, з датою й джерелом. З цих даних будуються блок на
// картках основ, накладок і готових ракеток, блоки на хабах і сторінка статистики інвентаря.
//
// ⚠️ ДАНІ НЕ ПРАВИТИ РУКАМИ: proSetupsData.ts генерує scripts/gen-pro-setups.mjs (з --fetch —
// заново з сайту Butterfly; бажано раз на місяць). Нічого не дописувати «від себе»: стиль гри —
// лише з поля 戦型 сторінки, сторони накладок — за сталим порядком основа → форхенд → бекхенд
// (Butterfly їх не підписує; так само в профілях гравців). Якщо накладка Butterfly одна — сторона
// невідома (`single`), друга накладка в гравця іншого бренду або не вказана.
import type { Locale } from "@/i18n/config";
import type { PlayerSlug } from "@/data/players";
import { getProductBySlug } from "@/data/catalog";
import { PRO_SETUPS_DATA } from "@/data/proSetupsData";

type L = Record<Locale, string>;

export type SetupItem = {
  /** slug товару в нашому каталозі; null — у каталозі немає (іменна чи замовна основа). */
  product: string | null;
  /** Назва латиницею (офіційна англійська назва Butterfly); null — для основ на замовлення. */
  name: string | null;
  /** Основа на замовлення (特注): підпис і склад із виноски Butterfly. */
  custom: { label: L; spec: L | null; surface: string | null } | null;
  note: L | null;
};

export type ProSetup = {
  /** Сторінка гравця на butterfly.co.jp (без .html). */
  page: string;
  /** Імʼя латиницею, як на сторінці Butterfly («HARIMOTO Tomokazu»). */
  name: string;
  /** Код країни ITTF/МОК, як на сторінці Butterfly. */
  country: string | null;
  women: boolean | null;
  japan: boolean | null;
  /** Профіль гравця на нашому сайті (/igroki/<slug>), якщо є. */
  profile: PlayerSlug | null;
  style: L | null;
  /** Дата «станом на» зі сторінки Butterfly. */
  asOf: string;
  blade: SetupItem;
  fh: SetupItem | null;
  bh: SetupItem | null;
  /** Єдина накладка Butterfly, сторона невідома. */
  single: SetupItem | null;
};

export type ProSetupsData = { checked: string; source: string; setups: ProSetup[] };

export const PRO_SETUPS: ProSetupsData = PRO_SETUPS_DATA;

export const PRO_STATS_PATH = "/igroki/inventar";

export function proSetupUrl(s: ProSetup): string {
  return `https://www.butterfly.co.jp/players/detail/${s.page}.html`;
}

export type RubberSide = "fh" | "bh" | "both" | "single";

/** Гравці, у яких ця основа (за slug каталогу). Свіжіші дані — першими, профілі на сайті — вище. */
export function setupsWithBlade(slug: string): ProSetup[] {
  return sortSetups(PRO_SETUPS.setups.filter((s) => s.blade.product === slug));
}

/** Гравці з цією накладкою і на якій стороні вона в них стоїть. */
export function setupsWithRubber(slug: string): { setup: ProSetup; side: RubberSide }[] {
  const out: { setup: ProSetup; side: RubberSide }[] = [];
  for (const s of sortSetups(PRO_SETUPS.setups)) {
    const fh = s.fh?.product === slug;
    const bh = s.bh?.product === slug;
    if (fh && bh) out.push({ setup: s, side: "both" });
    else if (fh) out.push({ setup: s, side: "fh" });
    else if (bh) out.push({ setup: s, side: "bh" });
    else if (s.single?.product === slug) out.push({ setup: s, side: "single" });
  }
  return out;
}

function sortSetups(list: ProSetup[]): ProSetup[] {
  return [...list].sort(
    (a, b) => Number(Boolean(b.profile)) - Number(Boolean(a.profile)) || b.asOf.localeCompare(a.asOf) || a.name.localeCompare(b.name),
  );
}

/** Ключ позиції для підрахунку: slug товару або назва (іменні основи поза каталогом). */
export function itemKey(i: SetupItem): string {
  return i.product ?? (i.custom ? "custom" : (i.name ?? "?"));
}

export type Count = { key: string; item: SetupItem; n: number };

function rank(items: SetupItem[]): Count[] {
  const m = new Map<string, Count>();
  for (const i of items) {
    const k = itemKey(i);
    const c = m.get(k);
    if (c) c.n++;
    else m.set(k, { key: k, item: i, n: 1 });
  }
  return [...m.values()].sort((a, b) => b.n - a.n || a.key.localeCompare(b.key));
}

/** Найчастіші накладки на форхенді й бекхенді в наборі гравців. */
export function rubberRanking(list: ProSetup[]): { fh: Count[]; bh: Count[]; any: Count[] } {
  const fh = list.flatMap((s) => (s.fh ? [s.fh] : []));
  const bh = list.flatMap((s) => (s.bh ? [s.bh] : []));
  // «Будь-де»: накладка рахується один раз на гравця, навіть якщо стоїть з обох боків.
  const any = list.flatMap((s) => {
    const own = [s.fh, s.bh, s.single].filter((x): x is SetupItem => Boolean(x));
    const seen = new Set<string>();
    return own.filter((x) => (seen.has(itemKey(x)) ? false : (seen.add(itemKey(x)), true)));
  });
  return { fh: rank(fh), bh: rank(bh), any: rank(any) };
}

/** Найчастіші основи в наборі гравців (основи на замовлення — однією позицією «custom»). */
export function bladeRanking(list: ProSetup[]): Count[] {
  return rank(list.map((s) => s.blade));
}

/** Повна збірка «основа + форхенд + бекхенд» — найчастіші однакові. */
export function setupRanking(list: ProSetup[]): { blade: SetupItem; fh: SetupItem; bh: SetupItem; n: number; who: ProSetup[] }[] {
  const m = new Map<string, { blade: SetupItem; fh: SetupItem; bh: SetupItem; n: number; who: ProSetup[] }>();
  for (const s of list) {
    if (!s.fh || !s.bh || !s.blade.product) continue;
    const k = `${s.blade.product}|${itemKey(s.fh)}|${itemKey(s.bh)}`;
    const c = m.get(k);
    if (c) {
      c.n++;
      c.who.push(s);
    } else m.set(k, { blade: s.blade, fh: s.fh, bh: s.bh, n: 1, who: [s] });
  }
  return [...m.values()].sort((a, b) => b.n - a.n);
}

/**
 * Родина волокна основи: ALC (ALC + Super ALC) або ZLC (ZLC + Super ZLC). Для основ на замовлення —
 * зі складу у виносці Butterfly. Інші матеріали (дерево, CNF, ZLF…) — null: гравців там замало.
 */
export type FiberFamily = "alc" | "zlc";

export function fiberFamily(surface: string | null | undefined): FiberFamily | null {
  if (surface === "alc" || surface === "super-alc") return "alc";
  if (surface === "zlc" || surface === "super-zlc") return "zlc";
  return null;
}

export function setupFamily(s: ProSetup): FiberFamily | null {
  if (s.blade.custom) return fiberFamily(s.blade.custom.surface);
  const p = s.blade.product ? getProductBySlug(s.blade.product) : undefined;
  return fiberFamily(p?.base?.surface);
}

export function setupsWithFamily(f: FiberFamily): ProSetup[] {
  return sortSetups(PRO_SETUPS.setups.filter((s) => setupFamily(s) === f));
}
