// src/lib/catalog/specTables.ts
// Таблиці характеристик для статей-довідників («Таблиця накладок Butterfly», «Таблиця основ»).
//
// ⚠️ НАВІЩО ГЕНЕРУВАТИ, А НЕ ПИСАТИ РУКАМИ: у таблиці на 40–80 рядків цифри з картки товару
// розійшлися б при першій же правці каталогу, і помітити це було б нікому. Тут рядки
// будуються з того самого `products.ts` / `bases.ts`, що й картки, а колонка «Хто грає» —
// з інвентаря гравців Butterfly (data/proSetups.ts). Стаття задає лише групу (`BlogSection.specTable`), а
// getPost()/getAllPosts() у blog.ts підставляють готову таблицю — тож її бачать і сторінка,
// і llms-файли.
import type { Locale } from "@/i18n/config";
import type { CatalogProduct, BladeClass, BladeSurface } from "@/types/catalog";
import { catalogProducts, catalogBases, getProductPath } from "@/data/catalog";
import { isWithdrawn } from "@/lib/catalog/hidden";
import {
  bladeRanking,
  rubberRanking,
  setupsWithBlade,
  setupsWithRubber,
  type Count,
  type SetupItem,
} from "@/data/proSetups";
import { PLAYERS } from "@/data/players";

type L = Record<Locale, string>;
export type SpecCell = L & { href?: string };
export type SpecTable = { columns: L[]; rows: SpecCell[][] };

export type RubberGroup = "tenzor" | "lipka" | "klasyka" | "korotki-shypy" | "dovgi-shypy";
export type BladeGroup = "alc" | "zlc" | "inshi-volokna" | "derevo";
export type SpecTableRef =
  | { kind: "rubbers"; group: RubberGroup }
  | { kind: "blades"; group: BladeGroup }
  /** Скільки гравців Butterfly ставлять ці накладки (усі гравці з офіційним інвентарем, data/proSetups.ts). */
  | { kind: "proRubbers"; slugs: string[] }
  /** Скільки гравців Butterfly грають на цих основах і що на них ставлять. */
  | { kind: "proBlades"; slugs: string[] };

const same = (s: string): L => ({ ua: s, ru: s });
const num = (n: number | undefined, digits = 0): string =>
  n == null ? "—" : n.toFixed(digits).replace(".", ",");
const DASH = same("—");

/**
 * ⚠️ Aibiss (китайського типу) Butterfly оцінює в ІНШІЙ шкалі (швидкість 10,5, обертання 11),
 * ніж решту накладок (шкала ~0–100). Поставити ці числа в одну колонку — означало б показати
 * «найповільнішу накладку каталогу». Тому для неї швидкість/обертання/дуга не виводимо.
 */
const OTHER_SCALE = new Set(["aibiss"]);

const visible = (list: CatalogProduct[]) => list.filter((p) => !isWithdrawn(p));

function modelCell(p: CatalogProduct): SpecCell {
  return { ...same(p.model), href: getProductPath(p) };
}

/**
 * «Харімото, Лінь Юньжу +9» — до двох імен, решта числом. Рахуємо ВСІХ гравців Butterfly з
 * офіційним інвентарем (data/proSetups.ts), а не лише тих, хто має сторінку на сайті: гравці з
 * профілем ідуть першими й підписані нашою мовою, решта — латиницею, як у Butterfly.
 */
function playersCell(slug: string, kind: "rubber" | "blade"): SpecCell {
  const ps = kind === "blade" ? setupsWithBlade(slug) : setupsWithRubber(slug).map((u) => u.setup);
  if (ps.length === 0) return DASH;
  const names = (loc: Locale) => {
    const head = ps
      .slice(0, 2)
      .map((p) => (p.profile ? PLAYERS[p.profile].name[loc] : p.name))
      .join(", ");
    return ps.length > 2 ? `${head} +${ps.length - 2}` : head;
  };
  return { ua: names("ua"), ru: names("ru") };
}

const STYLE: Record<string, L> = {
  tenzor: { ua: "тензор", ru: "тензор" },
  gibrid: { ua: "гібрид (тензор + липкість)", ru: "гибрид (тензор + липкость)" },
  lipka: { ua: "липка", ru: "липкая" },
  klasyka: { ua: "класика", ru: "классика" },
  "korotki-shypy": { ua: "короткі шипи", ru: "короткие шипы" },
  "dovgi-shypy": { ua: "довгі шипи", ru: "длинные шипы" },
  antyspin: { ua: "антиспін", ru: "антиспин" },
};

function rubberGroupOf(p: CatalogProduct): RubberGroup | null {
  switch (p.playStyle) {
    case "tenzor":
    case "gibrid":
      return "tenzor";
    case "lipka":
      return "lipka";
    case "klasyka":
      return "klasyka";
    case "korotki-shypy":
      return "korotki-shypy";
    case "dovgi-shypy":
    case "antyspin":
      return "dovgi-shypy";
    default:
      return null;
  }
}

function rubberTable(group: RubberGroup): SpecTable {
  const items = visible(catalogProducts)
    .filter((p) => (p.kind ?? "rubber") === "rubber" && rubberGroupOf(p) === group)
    .sort((a, b) => (b.specs.speed ?? -1) - (a.specs.speed ?? -1) || a.model.localeCompare(b.model));
  const scaled = (p: CatalogProduct, v: number | undefined) => (OTHER_SCALE.has(p.slug) ? undefined : v);
  // Для довгих шипів і антиспіну Butterfly швидкість/обертання не публікує — колонки
  // з самими прочерками лише шумлять, тож порожні колонки прибираємо.
  const hasNumbers = items.some((p) => scaled(p, p.specs.speed) != null);
  const showStyle = group === "tenzor" || group === "dovgi-shypy";
  const columns: L[] = [
    { ua: "Модель", ru: "Модель" },
    ...(showStyle ? [{ ua: "Тип", ru: "Тип" }] : []),
    ...(hasNumbers
      ? [
          { ua: "Швидкість", ru: "Скорость" },
          { ua: "Обертання", ru: "Вращение" },
          { ua: "Дуга", ru: "Дуга" },
        ]
      : []),
    { ua: "Губка, °", ru: "Губка, °" },
    { ua: "Товщини, мм", ru: "Толщины, мм" },
    { ua: "Хто грає", ru: "Кто играет" },
  ];
  const rows = items.map((p): SpecCell[] => [
    modelCell(p),
    ...(showStyle ? [(p.playStyle && STYLE[p.playStyle]) || DASH] : []),
    ...(hasNumbers
      ? [
          same(num(scaled(p, p.specs.speed))),
          same(num(scaled(p, p.specs.spin))),
          same(num(scaled(p, p.specs.arc))),
        ]
      : []),
    same(num(p.specs.hardnessDeg)),
    same(p.thicknessOptions.join(" / ").replace(/\./g, ",")),
    playersCell(p.slug, "rubber"),
  ]);
  return { columns, rows };
}

const SURFACE: Record<BladeSurface, string> = {
  wood: "",
  alc: "ALC",
  "super-alc": "Super ALC",
  zlc: "ZLC",
  "super-zlc": "Super ZLC",
  zlf: "ZLF",
  t5000: "T5000",
  cnf: "CNF",
  caf: "CAF",
  carbon: "Carbon",
};

const CLASS: Record<BladeClass, string> = {
  all: "ALL",
  "all-plus": "ALL+",
  "off-minus": "OFF−",
  off: "OFF",
  "off-plus": "OFF+",
  def: "DEF",
};

function bladeGroupOf(surface: BladeSurface): BladeGroup {
  if (surface === "alc" || surface === "super-alc") return "alc";
  if (surface === "zlc" || surface === "super-zlc") return "zlc";
  if (surface === "wood") return "derevo";
  return "inshi-volokna";
}

function bladeTable(group: BladeGroup): SpecTable {
  const items = visible(catalogBases)
    .filter((p) => p.base && bladeGroupOf(p.base.surface) === group)
    .sort(
      (a, b) =>
        (b.base!.reaction ?? -1) - (a.base!.reaction ?? -1) ||
        (b.base!.thicknessMm ?? 0) - (a.base!.thicknessMm ?? 0) ||
        a.model.localeCompare(b.model),
    );
  const wood = group === "derevo";
  // ⚠️ КЛАС (OFF+/OFF/ALL…) — НЕ дані Butterfly: у bases.ts він виведений із назви моделі й
  // непослідовний (Viscaria — OFF+, Timo Boll ALC — OFF при однакових реакції й вібрації).
  // Для основ із волокном швидкість показує офіційна реакція, тож клас лишаємо лише для
  // дерева, де офіційних чисел немає, і підписуємо як орієнтир.
  // Реакція/вібрація — офіційні числа Butterfly, але є лише в частини моделей; у дерев'яних
  // їх немає зовсім — порожні колонки прибираємо.
  const hasRV = items.some((p) => p.base!.reaction != null);
  const columns: L[] = [
    { ua: "Модель", ru: "Модель" },
    ...(wood ? [] : [{ ua: "Волокно", ru: "Волокно" }]),
    { ua: "Шари", ru: "Слои" },
    { ua: "Товщина, мм", ru: "Толщина, мм" },
    { ua: "Вага", ru: "Вес" },
    ...(wood ? [{ ua: "Клас (орієнтир)", ru: "Класс (ориентир)" }] : []),
    ...(hasRV
      ? [
          { ua: "Реакція", ru: "Реакция" },
          { ua: "Вібрація", ru: "Вибрация" },
        ]
      : []),
    { ua: "Хто грає", ru: "Кто играет" },
  ];
  const fiber = (p: CatalogProduct): L => {
    const b = p.base!;
    const name = SURFACE[b.surface];
    if (!b.fiber) return same(name);
    return b.fiber === "inner"
      ? { ua: `${name}, внутрішнє`, ru: `${name}, внутреннее` }
      : { ua: `${name}, зовнішнє`, ru: `${name}, внешнее` };
  };
  const weight = (p: CatalogProduct): L => {
    return same(p.base!.weight ?? (p.base!.weightG ? `≈${p.base!.weightG} г` : "—"));
  };
  const rows = items.map((p): SpecCell[] => {
    const b = p.base!;
    return [
      modelCell(p),
      ...(wood ? [] : [fiber(p)]),
      same(b.plies ?? "—"),
      same(num(b.thicknessMm, 1)),
      weight(p),
      ...(wood ? [same(CLASS[b.bladeClass])] : []),
      ...(hasRV ? [same(num(b.reaction, 1)), same(num(b.vibration, 1))] : []),
      playersCell(p.slug, "blade"),
    ];
  });
  return { columns, rows };
}

/* ───────────── Таблиці «у профі» для статей (ті самі дані, що /igroki/inventar) ─────────────
 * ⚠️ Числа в тексті статті біля таких таблиць НЕ писати: дані оновлюються щомісяця
 * (scripts/gen-pro-setups.mjs --fetch), а таблиця перерахується сама. */

function proItemName(i: SetupItem, loc: Locale): string {
  if (i.custom) return i.custom.label[loc];
  const p = i.product ? catalogAll().find((x) => x.slug === i.product) : undefined;
  return p?.model ?? i.name ?? "—";
}

/** «Dignics 09C (5)» або «Dignics 05 / Dignics 09C (по 3)»; основи на замовлення пропускаємо. */
function proTop(xs: Count[]): SpecCell {
  const list = xs.filter((c) => c.key !== "custom");
  if (list.length === 0) return DASH;
  const top = list[0]!.n;
  const lead = list.filter((c) => c.n === top).slice(0, 3);
  const cell = (loc: Locale) =>
    lead.length > 1
      ? `${lead.map((c) => proItemName(c.item, loc)).join(" / ")} (${loc === "ua" ? "по" : "по"} ${top})`
      : `${proItemName(lead[0]!.item, loc)} (${top})`;
  return { ua: cell("ua"), ru: cell("ru") };
}

const catalogAll = () => [...catalogProducts, ...catalogBases];

function productCell(slug: string): SpecCell {
  const p = catalogAll().find((x) => x.slug === slug);
  return p ? modelCell(p) : same(slug);
}

function proRubberTable(slugs: string[]): SpecTable {
  const rows = slugs.map((slug) => {
    const uses = setupsWithRubber(slug);
    const fh = uses.filter((u) => u.side === "fh" || u.side === "both").length;
    const bh = uses.filter((u) => u.side === "bh" || u.side === "both").length;
    return { n: uses.length, cells: [productCell(slug), same(String(uses.length)), same(String(fh)), same(String(bh)), proTop(bladeRanking(uses.map((u) => u.setup)))] };
  });
  return {
    columns: [
      { ua: "Накладка", ru: "Накладка" },
      { ua: "Гравців Butterfly", ru: "Игроков Butterfly" },
      { ua: "На форхенді", ru: "На форхенде" },
      { ua: "На бекхенді", ru: "На бэкхенде" },
      { ua: "Найчастіше з основою", ru: "Чаще всего с основанием" },
    ],
    rows: rows.sort((a, b) => b.n - a.n).map((r) => r.cells),
  };
}

function proBladeTable(slugs: string[]): SpecTable {
  const rows = slugs.map((slug) => {
    const list = setupsWithBlade(slug);
    const r = rubberRanking(list);
    return { n: list.length, cells: [productCell(slug), same(String(list.length)), proTop(r.fh), proTop(r.bh)] };
  });
  return {
    columns: [
      { ua: "Основа", ru: "Основание" },
      { ua: "Гравців Butterfly", ru: "Игроков Butterfly" },
      { ua: "Форхенд — найчастіше", ru: "Форхенд — чаще всего" },
      { ua: "Бекхенд — найчастіше", ru: "Бэкхенд — чаще всего" },
    ],
    rows: rows.sort((a, b) => b.n - a.n).map((r) => r.cells),
  };
}

export function buildSpecTable(ref: SpecTableRef): SpecTable {
  switch (ref.kind) {
    case "rubbers":
      return rubberTable(ref.group);
    case "blades":
      return bladeTable(ref.group);
    case "proRubbers":
      return proRubberTable(ref.slugs);
    case "proBlades":
      return proBladeTable(ref.slugs);
  }
}

/** Кількість моделей у групі — для тексту статті й перевірок («у таблиці N моделей»). */
export function specTableSize(ref: SpecTableRef): number {
  return buildSpecTable(ref).rows.length;
}
