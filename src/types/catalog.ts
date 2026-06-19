// src/types/catalog.ts
// Типы КАТАЛОГА (товарные страницы, фильтры, SEO). Вынесены отдельно от src/types/index.ts,
// где живёт showcase-модель (Product/Brand/Category) для главной + корзины + админки.
// Имена намеренно с префиксом Catalog*, чтобы не конфликтовать с существующими типами.
import type { Locale } from "@/i18n/config";

/** Строка с переводами под все локали проекта (сейчас uk + ru). */
export type Localized = Record<Locale, string>;

/** Тип поверхности накладки (slug — для фильтров и ЧПУ-срезов). */
export type SurfaceType = "gladka" | "korotki-shypy" | "dovgi-shypy" | "antyspin";

/** Стиль/подтип. Для гладких — игровой характер; для шипов/анти — совпадает с типом поверхности. */
export type PlayStyle =
  | "tenzor"
  | "gibrid"
  | "lipka"
  | "klasyka"
  | "korotki-shypy"
  | "dovgi-shypy"
  | "antyspin";

export type Hardness = "soft" | "medium" | "hard";
export type Rating = "control" | "medium" | "high" | "very-high";
export type Level = "beginner" | "amateur" | "advanced" | "pro" | "special";
export type Color = "black" | "red";

/** Числовые рейтинги Butterfly (для витрины-характеристик) + бакеты (для фильтров). */
export interface RubberSpecs {
  speed?: number;
  spin?: number;
  arc?: number;
  hardnessDeg?: number;
  hardnessBucket?: Hardness;
  speedBucket?: Rating;
  spinBucket?: Rating;
}

/** Покупаемый вариант = товар × толщина × цвет. price/inStock — из прайса (или Supabase). */
export interface CatalogVariant {
  /** "1.7" | "1.9" | "2.1" | "2.5" | "2.7" | "MAX" | "OX" | "1.1" | "1.3" | "1.5" */
  thickness: string;
  color: Color;
  sku?: string;
  /** Цена в гривнах. */
  price?: number;
  inStock?: boolean;
}

export interface CatalogImage {
  /** Cloudinary public_id (предпочтительно) ИЛИ абсолютный URL. */
  publicId?: string;
  url?: string;
  alt?: Localized;
  isPrimary?: boolean;
}

export interface CatalogProduct {
  id: string;
  /** ЧПУ-slug без бренда: "dignics-09c". */
  slug: string;
  brandSlug: string;
  /** Серия: "dignics" | "tenergy" | ... */
  seriesSlug: string;
  /** Категория: "nakladki" | "osnovaniya" | ... */
  categorySlug: string;
  /** Полное модельное имя: "Dignics 09C". */
  model: string;
  name: Localized;
  /** <title> страницы (шаблон ТЗ). */
  title: Localized;
  /** meta description (опционально, заполняется позже). */
  description?: Localized;
  /** Тип поверхні — лише для накладок (kind: "rubber"). */
  surfaceType?: SurfaceType;
  /** Ігровий стиль — лише для накладок. */
  playStyle?: PlayStyle;
  level: Level;
  specs: RubberSpecs;
  /** Вид товару. За замовчуванням — накладка. */
  kind?: "rubber" | "base" | "gear" | "racket";
  /** Базова ціна (основи/екіпірування мають єдину ціну; накладки — ціну за варіантами). */
  priceFrom?: number;
  /** Наявність на рівні товару (для основ/екіпірування). */
  inStock?: boolean;
  /** Характеристики основи (лише для kind: "base"). */
  base?: BaseSpec;
  /** Характеристики екіпірування: одяг, взуття, м'ячі, аксесуари (kind: "gear"). */
  gear?: GearSpec;
  /** Склад збірної ракетки (для kind: "racket"): slug основи + накладок FH/BH. */
  combo?: { blade: string; fh: string; bh: string };
  thicknessOptions: string[];
  colors: Color[];
  /** Развёртка вариантов (толщина × цвет). */
  variants: CatalogVariant[];
  images: CatalogImage[];
  targetKeyword?: string;
  searchVolume?: number;
  /** Приоритет публикации: 1 — сразу, 2 — далее, 3 — полнота. */
  priority: 1 | 2 | 3;
  /** Slug'и сопутствующих/похожих для «з цим купують» / «схожі». */
  crossSell?: string[];
}

export interface CatalogBrand {
  slug: string;
  name: string;
  title: Localized;
  description: Localized;
  intro?: Localized;
  logo?: string;
  isActive: boolean;
}

export interface CatalogSeries {
  slug: string;
  brandSlug: string;
  name: string;
}

export interface CatalogCategory {
  slug: string;
  parentSlug?: string;
  name: Localized;
  h1: Localized;
  title: Localized;
  metaDescription: Localized;
  intro?: Localized;
  seoText?: Localized;
  isIndexable: boolean;
  sort: number;
}

export interface FilterOption {
  value: string;
  label: Localized;
}

export interface FilterDef {
  /** surfaceType | playStyle | series | thickness | hardnessBucket | speedBucket | spinBucket | level | color */
  key: string;
  label: Localized;
  type: "single" | "multi" | "range";
  options: FilterOption[];
  /** Допустим ли индексируемый ЧПУ-срез (бренд×категория, серия и т.п.). */
  facetIndexable: boolean;
}

/* ---------- Основания (blades) ---------- */

/** Клас основи за швидкістю/контролем. */
export type BladeClass = "all" | "all-plus" | "off-minus" | "off" | "off-plus" | "def";

/** Тип конструкції/волокна основи. */
export type BladeSurface =
  | "wood"
  | "alc"
  | "super-alc"
  | "zlc"
  | "super-zlc"
  | "zlf"
  | "t5000"
  | "cnf"
  | "caf"
  | "carbon";

/** Тип ручки. FL — конічна, ST — пряма, AN — анатомічна, CS — китайське перо. */
export type Handle = "fl" | "st" | "an" | "cs";

/** Характеристики основи (для kind: "base"). */
export interface BaseSpec {
  bladeClass: BladeClass;
  surface: BladeSurface;
  /** Кількість шарів: "5", "7", "5+2" тощо. */
  plies?: string;
  /** Приблизна вага, г. */
  weightG?: number;
  /** Доступні типи ручки. */
  handles: Handle[];
}

/** Стать для одягу/взуття. */
export type Gender = "men" | "women" | "unisex";

/** Характеристики екіпірування (для kind: "gear"): одяг, взуття, м'ячі, аксесуари. */
export interface GearSpec {
  /** Підтип для угруповання й фільтрів: tshirt, shorts, suit, jacket, track, sweater, skirt,
   *  socks, cap, band, shoes, slippers, balls, glue, cleaner, care, edge-tape, overgrip,
   *  film, ball-tube, insole, towel, bottle, bag, backpack, case, net тощо. */
  gearType: string;
  /** Стать — для одягу та взуття. */
  gender?: Gender;
  /** Розміри одягу ["XS","S",...] або взуття ["38","39",...]. */
  sizes?: string[];
  /** К-сть у пакованні (м'ячі): "6 шт". */
  packSize?: string;
  /** Зірковість м'ячів: "3*" / "трен.". */
  stars?: string;
  /** Об'єм (клей/очисник), мл. */
  volumeMl?: number;
}
