// src/lib/catalog/routing.ts
// Резолвер ЧПУ каталога: один catch-all [locale]/[...segments] раскладывается в тип страницы.
// Категории / бренд-хаб / бренд×категория / товар — всё определяется по данным каталога.
import type { Locale } from "@/i18n/config";
import type {
  CatalogBrand,
  CatalogCategory,
  CatalogProduct,
  CatalogSeries,
  Localized,
} from "@/types/catalog";
import {
  catalogSeries,
  getActiveBrands,
  getBrandBySlug,
  getCategoryBySlug,
  getIndexableCategories,
  getProductBySlug,
  getProductsByBrand,
  getProductsByBrandCategory,
  getProductsByCategory,
  getProductsBySeries,
  rubberFilters,
} from "@/data/catalog";

export function pickLocalized(value: Localized, locale: Locale): string {
  return value[locale];
}

/** Локализованная подпись значения фильтра (тип поверхности, уровень, цвет, бакеты). */
export function labelFor(key: string, value: string, locale: Locale): string {
  const def = rubberFilters.find((f) => f.key === key);
  const opt = def?.options.find((o) => o.value === value);
  return opt ? opt.label[locale] : value;
}

export type CatalogRoute =
  | { kind: "category"; category: CatalogCategory; products: CatalogProduct[]; index: boolean }
  | {
      kind: "brand";
      brand: CatalogBrand;
      categories: CatalogCategory[];
      products: CatalogProduct[];
      index: boolean;
    }
  | {
      kind: "brandCategory";
      brand: CatalogBrand;
      category: CatalogCategory;
      products: CatalogProduct[];
      index: boolean;
    }
  | {
      kind: "series";
      category: CatalogCategory;
      series: CatalogSeries;
      products: CatalogProduct[];
      index: boolean;
    }
  | {
      kind: "surfaceGroup";
      category: CatalogCategory;
      group: SurfaceGroup;
      products: CatalogProduct[];
      index: boolean;
    }
  | {
      kind: "product";
      brand: CatalogBrand;
      category: CatalogCategory;
      product: CatalogProduct;
      index: boolean;
    };

/** Група основ за типом поверхні (ALC/ZLC) — окрема сторінка-колекція /{category}/{slug}. */
export type SurfaceGroup = {
  slug: string;
  category: string;
  surfaces: string[];
  name: Localized;
  h1: Localized;
  title: Localized;
  metaDescription: Localized;
  intro: Localized;
  seoText: Localized;
  faq: { q: Localized; a: Localized }[];
};

export const surfaceGroups: SurfaceGroup[] = [
  {
    slug: "alc",
    category: "osnovaniya",
    surfaces: ["alc", "super-alc"],
    name: { ua: "Основи ALC", ru: "Основания ALC" },
    h1: { ua: "Основи Butterfly ALC", ru: "Основания Butterfly ALC" },
    title: {
      ua: "Основи Butterfly ALC — купити в Україні | ціна, відгуки | TTMAX",
      ru: "Основания Butterfly ALC — купить в Украине | цена, отзывы | TTMAX",
    },
    metaDescription: {
      ua: "Основи Butterfly з арилат-карбоном (ALC): Viscaria, Timo Boll ALC, Harimoto ALC. Баланс швидкості та контролю для атаки. Гарантія, доставка по Україні.",
      ru: "Основания Butterfly с арилат-карбоном (ALC): Viscaria, Timo Boll ALC, Harimoto ALC. Баланс скорости и контроля для атаки. Гарантия, доставка по Украине.",
    },
    intro: {
      ua: "Основи ALC (арилат-карбон) — золотий стандарт для атакувальної гри: швидкість плюс контроль. Серед моделей Butterfly: Viscaria, Timo Boll ALC, Harimoto Tomokazu ALC.",
      ru: "Основания ALC (арилат-карбон) — золотой стандарт для атакующей игры: скорость плюс контроль. Среди моделей Butterfly: Viscaria, Timo Boll ALC, Harimoto Tomokazu ALC.",
    },
    seoText: {
      ua: "Основи з арилат-карбоновим шаром (ALC) — найпопулярніший вибір серед атакувальних гравців усіх рівнів. Карбоновий прошарок додає швидкості та збільшує «солодку зону», зберігаючи природний контроль дерева, тож ракетка прощає неточні удари й лишається передбачуваною.\nУ лінійці Butterfly до ALC належать Viscaria, Timo Boll ALC і Harimoto Tomokazu ALC — універсальні основи під топспін-гру біля столу та з середньої дистанції. Для них чудово підходять накладки Tenergy 05 і Dignics 05.\nНе хочете збирати самостійно — оберіть готову ракетку у зборі: ми наклеїмо й обріжемо безкоштовно.",
      ru: "Основания с арилат-карбоновым слоем (ALC) — самый популярный выбор среди атакующих игроков всех уровней. Карбоновый слой добавляет скорости и увеличивает «зону комфорта», сохраняя естественный контроль дерева, поэтому ракетка прощает неточные удары и остаётся предсказуемой.\nВ линейке Butterfly к ALC относятся Viscaria, Timo Boll ALC и Harimoto Tomokazu ALC — универсальные основания под топспин-игру у стола и со средней дистанции. К ним отлично подходят накладки Tenergy 05 и Dignics 05.\nНе хотите собирать самостоятельно — выберите готовую ракетку в сборе: мы наклеим и обрежем бесплатно.",
    },
    faq: [
      { q: { ua: "Що таке основа ALC?", ru: "Что такое основание ALC?" }, a: { ua: "ALC — це шар арилат-карбону в конструкції основи. Він додає швидкості та збільшує «солодку зону», зберігаючи контроль дерева. Універсальний вибір для атаки топспіном.", ru: "ALC — это слой арилат-карбона в конструкции основания. Он добавляет скорости и увеличивает «зону комфорта», сохраняя контроль дерева. Универсальный выбор для атаки топспином." } },
      { q: { ua: "ALC чи ZLC — що обрати?", ru: "ALC или ZLC — что выбрать?" }, a: { ua: "ALC — баланс швидкості й контролю, підходить більшості гравців. ZLC жорсткіша та швидша, для досвідчених силовиків. Початківцям і універсалам краще ALC.", ru: "ALC — баланс скорости и контроля, подходит большинству игроков. ZLC жёстче и быстрее, для опытных силовиков. Новичкам и универсалам лучше ALC." } },
      { q: { ua: "Яку накладку поставити на ALC-основу?", ru: "Какую накладку поставить на ALC-основание?" }, a: { ua: "Найкраще підходять Tenergy 05 і Dignics 05 — вони розкривають швидкість та обертання ALC. Можна замовити готову ракетку у зборі.", ru: "Лучше всего подходят Tenergy 05 и Dignics 05 — они раскрывают скорость и вращение ALC. Можно заказать готовую ракетку в сборе." } },
      { q: { ua: "Для якого рівня підходять ALC-основи?", ru: "Для какого уровня подходят ALC-основания?" }, a: { ua: "Від упевненого аматора до професіонала. Viscaria й Timo Boll ALC — одні з найпопулярніших основ у світовому тенісі.", ru: "От уверенного любителя до профессионала. Viscaria и Timo Boll ALC — одни из самых популярных оснований в мировом теннисе." } },
    ],
  },
  {
    slug: "zlc",
    category: "osnovaniya",
    surfaces: ["zlc", "super-zlc"],
    name: { ua: "Основи ZLC", ru: "Основания ZLC" },
    h1: { ua: "Основи Butterfly ZLC", ru: "Основания Butterfly ZLC" },
    title: {
      ua: "Основи Butterfly ZLC — купити в Україні | ціна, відгуки | TTMAX",
      ru: "Основания Butterfly ZLC — купить в Украине | цена, отзывы | TTMAX",
    },
    metaDescription: {
      ua: "Основи Butterfly із Zylon-карбоном (ZLC): Apolonia ZLC, Zhang Jike ZLC та інші. Максимальна швидкість для гри першим темпом. Гарантія, доставка по Україні.",
      ru: "Основания Butterfly с Zylon-карбоном (ZLC): Apolonia ZLC, Zhang Jike ZLC и другие. Максимальная скорость для игры первым темпом. Гарантия, доставка по Украине.",
    },
    intro: {
      ua: "Основи ZLC (Zylon-карбон) — жорсткіші та швидші за ALC, для потужної гри першим темпом. Серед моделей: Apolonia ZLC, Zhang Jike ZLC.",
      ru: "Основания ZLC (Zylon-карбон) — жёстче и быстрее ALC, для мощной игры первым темпом. Среди моделей: Apolonia ZLC, Zhang Jike ZLC.",
    },
    seoText: {
      ua: "Основи з шаром Zylon-карбону (ZLC) — крок угору за швидкістю та жорсткістю порівняно з ALC. Zylon передає більше енергії, тож м'яч летить швидше й нижче — це цінують гравці агресивного силового стилю та гри першим темпом.\nСеред моделей Butterfly — Apolonia ZLC і Zhang Jike ZLC. ZLC вимагає трохи більше контролю від гравця, тому її частіше обирають досвідчені спортсмени. Оптимальні накладки — Dignics 05 або Dignics 09C.\nЯкщо вагаєтесь між ALC і ZLC, почніть з ALC. А готову зв'язку завжди можна замовити зібраною — з безкоштовним поклеюванням і обрізанням.",
      ru: "Основания со слоем Zylon-карбона (ZLC) — шаг вверх по скорости и жёсткости по сравнению с ALC. Zylon передаёт больше энергии, поэтому мяч летит быстрее и ниже — это ценят игроки агрессивного силового стиля и игры первым темпом.\nСреди моделей Butterfly — Apolonia ZLC и Zhang Jike ZLC. ZLC требует чуть больше контроля от игрока, поэтому её чаще выбирают опытные спортсмены. Оптимальные накладки — Dignics 05 или Dignics 09C.\nЕсли сомневаетесь между ALC и ZLC, начните с ALC. А готовую связку всегда можно заказать собранной — с бесплатной поклейкой и обрезкой.",
    },
    faq: [
      { q: { ua: "Чим ZLC відрізняється від ALC?", ru: "Чем ZLC отличается от ALC?" }, a: { ua: "ZLC (Zylon-карбон) жорсткіша та швидша: м'яч летить швидше й нижче. ALC м'якша й контрольованіша. ZLC — для силової гри першим темпом.", ru: "ZLC (Zylon-карбон) жёстче и быстрее: мяч летит быстрее и ниже. ALC мягче и контролируемее. ZLC — для силовой игры первым темпом." } },
      { q: { ua: "Кому підходить основа ZLC?", ru: "Кому подходит основание ZLC?" }, a: { ua: "Досвідченим гравцям агресивного атакувального стилю, які грають швидко й близько до столу. Початківцям краще почати з ALC або дерева.", ru: "Опытным игрокам агрессивного атакующего стиля, которые играют быстро и близко к столу. Новичкам лучше начать с ALC или дерева." } },
      { q: { ua: "Яку накладку обрати для ZLC?", ru: "Какую накладку выбрать для ZLC?" }, a: { ua: "Dignics 05 або Dignics 09C — вони збалансують швидкість ZLC обертанням і контролем. Доступні й готові ракетки у зборі.", ru: "Dignics 05 или Dignics 09C — они сбалансируют скорость ZLC вращением и контролем. Доступны и готовые ракетки в сборе." } },
      { q: { ua: "ZLC складніша в керуванні?", ru: "ZLC сложнее в управлении?" }, a: { ua: "Так, через жорсткість вона вимагає кращої техніки й контролю. Якщо вагаєтесь — почніть з ALC, а до ZLC перейдете згодом.", ru: "Да, из-за жёсткости она требует лучшей техники и контроля. Если сомневаетесь — начните с ALC, а к ZLC перейдёте позже." } },
    ],
  },
];

export const findSurfaceGroup = (slug: string): SurfaceGroup | undefined =>
  surfaceGroups.find((g) => g.slug === slug);

function activeBrand(slug: string): CatalogBrand | undefined {
  const b = getBrandBySlug(slug);
  return b && b.isActive ? b : undefined;
}

/** Раскладывает массив сегментов URL в конкретную страницу каталога (или null → 404). */
export function resolveSegments(segments: string[]): CatalogRoute | null {
  // /{slug} — бренд-хаб или категория
  if (segments.length === 1) {
    const a = segments[0];
    if (!a) return null;

    const brand = activeBrand(a);
    if (brand) {
      const products = getProductsByBrand(brand.slug);
      const categories = getIndexableCategories().filter(
        (c) => getProductsByBrandCategory(brand.slug, c.slug).length > 0,
      );
      return { kind: "brand", brand, categories, products, index: products.length > 0 };
    }

    const category = getCategoryBySlug(a);
    if (category) {
      const products = getProductsByCategory(category.slug);
      return { kind: "category", category, products, index: products.length > 0 };
    }
    return null;
  }

  // /{brand}/{category} — бренд×категория; або /{category}/{series} — хаб серії
  if (segments.length === 2) {
    const a = segments[0];
    const b = segments[1];
    if (!a || !b) return null;

    const brand = activeBrand(a);
    const category = getCategoryBySlug(b);
    if (brand && category) {
      const products = getProductsByBrandCategory(brand.slug, category.slug);
      return { kind: "brandCategory", brand, category, products, index: products.length > 0 };
    }

    // /{category}/{series} — напр. /nakladki/dignics
    const cat = getCategoryBySlug(a);
    const series = catalogSeries.find((s) => s.slug === b);
    if (cat && series) {
      const products = getProductsBySeries(series.slug).filter((p) => p.categorySlug === cat.slug);
      // Поріг 2, а не 1: хаб з єдиним товаром дублює title самої картки (Zyre 03, Rozena —
      // це money-товари) і канібалізує її, нічого не додаючи. Такі хаби лишаємо доступними,
      // але поза індексом.
      return { kind: "series", category: cat, series, products, index: products.length >= 2 };
    }
    // /{category}/{surface-group} — напр. /osnovaniya/alc, /osnovaniya/zlc
    const sg = findSurfaceGroup(b);
    if (cat && sg && sg.category === cat.slug) {
      const sgProducts = getProductsByCategory(cat.slug).filter((p) =>
        sg.surfaces.includes(p.base?.surface ?? ""),
      );
      return {
        kind: "surfaceGroup",
        category: cat,
        group: sg,
        products: sgProducts,
        index: sgProducts.length > 0,
      };
    }
    return null;
  }

  // /{brand}/{category}/{product} — карточка товара
  if (segments.length === 3) {
    const a = segments[0];
    const b = segments[1];
    const c = segments[2];
    if (!a || !b || !c) return null;

    const brand = activeBrand(a);
    const category = getCategoryBySlug(b);
    const product = getProductBySlug(c);
    if (
      brand &&
      category &&
      product &&
      product.brandSlug === brand.slug &&
      product.categorySlug === category.slug
    ) {
      // Комбо-ракетки («основа + накладка») — noindex, follow. Власного попиту в них немає
      // (Ahrefs UA: «купить viscaria», «накладка dignics 05» — відсутні в базі; 40/міс на всі 95),
      // а в title стоїть та сама назва, що й у картки компонента → кожна основа конкурує з 19 комбо,
      // топ-накладка — з 25. follow лишає прокачку ваги на картки компонентів.
      // Сторінки лишаються живими й продають: рендер не читає index (page.tsx — notFound лише при route===null).
      // ⚠️ ПАРНА ЗМІНА: sitemap.ts фільтрує ці ж товари — інакше GSC дасть «Submitted URL marked noindex».
      const isCombo = product.kind === "racket" && product.categorySlug === "rakety";
      return { kind: "product", brand, category, product, index: !isCombo };
    }
    return null;
  }

  return null;
}

/** Все статические пути каталога для generateStaticParams (без локали — её даёт [locale]). */
export function catalogStaticParams(): { segments: string[] }[] {
  const params: { segments: string[] }[] = [];

  // Категории (все индексируемые — для навигации; пустые получат noindex в метаданных).
  for (const c of getIndexableCategories()) params.push({ segments: [c.slug] });

  // Активные бренды с товарами: хаб + бренд×категория + товары.
  for (const brand of getActiveBrands()) {
    const brandProducts = getProductsByBrand(brand.slug);
    if (brandProducts.length === 0) continue;

    params.push({ segments: [brand.slug] });

    for (const c of getIndexableCategories()) {
      if (getProductsByBrandCategory(brand.slug, c.slug).length > 0) {
        params.push({ segments: [brand.slug, c.slug] });
      }
    }
    for (const p of brandProducts) {
      params.push({ segments: [p.brandSlug, p.categorySlug, p.slug] });
    }
  }

  // Хаби серій з товарами: /{category}/{series}
  for (const s of catalogSeries) {
    const prods = getProductsBySeries(s.slug);
    const cat = prods[0]?.categorySlug;
    if (cat) params.push({ segments: [cat, s.slug] });
  }

  // Хаби груп поверхонь основ: /osnovaniya/alc, /osnovaniya/zlc
  for (const g of surfaceGroups) {
    const has = getProductsByCategory(g.category).some((p) =>
      g.surfaces.includes(p.base?.surface ?? ""),
    );
    if (has) params.push({ segments: [g.category, g.slug] });
  }

  return params;
}

/* ---------- SEO-тексты по типу страницы ---------- */

export function routeTitle(route: CatalogRoute, locale: Locale): string {
  switch (route.kind) {
    case "category":
      return pickLocalized(route.category.title, locale);
    case "brand":
      return pickLocalized(route.brand.title, locale);
    case "brandCategory": {
      const cat = pickLocalized(route.category.name, locale);
      const tail = locale === "ua" ? "купити в Україні" : "купить в Украине";
      return `${cat} ${route.brand.name} — ${tail} | TTMAX`;
    }
    case "series": {
      // Було «Bryce — купити в Україні | TTMAX»: гола назва серії без жодного ключа —
      // такий title не відповідає жодному запиту. Додаємо категорійний іменник і бренд.
      const cat = pickLocalized(route.category.name, locale);
      const tail = locale === "ua" ? "купити в Україні" : "купить в Украине";
      return `${cat} Butterfly ${route.series.name} — ${tail} | TTMAX`;
    }
    case "surfaceGroup":
      return pickLocalized(route.group.title, locale);
    case "product":
      return pickLocalized(route.product.title, locale);
  }
}

export function routeDescription(route: CatalogRoute, locale: Locale): string {
  switch (route.kind) {
    case "category":
      return pickLocalized(route.category.metaDescription, locale);
    case "brand":
      return pickLocalized(route.brand.description, locale);
    case "brandCategory": {
      const cat = pickLocalized(route.category.name, locale).toLowerCase();
      return locale === "ua"
        ? `${route.brand.name}: ${cat} для настільного тенісу. Офіційний товар, гарантія, доставка по Україні.`
        : `${route.brand.name}: ${cat} для настольного тенниса. Официальный товар, гарантия, доставка по Украине.`;
    }
    case "series": {
      const cat = pickLocalized(route.category.name, locale).toLowerCase();
      return locale === "ua"
        ? `Серія ${route.series.name}: ${cat} для настільного тенісу. Офіційний товар, гарантія, доставка по Україні.`
        : `Серия ${route.series.name}: ${cat} для настольного тенниса. Официальный товар, гарантия, доставка по Украине.`;
    }
    case "surfaceGroup":
      return pickLocalized(route.group.metaDescription, locale);
    case "product":
      if (route.product.description) return pickLocalized(route.product.description, locale);
      return locale === "ua"
        ? `Купити ${route.product.name.ua} в Україні. Характеристики, ціна, відгуки. Гарантія, доставка.`
        : `Купить ${route.product.name.ru} в Украине. Характеристики, цена, отзывы. Гарантия, доставка.`;
  }
}

export function routeH1(route: CatalogRoute, locale: Locale): string {
  switch (route.kind) {
    case "category":
      return pickLocalized(route.category.h1, locale);
    case "brand":
      return route.brand.name;
    case "brandCategory":
      return `${pickLocalized(route.category.name, locale)} ${route.brand.name}`;
    case "series":
      return `${pickLocalized(route.category.name, locale)} ${route.series.name}`;
    case "surfaceGroup":
      return pickLocalized(route.group.h1, locale);
    case "product":
      return pickLocalized(route.product.name, locale);
  }
}

/** Хлебные крошки (path без локали; локаль добавляет компонент ссылки). */
export function catalogBreadcrumbs(
  route: CatalogRoute,
  locale: Locale,
): { name: string; path: string }[] {
  const home = { name: locale === "ua" ? "Головна" : "Главная", path: "/" };
  switch (route.kind) {
    case "category":
      return [
        home,
        { name: pickLocalized(route.category.name, locale), path: `/${route.category.slug}` },
      ];
    case "brand":
      return [home, { name: route.brand.name, path: `/${route.brand.slug}` }];
    case "brandCategory":
      return [
        home,
        { name: route.brand.name, path: `/${route.brand.slug}` },
        {
          name: pickLocalized(route.category.name, locale),
          path: `/${route.brand.slug}/${route.category.slug}`,
        },
      ];
    case "series":
      return [
        home,
        {
          name: pickLocalized(route.category.name, locale),
          path: `/${route.category.slug}`,
        },
        {
          name: route.series.name,
          path: `/${route.category.slug}/${route.series.slug}`,
        },
      ];
    case "surfaceGroup":
      return [
        home,
        {
          name: pickLocalized(route.category.name, locale),
          path: `/${route.category.slug}`,
        },
        {
          name: pickLocalized(route.group.name, locale),
          path: `/${route.category.slug}/${route.group.slug}`,
        },
      ];
    case "product":
      return [
        home,
        { name: route.brand.name, path: `/${route.brand.slug}` },
        {
          name: pickLocalized(route.category.name, locale),
          path: `/${route.brand.slug}/${route.category.slug}`,
        },
        {
          name: pickLocalized(route.product.name, locale),
          path: `/${route.product.brandSlug}/${route.product.categorySlug}/${route.product.slug}`,
        },
      ];
  }
}

/** UI-подписи каталога (чтобы не трогать i18n/messages). */
export const catalogUi = {
  from: { ua: "від", ru: "от" },
  uah: { ua: "грн", ru: "грн" },
  priceOnRequest: { ua: "Ціна за запитом", ru: "Цена по запросу" },
  specs: { ua: "Характеристики", ru: "Характеристики" },
  speed: { ua: "Швидкість", ru: "Скорость" },
  spin: { ua: "Обертання", ru: "Вращение" },
  arc: { ua: "Дуга", ru: "Дуга" },
  hardness: { ua: "Жорсткість губки", ru: "Жёсткость губки" },
  surface: { ua: "Тип поверхні", ru: "Тип поверхности" },
  level: { ua: "Рівень", ru: "Уровень" },
  colors: { ua: "Колір", ru: "Цвет" },
  thickness: { ua: "Товщина, мм", ru: "Толщина, мм" },
  emptySoon: { ua: "Товари скоро з'являться", ru: "Товары скоро появятся" },
  related: { ua: "Схожі товари", ru: "Похожие товары" },
  chooseInStep3: {
    ua: "Вибір варіанта та кошик — на наступному кроці",
    ru: "Выбор варианта и корзина — на следующем шаге",
  },
} satisfies Record<string, Localized>;
