// src/lib/catalog/spec-rows.ts
// Таблиця «Характеристики» картки товару — підписи й рядки для накладок, основ і екіпірування.
//
// ⚠️ ОДНЕ ДЖЕРЕЛО для картки й товарного фіду Google Merchant Center (lib/feeds/google-merchant.ts).
// Google звіряє фід зі сторінкою, тож характеристика, підписана у фіді інакше, ніж на картці,
// виглядала б як інший товар. Раніше ці мапи й рядки жили всередині [...segments]/page.tsx.
import type { Locale } from "@/i18n/config";
import type { BladeClass, BladeSurface, CatalogProduct } from "@/types/catalog";
import { catalogUi, labelFor } from "@/lib/catalog/routing";

export type SpecRow = { label: string; value: string };

export const GEAR_TYPE_LABEL: Record<string, { ua: string; ru: string }> = {
  tshirt: { ua: "Футболка", ru: "Футболка" },
  shorts: { ua: "Шорти", ru: "Шорты" },
  suit: { ua: "Костюм", ru: "Костюм" },
  jacket: { ua: "Куртка", ru: "Куртка" },
  track: { ua: "Олімпійка", ru: "Олимпийка" },
  sweater: { ua: "Кофта", ru: "Кофта" },
  pants: { ua: "Штани", ru: "Штаны" },
  skirt: { ua: "Спідниця", ru: "Юбка" },
  socks: { ua: "Шкарпетки", ru: "Носки" },
  cap: { ua: "Кепка", ru: "Кепка" },
  band: { ua: "Пов'язка", ru: "Повязка" },
  shoes: { ua: "Кросівки", ru: "Кроссовки" },
  slippers: { ua: "Шльопанці", ru: "Шлёпанцы" },
  balls: { ua: "М'ячі", ru: "Мячи" },
  glue: { ua: "Клей", ru: "Клей" },
  cleaner: { ua: "Очисник", ru: "Очиститель" },
  care: { ua: "Догляд", ru: "Уход" },
  "edge-tape": { ua: "Торцева стрічка", ru: "Торцевая лента" },
  overgrip: { ua: "Обмотка", ru: "Обмотка" },
  film: { ua: "Захисна плівка", ru: "Защитная плёнка" },
  "ball-tube": { ua: "Тубус для м'ячів", ru: "Тубус для мячей" },
  insole: { ua: "Устілки", ru: "Стельки" },
  towel: { ua: "Рушник", ru: "Полотенце" },
  bottle: { ua: "Пляшка", ru: "Бутылка" },
  bag: { ua: "Сумка", ru: "Сумка" },
  backpack: { ua: "Рюкзак", ru: "Рюкзак" },
  case: { ua: "Чохол", ru: "Чехол" },
  "shoe-bag": { ua: "Сумка для взуття", ru: "Сумка для обуви" },
  "ball-bag": { ua: "Сумка для м'ячів", ru: "Сумка для мячей" },
  net: { ua: "Сітка", ru: "Сетка" },
  table: { ua: "Тенісний стіл", ru: "Теннисный стол" },
};

const GENDER_LABEL: Record<string, { ua: string; ru: string }> = {
  men: { ua: "Чоловіча", ru: "Мужская" },
  women: { ua: "Жіноча", ru: "Женская" },
  unisex: { ua: "Унісекс", ru: "Унисекс" },
};

export const gearTypeLabel = (v: string, locale: Locale) => GEAR_TYPE_LABEL[v]?.[locale] ?? v;
export const genderLabel = (v: string, locale: Locale) => GENDER_LABEL[v]?.[locale] ?? v;

/* Подписи характеристик основания (клас / тип волокна). */
export const BLADE_CLASS_LABEL: Record<BladeClass, { ua: string; ru: string }> = {
  "off-plus": { ua: "OFF+ · атака", ru: "OFF+ · атака" },
  off: { ua: "OFF", ru: "OFF" },
  "off-minus": { ua: "OFF− · універсал", ru: "OFF− · универсал" },
  "all-plus": { ua: "ALL+", ru: "ALL+" },
  all: { ua: "ALL · контроль", ru: "ALL · контроль" },
  def: { ua: "DEF · захист", ru: "DEF · защита" },
};
export const BLADE_SURFACE_LABEL: Record<BladeSurface, string> = {
  wood: "Дерево",
  alc: "ALC (арилат-карбон)",
  "super-alc": "Super ALC",
  zlc: "ZLC (ZL-карбон)",
  "super-zlc": "Super ZLC",
  zlf: "ZLF (ZL-волокно)",
  t5000: "T5000",
  cnf: "CNF",
  caf: "CAF / карбон",
  carbon: "Карбон",
};

/** Накладка: тип поверхні, числа Butterfly (швидкість, обертання, дуга), твердість, рівень. */
export function rubberSpecRows(product: CatalogProduct, locale: Locale): SpecRow[] {
  const rows: SpecRow[] = [];
  if (product.surfaceType)
    rows.push({
      label: catalogUi.surface[locale],
      value: labelFor("surfaceType", product.surfaceType, locale),
    });
  if (product.specs.speed !== undefined)
    rows.push({ label: catalogUi.speed[locale], value: String(product.specs.speed) });
  if (product.specs.spin !== undefined)
    rows.push({ label: catalogUi.spin[locale], value: String(product.specs.spin) });
  if (product.specs.arc !== undefined)
    rows.push({ label: catalogUi.arc[locale], value: String(product.specs.arc) });
  if (product.specs.hardnessDeg !== undefined)
    rows.push({ label: catalogUi.hardness[locale], value: `${product.specs.hardnessDeg}°` });
  rows.push({ label: catalogUi.level[locale], value: labelFor("level", product.level, locale) });
  return rows;
}

/** Основа: клас, конструкція, карбон, шари, товщина, лопать, реакція/вібрація, вага, виробництво. */
export function baseSpecRows(product: CatalogProduct, locale: Locale): SpecRow[] {
  const base = product.base!;
  const L = (ua: string, ru: string) => (locale === "ru" ? ru : ua);
  const rows: SpecRow[] = [
    { label: L("Клас", "Класс"), value: BLADE_CLASS_LABEL[base.bladeClass][locale] },
    { label: L("Тип основи", "Тип основания"), value: BLADE_SURFACE_LABEL[base.surface] },
  ];
  if (base.fiber)
    rows.push({
      label: L("Карбон", "Карбон"),
      value:
        base.fiber === "outer"
          ? L("Зовнішній (outer)", "Внешний (outer)")
          : L("Внутрішній (inner)", "Внутренний (inner)"),
    });
  if (base.plies) rows.push({ label: L("Шари", "Слои"), value: base.plies });
  if (base.thicknessMm)
    rows.push({ label: L("Товщина", "Толщина"), value: `${base.thicknessMm.toFixed(1)} мм` });
  if (base.sizeMm) rows.push({ label: L("Розмір лопаті", "Размер лопасти"), value: base.sizeMm });
  // ⚠️ Числа Butterfly, а не наша оцінка: показуємо як є, з двома знаками —
  // виробник публікує саме так (12.00, а не 12), і округлення тут виглядало б
  // як інша характеристика.
  if (typeof base.reaction === "number")
    rows.push({ label: L("Реакція", "Реакция"), value: base.reaction.toFixed(2) });
  if (typeof base.vibration === "number")
    rows.push({ label: L("Вібрація", "Вибрация"), value: base.vibration.toFixed(2) });
  if (base.weight) rows.push({ label: L("Середня вага", "Средний вес"), value: base.weight });
  else if (base.weightG) rows.push({ label: L("Вага", "Вес"), value: `${base.weightG} г` });
  if (base.madeIn)
    rows.push({ label: L("Виробництво", "Производство"), value: base.madeIn[locale] });
  rows.push({ label: catalogUi.level[locale], value: labelFor("level", product.level, locale) });
  return rows;
}

/** Екіпірування й столи: тип, стать, розміри, пакування, обʼєм, параметри столу. */
export function gearSpecRows(product: CatalogProduct, locale: Locale): SpecRow[] {
  const gear = product.gear!;
  const L = (ua: string, ru: string) => (locale === "ru" ? ru : ua);
  const rows: SpecRow[] = [];
  rows.push({ label: L("Тип", "Тип"), value: gearTypeLabel(gear.gearType, locale) });
  if (gear.gender) rows.push({ label: L("Стать", "Пол"), value: genderLabel(gear.gender, locale) });
  if (gear.sizes && gear.sizes.length)
    rows.push({ label: L("Розміри", "Размеры"), value: gear.sizes.join(", ") });
  if (gear.stars) rows.push({ label: L("Зірковість", "Звёздность"), value: gear.stars });
  if (gear.packSize) rows.push({ label: L("В упаковці", "В упаковке"), value: gear.packSize });
  if (gear.volumeMl) rows.push({ label: L("Об'єм", "Объём"), value: `${gear.volumeMl} мл` });
  // Столи (gearType: "table")
  if (gear.tableThicknessMm)
    rows.push({
      label: L("Товщина стільниці", "Толщина столешницы"),
      value: `${gear.tableThicknessMm} мм`,
    });
  if (gear.sizeUnfolded)
    rows.push({
      label: L("Розміри (розкладений)", "Размеры (разложенный)"),
      value: gear.sizeUnfolded,
    });
  if (gear.sizeFolded)
    rows.push({ label: L("У складеному вигляді", "В сложенном виде"), value: gear.sizeFolded });
  if (gear.weightKg) rows.push({ label: L("Вага", "Вес"), value: `${gear.weightKg} кг` });
  if (gear.usage)
    rows.push({
      label: L("Призначення", "Назначение"),
      value:
        gear.usage === "indoor"
          ? L("Для приміщень", "Для помещений")
          : L("Всепогодній", "Всепогодный"),
    });
  if (gear.rollaway)
    rows.push({
      label: L("Конструкція", "Конструкция"),
      value: L("Складна, на колесах", "Складная, на колёсах"),
    });
  if (gear.ittf) rows.push({ label: L("Схвалення ITTF", "Одобрение ITTF"), value: L("Так", "Да") });
  return rows;
}

/** Рядки характеристик за видом товару (накладка / основа / екіпірування). Ракетки — окремо. */
export function productSpecRows(product: CatalogProduct, locale: Locale): SpecRow[] {
  if (product.base) return baseSpecRows(product, locale);
  if (product.gear) return gearSpecRows(product, locale);
  if (product.kind === "racket" || product.combo) return [];
  return rubberSpecRows(product, locale);
}
