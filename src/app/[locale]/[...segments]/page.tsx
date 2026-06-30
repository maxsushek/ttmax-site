// src/app/[locale]/[...segments]/page.tsx
// Catch-all каталога: /{category}, /{brand}, /{brand}/{category}, /{brand}/{category}/{product}.
// Не перехватывает главную (/{locale}) и имеет низший приоритет, поэтому ничего существующего не ломает.
// Поддержка двух видов товара: накладки (kind: "rubber") и основания (kind: "base").
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/Section";
import { isLocale, type Locale } from "@/i18n/config";
import { getBrandBySlug, getCrossSell, getMinPrice, getProductsByCategory, isInStock } from "@/data/catalog";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/utils/format";
import type { CatalogProduct, BladeClass, BladeSurface } from "@/types/catalog";
import type { ProductCategory } from "@/types";
import { ProductPurchasePanel } from "@/components/catalog/ProductPurchasePanel";
import { BasePurchasePanel } from "@/components/catalog/BasePurchasePanel";
import { GearPurchasePanel } from "@/components/catalog/GearPurchasePanel";
import {
  CatalogFilters,
  type CatalogCardVM,
  type FacetGroup,
} from "@/components/catalog/CatalogFilters";
import { breadcrumbJsonLd, productJsonLd, faqJsonLd } from "@/lib/seo/jsonld";
import { getOverrides, applyOverrides, type OverridesMap } from "@/lib/catalog/overrides";
import { resolveCombo } from "@/lib/catalog/racket";
import { RacketBenefits } from "@/components/catalog/RacketBenefits";
import { RacketComboPanel } from "@/components/catalog/RacketComboPanel";
import { getMediaMap, pickPrimary, pickAll, type EntityMediaMap } from "@/lib/media/get";
import { ProductGallery, type GalleryImage } from "@/components/catalog/ProductGallery";
import { ExpertSections } from "@/components/catalog/ExpertSections";
import { CategorySeo } from "@/components/catalog/CategorySeo";
import { RichContent } from "@/components/catalog/RichContent";
import { getRichContent } from "@/data/catalog/categoryContent";
import { getExpert } from "@/data/catalog/expert";
import { cldUrl } from "@/lib/cloudinary/url";
import Image from "next/image";
import {
  catalogBreadcrumbs,
  catalogStaticParams,
  catalogUi,
  labelFor,
  pickLocalized,
  resolveSegments,
  routeDescription,
  routeH1,
  routeTitle,
  surfaceGroups,
  type CatalogRoute,
  type SurfaceGroup,
} from "@/lib/catalog/routing";
import { buildCatalogMetadata } from "@/lib/seo/catalog-metadata";
import { getContent, type ContentBlock, type ContentEntityType } from "@/lib/content/get";
import {
  buildTokenContext,
  expandContentBlock,
  expandTokens,
  pluralModels,
} from "@/lib/content/tokens";
import { ContentIntro, ContentSections } from "@/components/content/ContentSections";

export const dynamicParams = true;

// ISR: фото из админки появляются без передеплоя (кеш медиа инвалидируется тегом + revalidate).
export const revalidate = 600;

export function generateStaticParams() {
  return catalogStaticParams();
}

/** Сутність + slug для прив'язки контентного блоку до маршруту каталогу. */
function contentKeyForRoute(
  route: CatalogRoute,
): { entityType: ContentEntityType; slug: string } | null {
  switch (route.kind) {
    case "product":
      return { entityType: "product", slug: route.product.slug };
    case "category":
      return { entityType: "category", slug: route.category.slug };
    case "brand":
      return { entityType: "brand", slug: route.brand.slug };
    case "brandCategory":
      return { entityType: "brandCategory", slug: `${route.brand.slug}/${route.category.slug}` };
    case "series":
      return { entityType: "series", slug: route.series.slug };
    default:
      return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; segments: string[] }>;
}): Promise<Metadata> {
  const { locale: l, segments } = await params;
  if (!isLocale(l)) return {};
  const route = resolveSegments(segments);
  if (!route) return { robots: { index: false, follow: false } };
  const ck = contentKeyForRoute(route);
  const content = ck ? await getContent(ck.entityType, ck.slug, l) : null;

  // Токени: живі ціна/кількість/рік підставляються на рендері (з оверрайдами), без ручної правки.
  const overrides = await getOverrides();
  const currentProducts = route.kind === "product" ? [route.product] : route.products;
  const tctx = buildTokenContext({ locale: l, overrides, currentProducts });

  const title = expandTokens(content?.metaTitle || routeTitle(route, l), tctx) ?? "";
  let description =
    expandTokens(content?.metaDescription || routeDescription(route, l), tctx) ?? "";

  // Авто-числа в СГЕНЕРОВАНИХ (неавторських) описах категорій/серій — щоб нові сторінки
  // мали актуальну ціну/кількість без ручного редагування.
  if (!content?.metaDescription && (route.kind === "category" || route.kind === "series")) {
    const bits: string[] = [];
    if (tctx.current.count > 0)
      bits.push(`${tctx.current.count} ${pluralModels(tctx.current.count, l)}`);
    if (tctx.current.minPrice != null)
      bits.push(`${l === "ua" ? "від" : "от"} ${formatPrice(tctx.current.minPrice)}`);
    if (bits.length) description = `${description} ${bits.join(" · ")}`.trim();
  }

  return buildCatalogMetadata({
    locale: l,
    pathname: "/" + segments.join("/"),
    title,
    description,
    index: route.index && !content?.noindex,
  });
}

/** Категория каталога → showcase-категория корзины (для лейбла в корзине). */
const GEAR_TYPE_LABEL: Record<string, { ua: string; ru: string }> = {
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
};

const GENDER_LABEL: Record<string, { ua: string; ru: string }> = {
  men: { ua: "Чоловіча", ru: "Мужская" },
  women: { ua: "Жіноча", ru: "Женская" },
  unisex: { ua: "Унісекс", ru: "Унисекс" },
};

const gearTypeLabel = (v: string, locale: Locale) => GEAR_TYPE_LABEL[v]?.[locale] ?? v;
const genderLabel = (v: string, locale: Locale) => GENDER_LABEL[v]?.[locale] ?? v;

const CART_CATEGORY: Record<string, ProductCategory> = {
  rakety: "base",
  nakladki: "rubber",
  osnovaniya: "base",
  myachi: "ball",
  odyag: "apparel",
  obuv: "shoes",
  aksessuary: "accessory",
  chehly: "bag",
  setki: "net",
};

/* Подписи характеристик основания (клас / тип волокна). */
const BLADE_CLASS_LABEL: Record<BladeClass, { ua: string; ru: string }> = {
  "off-plus": { ua: "OFF+ · атака", ru: "OFF+ · атака" },
  off: { ua: "OFF", ru: "OFF" },
  "off-minus": { ua: "OFF− · універсал", ru: "OFF− · универсал" },
  "all-plus": { ua: "ALL+", ru: "ALL+" },
  all: { ua: "ALL · контроль", ru: "ALL · контроль" },
  def: { ua: "DEF · захист", ru: "DEF · защита" },
};
const BLADE_SURFACE_LABEL: Record<BladeSurface, string> = {
  wood: "Дерево",
  alc: "ALC (арилат-карбон)",
  "super-alc": "Super ALC",
  zlc: "ZLC (Zylon-карбон)",
  "super-zlc": "Super ZLC",
  zlf: "ZLF (Zylon-fiber)",
  t5000: "T5000",
  cnf: "CNF",
  caf: "CAF / карбон",
  carbon: "Карбон",
};

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ locale: string; segments: string[] }>;
}) {
  const { locale: l, segments } = await params;
  if (!isLocale(l)) notFound();
  const locale: Locale = l;

  const route = resolveSegments(segments);
  if (!route) notFound();

  const media = await getMediaMap();
  const overrides = await getOverrides();
  // Накладаємо ціну/наявність із Supabase поверх коду один раз — далі всі читання
  // (JSON-LD, картки, фільтр цін, панелі товару, ціна в кошик) беруть уже перекриті значення.
  const eroute = withOverrides(route, overrides);

  // Контентний шар (опис/FAQ/порівняння) — по сутності маршруту й поточній мові.
  const ck = contentKeyForRoute(route);
  const rawContent = ck ? await getContent(ck.entityType, ck.slug, locale) : null;

  // Токени контенту: живі значення (ціна з оверрайдами, кількість, рік) у всіх текстах блоку.
  const currentProducts = eroute.kind === "product" ? [eroute.product] : eroute.products;
  const tctx = buildTokenContext({ locale, overrides, currentProducts });
  const content = expandContentBlock(rawContent, tctx);

  const crumbs = catalogBreadcrumbs(route, locale);
  const breadcrumbLd = breadcrumbJsonLd(crumbs, locale);
  const productLd =
    eroute.kind === "product"
      ? (() => {
          const vPrices = eroute.product.variants
            .map((v) => v.price)
            .filter((n): n is number => typeof n === "number" && n > 0);
          const lowPrice = vPrices.length ? Math.min(...vPrices) : undefined;
          const highPrice = vPrices.length ? Math.max(...vPrices) : undefined;
          return productJsonLd({
            name: pickLocalized(eroute.product.name, locale),
            description: expandTokens(routeDescription(eroute, locale), tctx) ?? "",
            url: `${siteConfig.url}/${locale}/${eroute.product.brandSlug}/${eroute.product.categorySlug}/${eroute.product.slug}`,
            brand: getBrandBySlug(eroute.product.brandSlug)?.name ?? eroute.product.brandSlug,
            price: getMinPrice(eroute.product),
            currency: "UAH",
            inStock: isInStock(eroute.product),
            lowPrice,
            highPrice,
            offerCount: eroute.product.variants.length,
            priceValidUntil: `${new Date().getFullYear() + 1}-12-31`,
          });
        })()
      : null;

  // FAQ JSON-LD: Google прибрав FAQ rich results (07.05.2026), але FAQPage лишається валідною
  // schema й допомагає AI/Copilot розбирати Q&A. Тримаємо за прапором; розмітка = видимий FAQ.
  const EMIT_FAQ_JSONLD = true;
  const expertFaq =
    eroute.kind === "product" ? getExpert(eroute.product.slug)?.faq : undefined;
  const categoryFaq = eroute.kind === "category" ? eroute.category.faq : undefined;
  const groupFaq = eroute.kind === "surfaceGroup" ? eroute.group.faq : undefined;
  const richFaqSlug =
    eroute.kind === "category"
      ? eroute.category.slug
      : eroute.kind === "surfaceGroup"
        ? eroute.group.slug
        : null;
  const richFaq = richFaqSlug ? getRichContent(richFaqSlug)?.faq : undefined;
  const fallbackFaq = richFaq ?? expertFaq ?? categoryFaq ?? groupFaq;
  const faqItems =
    content?.faq && content.faq.length > 0
      ? content.faq
      : fallbackFaq && fallbackFaq.length > 0
        ? fallbackFaq.map((f) => ({ q: pickLocalized(f.q, locale), a: pickLocalized(f.a, locale) }))
        : null;
  const faqLd = EMIT_FAQ_JSONLD && faqItems ? faqJsonLd(faqItems) : null;

  return (
    <Section as="div" className="pt-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {productLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
        />
      )}
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}
      <Container>
        <nav
          aria-label="breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-body text-xs text-ink-muted"
        >
          {crumbs.map((c, i) => (
            <span key={c.path} className="inline-flex items-center gap-1.5">
              {i > 0 && (
                <span aria-hidden className="text-ink-ghost">
                  /
                </span>
              )}
              {i < crumbs.length - 1 ? (
                <Link
                  href={`/${locale}${c.path === "/" ? "" : c.path}`}
                  className="transition-colors hover:text-accent"
                >
                  {c.name}
                </Link>
              ) : (
                <span className="text-ink">{c.name}</span>
              )}
            </span>
          ))}
        </nav>

        {eroute.kind === "product" ? (
          <ProductView route={eroute} locale={locale} media={media} content={content} />
        ) : (
          <ListingView route={eroute} locale={locale} media={media} content={content} />
        )}
      </Container>
    </Section>
  );
}

/* ---------------- Витрина-листинг (категория / бренд / бренд×категория) ---------------- */

/** Повертає копію route з накладеними ціною/наявністю на товар(и). */
function withOverrides(route: CatalogRoute, ov: OverridesMap): CatalogRoute {
  if (route.kind === "product") {
    return { ...route, product: applyOverrides(route.product, ov) };
  }
  if ("products" in route) {
    return { ...route, products: route.products.map((p) => applyOverrides(p, ov)) };
  }
  return route;
}

function ListingView({
  route,
  locale,
  media,
  content,
}: {
  route: Exclude<CatalogRoute, { kind: "product" }>;
  locale: Locale;
  media: EntityMediaMap;
  content: ContentBlock | null;
}) {
  // Пріоритетні товари (priority:1) і в наявності — вище; далі за ціною.
  const ordered = [...route.products].sort((a, b) => {
    const pa = a.priority ?? 3;
    const pb = b.priority ?? 3;
    if (pa !== pb) return pa - pb;
    const sa = isInStock(a) ? 0 : 1;
    const sb = isInStock(b) ? 0 : 1;
    if (sa !== sb) return sa - sb;
    return (getMinPrice(a) ?? Number.MAX_SAFE_INTEGER) - (getMinPrice(b) ?? Number.MAX_SAFE_INTEGER);
  });

  const routeIntro =
    route.kind === "category"
      ? route.category.intro
      : route.kind === "brand"
        ? route.brand.intro
        : route.kind === "surfaceGroup"
          ? route.group.intro
          : undefined;
  const introText = content?.intro ?? (routeIntro ? pickLocalized(routeIntro, locale) : undefined);

  return (
    <>
      <header className="mb-9 max-w-3xl">
        <h1 className="text-balance font-display text-3xl font-black uppercase tracking-tight sm:text-[42px] sm:leading-[1.05]">
          {routeH1(route, locale)}
        </h1>
        <ContentIntro text={introText} />
      </header>

      {route.kind === "brand" ? (
        <ul className="flex flex-wrap gap-2.5">
          {route.categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/${locale}/${route.brand.slug}/${c.slug}`}
                className="inline-flex rounded-xl border border-border-strong bg-bg-raised px-4 py-2.5 font-display text-sm font-bold uppercase tracking-[0.04em] text-ink transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:text-accent"
              >
                {pickLocalized(c.name, locale)}
              </Link>
            </li>
          ))}
        </ul>
      ) : route.products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong bg-white/[0.015] p-10 text-center">
          <p className="font-body text-sm text-ink-muted">{catalogUi.emptySoon[locale]}</p>
        </div>
      ) : (route.kind === "category" || route.kind === "brandCategory") && route.category.slug === "rakety" ? (
        <RacketGrid products={route.products} locale={locale} media={media} />
      ) : (
        <Suspense
          fallback={<ProductGrid products={ordered} locale={locale} media={media} />}
        >
          <CatalogFilters
            locale={locale}
            items={buildCardVMs(ordered, locale, media)}
            groups={buildFacetGroups(ordered, locale)}
            priceBuckets={buildPriceBuckets(ordered, locale)}
          />
        </Suspense>
      )}
      {(() => {
        const richSlug =
          route.kind === "category"
            ? route.category.slug
            : route.kind === "surfaceGroup"
              ? route.group.slug
              : null;
        const rich = richSlug ? getRichContent(richSlug) : undefined;
        if (rich) return <RichContent content={rich} locale={locale} />;
        const cmsRich = !!(content && ((content.body?.length ?? 0) > 0 || (content.faq?.length ?? 0) > 0));
        return (
          <>
            <ContentSections block={content} locale={locale} />
            {route.kind === "surfaceGroup" && <SurfaceGroupSeo group={route.group} locale={locale} />}
            {route.kind === "category" && (
              <CategorySeo category={route.category} locale={locale} linksOnly={cmsRich} />
            )}
          </>
        );
      })()}
    </>
  );
}

/** Вторичная строка карточки: для основания — клас, для накладки — тип поверхности. */
function cardSecondary(product: CatalogProduct, locale: Locale): string {
  if (product.base) return BLADE_CLASS_LABEL[product.base.bladeClass][locale];
  if (product.surfaceType) return labelFor("surfaceType", product.surfaceType, locale);
  if (product.gear) {
    const tp = gearTypeLabel(product.gear.gearType, locale);
    return product.gear.gender ? `${tp} · ${genderLabel(product.gear.gender, locale)}` : tp;
  }
  return "";
}

/* ---------------- Серверная подготовка данных для клиентских фильтров ---------------- */

/** Готовит сериализуемые VM карточек (вся отрисовка — в клиентском компоненте). */
function buildCardVMs(
  products: CatalogProduct[],
  locale: Locale,
  media: EntityMediaMap,
): CatalogCardVM[] {
  return products.map((p, i) => {
    const price = getMinPrice(p);
    const brandName = getBrandBySlug(p.brandSlug)?.name ?? p.brandSlug;
    const img = pickPrimary(media, "product", p.slug);
    return {
      slug: p.slug,
      href: `/${locale}/${p.brandSlug}/${p.categorySlug}/${p.slug}`,
      brandName,
      model: p.model,
      secondary: cardSecondary(p, locale),
      priceLabel: price !== undefined ? `${catalogUi.from[locale]} ${formatPrice(price)}` : null,
      priceValue: price ?? null,
      inStock: isInStock(p),
      imageUrl: img ? cldUrl(img.publicId, { w: 480, h: 480 }) : null,
      facets: {
        bladeClass: p.base?.bladeClass,
        surface: p.base?.surface,
        surfaceType: p.surfaceType,
        playStyle: p.playStyle,
        gearType: p.gear?.gearType,
        gender: p.gear?.gender,
        level: p.level,
      },
      order: i,
    };
  });
}

/** Динамические фасеты: только значения, реально присутствующие в списке. */
function buildFacetGroups(products: CatalogProduct[], locale: Locale): FacetGroup[] {
  const isBases = products.some((p) => p.base);
  const isGear = products.some((p) => p.gear);
  const groups: FacetGroup[] = [];

  const collect = (
    key: string,
    label: string,
    getVal: (p: CatalogProduct) => string | undefined,
    labelOf: (v: string) => string,
    orderRef?: string[],
  ) => {
    const counts = new Map<string, number>();
    for (const p of products) {
      const v = getVal(p);
      if (v === undefined) continue;
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    if (counts.size < 2) return; // фильтр из одного значения бесполезен
    const values = [...counts.keys()];
    if (orderRef) values.sort((a, b) => orderRef.indexOf(a) - orderRef.indexOf(b));
    else values.sort((a, b) => labelOf(a).localeCompare(labelOf(b)));
    groups.push({
      key,
      label,
      options: values.map((v) => ({ value: v, label: labelOf(v), count: counts.get(v) ?? 0 })),
    });
  };

  if (isBases) {
    collect(
      "bladeClass",
      locale === "ru" ? "Класс" : "Клас",
      (p) => p.base?.bladeClass,
      (v) => BLADE_CLASS_LABEL[v as keyof typeof BLADE_CLASS_LABEL]?.[locale] ?? v,
      ["off-plus", "off", "off-minus", "all-plus", "all", "def"],
    );
    collect(
      "surface",
      locale === "ru" ? "Тип основания" : "Тип основи",
      (p) => p.base?.surface,
      (v) => BLADE_SURFACE_LABEL[v as keyof typeof BLADE_SURFACE_LABEL] ?? v,
      ["wood", "alc", "super-alc", "zlc", "super-zlc", "zlf", "t5000", "cnf", "caf", "carbon"],
    );
  } else if (isGear) {
    collect(
      "gearType",
      locale === "ru" ? "Тип" : "Тип",
      (p) => p.gear?.gearType,
      (v) => gearTypeLabel(v, locale),
    );
    collect(
      "gender",
      locale === "ru" ? "Пол" : "Стать",
      (p) => p.gear?.gender,
      (v) => genderLabel(v, locale),
      ["men", "women", "unisex"],
    );
  } else {
    collect(
      "surfaceType",
      locale === "ru" ? "Тип поверхности" : "Тип поверхні",
      (p) => p.surfaceType,
      (v) => labelFor("surfaceType", v, locale),
      ["gladka", "korotki-shypy", "dovgi-shypy", "antyspin"],
    );
    collect(
      "playStyle",
      "Стиль",
      (p) => p.playStyle,
      (v) => labelFor("playStyle", v, locale),
    );
  }

  // Уровень — общий для обоих типов
  collect(
    "level",
    locale === "ru" ? "Уровень" : "Рівень",
    (p) => p.level,
    (v) => labelFor("level", v, locale),
    ["beginner", "amateur", "advanced", "pro", "special"],
  );

  return groups;
}

/** Адаптивные ценовые бакеты по диапазону цен в списке. */
function buildPriceBuckets(
  products: CatalogProduct[],
  locale: Locale,
): { label: string; min: number; max: number | null }[] {
  const prices = products
    .map((p) => getMinPrice(p))
    .filter((v): v is number => typeof v === "number");
  if (prices.length < 3) return [];
  const max = Math.max(...prices);
  const fmt = (n: number) => formatPrice(n);
  const upTo = locale === "ru" ? "до" : "до";
  const from = locale === "ru" ? "от" : "від";

  // Пороговые значения подобраны под ассортимент Butterfly (накладки ~1–5к, основи ~1–26к).
  const edges = max > 12000 ? [3000, 6000, 10000] : max > 5000 ? [2000, 4000, 6000] : [1500, 2500];
  const buckets: { label: string; min: number; max: number | null }[] = [];
  buckets.push({ label: `${upTo} ${fmt(edges[0]!)}`, min: 0, max: edges[0]! });
  for (let i = 0; i < edges.length - 1; i++) {
    buckets.push({
      label: `${fmt(edges[i]!)}–${fmt(edges[i + 1]!)}`,
      min: edges[i]!,
      max: edges[i + 1]!,
    });
  }
  buckets.push({
    label: `${from} ${fmt(edges[edges.length - 1]!)}`,
    min: edges[edges.length - 1]!,
    max: null,
  });
  return buckets;
}

function ProductCard({
  product,
  locale,
  media,
}: {
  product: CatalogProduct;
  locale: Locale;
  media: EntityMediaMap;
}) {
  const price = getMinPrice(product);
  const brandName = getBrandBySlug(product.brandSlug)?.name ?? product.brandSlug;
  const secondary = cardSecondary(product, locale);
  const img = pickPrimary(media, "product", product.slug);

  return (
    <Link
      href={`/${locale}/${product.brandSlug}/${product.categorySlug}/${product.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-[18px] border border-border-strong bg-bg-raised p-3 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:bg-bg-elevated hover:shadow-card-hover sm:p-4"
      data-cta="catalog-product"
      data-location={product.slug}
    >
      <div className="relative mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03]">
        {img ? (
          <Image
            src={cldUrl(img.publicId, { w: 480, h: 480 })}
            alt={img.alt ?? `${brandName} ${product.model}`}
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-ink-ghost"
          >
            {brandName}
          </span>
        )}
        <div
          className="absolute inset-x-0 bottom-0 h-px scale-x-0 bg-accent/60 transition-transform duration-[400ms] group-hover:scale-x-100"
          aria-hidden
        />
      </div>

      <div className="text-[10px] font-bold uppercase tracking-[0.13em] text-ink-muted">
        {brandName}
      </div>
      <div className="mt-0.5 font-display text-[16px] font-extrabold leading-tight tracking-tight text-ink">
        {product.model}
      </div>
      {secondary && <div className="mt-1 font-body text-[11px] text-ink-dim">{secondary}</div>}

      <div className="mt-auto pt-3 font-display text-sm font-black text-accent">
        {price !== undefined
          ? `${catalogUi.from[locale]} ${formatPrice(price)}`
          : catalogUi.priceOnRequest[locale]}
      </div>
    </Link>
  );
}

/** Серверная сетка карточек — используется блоком «Схожі товари» (без фильтров). */
function ProductGrid({
  products,
  locale,
  media,
}: {
  products: CatalogProduct[];
  locale: Locale;
  media: EntityMediaMap;
}) {
  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      {products.map((p) => (
        <li key={p.slug} className="h-full">
          <ProductCard product={p} locale={locale} media={media} />
        </li>
      ))}
    </ul>
  );
}

/* ---------------- Страница товара (диспетчер: основание / накладка) ---------------- */

function ProductView({
  route,
  locale,
  media,
  content,
}: {
  route: Extract<CatalogRoute, { kind: "product" }>;
  locale: Locale;
  media: EntityMediaMap;
  content: ContentBlock | null;
}) {
  return route.product.kind === "racket" ? (
    <RacketComboView route={route} locale={locale} media={media} content={content} />
  ) : route.product.gear ? (
    <GearView route={route} locale={locale} media={media} content={content} />
  ) : route.product.base ? (
    <BaseView route={route} locale={locale} media={media} content={content} />
  ) : (
    <RubberView route={route} locale={locale} media={media} content={content} />
  );
}

/** Собирает все фото товара из entity_media: url (900×900) + thumb (160×160). */
function buildGallery(
  media: EntityMediaMap,
  slug: string,
  fallbackAlt: string,
): GalleryImage[] {
  return pickAll(media, "product", slug).map((m) => ({
    url: cldUrl(m.publicId, { w: 900, h: 900 }),
    thumb: cldUrl(m.publicId, { w: 160, h: 160 }),
    alt: m.alt ?? fallbackAlt,
  }));
}

function ProductShell({
  brandName,
  h1,
  visualLabel,
  images,
  children,
  related,
  locale,
  media,
  content,
  extra,
}: {
  brandName: string;
  h1: string;
  visualLabel: string;
  images: GalleryImage[];
  children: React.ReactNode;
  related: CatalogProduct[];
  locale: Locale;
  media: EntityMediaMap;
  content: ContentBlock | null;
  extra?: React.ReactNode;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="min-w-0">
        {images.length > 0 ? (
          <ProductGallery images={images} />
        ) : (
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[28px] border border-border-strong bg-white/[0.03]">
            <div className="pointer-events-none absolute right-[18%] top-0 h-full w-px bg-[linear-gradient(to_bottom,transparent,rgba(232,255,71,0.12)_45%,transparent)] [transform:skewX(-18deg)]" />
            <span className="font-display text-sm font-bold uppercase tracking-[0.3em] text-ink-ghost">
              {visualLabel}
            </span>
          </div>
        )}
      </div>

      <div>
        <div className="font-display text-xs font-bold uppercase tracking-[0.16em] text-ink-muted">
          {brandName}
        </div>
        <h1 className="mt-1.5 font-display text-3xl font-black uppercase leading-[1.05] tracking-tight sm:text-4xl">
          {h1}
        </h1>
        <ContentIntro text={content?.intro} />
        {children}
      </div>

      {extra && <div className="min-w-0 lg:col-span-2">{extra}</div>}

      {related.length > 0 && (
        <div className="lg:col-span-2">
          <h2 className="mb-5 mt-2 font-display text-lg font-bold uppercase tracking-[0.04em]">
            {catalogUi.related[locale]}
          </h2>
          <ProductGrid products={related} locale={locale} media={media} />
        </div>
      )}
      {content && (
        <div className="lg:col-span-2">
          <ContentSections block={content} locale={locale} />
        </div>
      )}
    </div>
  );
}

function SpecTable({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="overflow-hidden rounded-2xl border border-border-strong">
      {rows.map((r, i) => (
        <div
          key={r.label}
          className={`flex items-center justify-between px-4 py-3 text-sm ${
            i % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
          }`}
        >
          <dt className="text-ink-muted">{r.label}</dt>
          <dd className="font-semibold text-ink">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---- Накладка ---- */

function RubberView({
  route,
  locale,
  media,
  content,
}: {
  route: Extract<CatalogRoute, { kind: "product" }>;
  locale: Locale;
  media: EntityMediaMap;
  content: ContentBlock | null;
}) {
  const product = route.product;
  const brandName = getBrandBySlug(product.brandSlug)?.name ?? product.brandSlug;
  const related = getCrossSell(product);
  const img = pickPrimary(media, "product", product.slug);

  const rows: { label: string; value: string }[] = [];
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

  const cartCategory = CART_CATEGORY[product.categorySlug] ?? "rubber";
  const expertEntry = getExpert(product.slug);

  return (
    <ProductShell
      brandName={brandName}
      h1={routeH1(route, locale)}
      visualLabel={brandName}
      images={buildGallery(media, product.slug, `${brandName} ${product.model}`)}
      related={related}
      locale={locale}
      media={media}
      content={content}
      extra={
        expertEntry ? (
          <ExpertSections entry={expertEntry} locale={locale} currentSlug={product.slug} />
        ) : null
      }
    >
      <div className="mt-7">
        <ProductPurchasePanel
          locale={locale}
          slug={product.slug}
          brandLabel={brandName}
          model={product.model}
          cartCategory={cartCategory}
          accentColor="#E8FF47"
          colors={product.colors}
          thicknessOptions={product.thicknessOptions}
          variants={product.variants.map((v) => ({
            thickness: v.thickness,
            color: v.color,
            price: v.price,
            inStock: v.inStock,
          }))}
          phone={siteConfig.phone}
          imageUrl={img ? cldUrl(img.publicId, { w: 96, h: 96, crop: "fit" }) : undefined}
        />
      </div>

      <div className="mt-9">
        <h2 className="mb-3 font-display text-base font-bold uppercase tracking-[0.04em] text-ink">
          {catalogUi.specs[locale]}
        </h2>
        <SpecTable rows={rows} />
      </div>
    </ProductShell>
  );
}

/* ---- Основание ---- */

function GearView({
  route,
  locale,
  media,
  content,
}: {
  route: Extract<CatalogRoute, { kind: "product" }>;
  locale: Locale;
  media: EntityMediaMap;
  content: ContentBlock | null;
}) {
  const product = route.product;
  const gear = product.gear!;
  const brandName = getBrandBySlug(product.brandSlug)?.name ?? product.brandSlug;
  const related = getCrossSell(product);
  const img = pickPrimary(media, "product", product.slug);
  const L = (ua: string, ru: string) => (locale === "ru" ? ru : ua);

  const rows: { label: string; value: string }[] = [];
  rows.push({ label: L("Тип", "Тип"), value: gearTypeLabel(gear.gearType, locale) });
  if (gear.gender) rows.push({ label: L("Стать", "Пол"), value: genderLabel(gear.gender, locale) });
  if (gear.sizes && gear.sizes.length)
    rows.push({ label: L("Розміри", "Размеры"), value: gear.sizes.join(", ") });
  if (gear.stars) rows.push({ label: L("Зірковість", "Звёздность"), value: gear.stars });
  if (gear.packSize) rows.push({ label: L("В упаковці", "В упаковке"), value: gear.packSize });
  if (gear.volumeMl) rows.push({ label: L("Об'єм", "Объём"), value: `${gear.volumeMl} мл` });

  const cartCategory = CART_CATEGORY[product.categorySlug] ?? "accessory";

  return (
    <ProductShell
      brandName={brandName}
      h1={routeH1(route, locale)}
      visualLabel={brandName}
      images={buildGallery(media, product.slug, `${brandName} ${product.model}`)}
      related={related}
      locale={locale}
      media={media}
      content={content}
    >
      <div className="mt-7">
        <GearPurchasePanel
          locale={locale}
          slug={product.slug}
          brandLabel={brandName}
          model={product.model}
          cartCategory={cartCategory}
          accentColor="#E8FF47"
          sizes={gear.sizes}
          priceFrom={product.priceFrom}
          inStock={product.inStock}
          phone={siteConfig.phone}
          imageUrl={img ? cldUrl(img.publicId, { w: 96, h: 96, crop: "fit" }) : undefined}
        />
      </div>

      {rows.length > 0 && (
        <div className="mt-9">
          <h2 className="mb-3 font-display text-base font-bold uppercase tracking-[0.04em] text-ink">
            {catalogUi.specs[locale]}
          </h2>
          <SpecTable rows={rows} />
        </div>
      )}
    </ProductShell>
  );
}

/* ---- Основание ---- */

function BaseView({
  route,
  locale,
  media,
  content,
}: {
  route: Extract<CatalogRoute, { kind: "product" }>;
  locale: Locale;
  media: EntityMediaMap;
  content: ContentBlock | null;
}) {
  const product = route.product;
  const base = product.base!;
  const brandName = getBrandBySlug(product.brandSlug)?.name ?? product.brandSlug;
  const related = getCrossSell(product);
  const img = pickPrimary(media, "product", product.slug);

  const L = (ua: string, ru: string) => (locale === "ru" ? ru : ua);
  const rows: { label: string; value: string }[] = [
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
  if (base.weight) rows.push({ label: L("Середня вага", "Средний вес"), value: base.weight });
  else if (base.weightG) rows.push({ label: L("Вага", "Вес"), value: `${base.weightG} г` });
  rows.push({ label: catalogUi.level[locale], value: labelFor("level", product.level, locale) });

  const cartCategory = CART_CATEGORY[product.categorySlug] ?? "base";
  const expertEntry = getExpert(product.slug);

  return (
    <ProductShell
      brandName={brandName}
      h1={routeH1(route, locale)}
      visualLabel={brandName}
      images={buildGallery(media, product.slug, `${brandName} ${product.model}`)}
      related={related}
      locale={locale}
      media={media}
      content={content}
      extra={
        expertEntry ? (
          <ExpertSections entry={expertEntry} locale={locale} currentSlug={product.slug} />
        ) : null
      }
    >
      <div className="mt-7">
        <BasePurchasePanel
          locale={locale}
          slug={product.slug}
          brandLabel={brandName}
          model={product.model}
          cartCategory={cartCategory}
          accentColor="#E8FF47"
          handles={base.handles}
          priceFrom={product.priceFrom}
          inStock={product.inStock}
          phone={siteConfig.phone}
          imageUrl={img ? cldUrl(img.publicId, { w: 96, h: 96, crop: "fit" }) : undefined}
        />
      </div>

      <div className="mt-9">
        <h2 className="mb-3 font-display text-base font-bold uppercase tracking-[0.04em] text-ink">
          {catalogUi.specs[locale]}
        </h2>
        <SpecTable rows={rows} />
      </div>
    </ProductShell>
  );
}

/* ---------------- Збірні ракетки (kind: "racket") ---------------- */

/** Триптих із фото компонентів: основа + 2 накладки. */
function ComboTriptych({
  parts,
  media,
  size = "card",
}: {
  parts: CatalogProduct[];
  media: EntityMediaMap;
  size?: "card" | "hero";
}) {
  const blade = parts[0];
  const rubbers = parts.slice(1, 3);
  const tile = (p: CatalogProduct | undefined, big: boolean) => {
    const m = p ? pickPrimary(media, "product", p.slug) : null;
    const dim = big
      ? { w: size === "hero" ? 460 : 280, h: size === "hero" ? 620 : 380 }
      : { w: size === "hero" ? 300 : 190, h: size === "hero" ? 300 : 190 };
    const url = m ? cldUrl(m.publicId, { ...dim, crop: "fit" }) : null;
    return url ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={p?.model ?? ""} loading="lazy" className="h-full w-full object-contain p-1" />
    ) : (
      <span className="px-1 text-center font-display text-[9px] font-bold uppercase leading-tight tracking-[0.1em] text-ink-ghost">
        {p?.model ?? "Butterfly"}
      </span>
    );
  };
  return (
    <div className="flex gap-2 rounded-2xl border border-border-strong bg-white/[0.02] p-2">
      <div className="relative flex aspect-[3/4] basis-[56%] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.03]">
        {tile(blade, true)}
      </div>
      <div className="flex grow flex-col gap-2">
        <div className="relative flex grow items-center justify-center overflow-hidden rounded-xl bg-white/[0.03]">
          {tile(rubbers[0], false)}
        </div>
        <div className="relative flex grow items-center justify-center overflow-hidden rounded-xl bg-white/[0.03]">
          {tile(rubbers[1], false)}
        </div>
      </div>
    </div>
  );
}

/** Сітка карток-збірок (3 фото + ціна зі знижкою). Чиста функція рендера. */
function racketCardsGrid(
  rows: { p: CatalogProduct; info: ReturnType<typeof resolveCombo> }[],
  locale: Locale,
  media: EntityMediaMap,
) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map(({ p, info }) => (
        <li key={p.slug}>
          <Link
            href={`/${locale}/${p.brandSlug}/${p.categorySlug}/${p.slug}`}
            className="group flex h-full flex-col rounded-2xl border border-border-subtle bg-bg-raised p-4 transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:bg-bg-elevated"
            data-cta="racket-card"
            data-location={p.slug}
          >
            <ComboTriptych parts={info.parts} media={media} size="card" />
            <div className="mt-3.5 font-display text-[15px] font-bold uppercase leading-tight tracking-[0.02em] text-ink">
              {p.name[locale]}
            </div>
            <div className="mt-auto flex items-end gap-2 pt-3.5">
              {info.promoPrice !== undefined ? (
                <>
                  <span className="font-display text-xl font-black leading-none text-accent">
                    {formatPrice(info.promoPrice)}
                  </span>
                  {info.oldPrice !== undefined && info.oldPrice > info.promoPrice && (
                    <span className="text-sm text-ink-dim line-through">
                      {formatPrice(info.oldPrice)}
                    </span>
                  )}
                  <span className="ml-auto rounded bg-accent px-1.5 py-0.5 font-display text-[11px] font-black text-bg-base">
                    −{info.discountPct}%
                  </span>
                </>
              ) : (
                <span className="text-sm text-ink-muted">{catalogUi.priceOnRequest[locale]}</span>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Сітка категорії /rakety: блок переваг + картки збірок. */
async function RacketGrid({
  products,
  locale,
  media,
}: {
  products: CatalogProduct[];
  locale: Locale;
  media: EntityMediaMap;
}) {
  const ov = await getOverrides();
  const rows = products
    .map((p) => ({ p, info: resolveCombo(p, ov) }))
    .sort(
      (a, b) =>
        (a.p.priority ?? 3) - (b.p.priority ?? 3) ||
        (a.info.promoPrice ?? Number.MAX_SAFE_INTEGER) -
          (b.info.promoPrice ?? Number.MAX_SAFE_INTEGER),
    );
  return (
    <div>
      <div className="mb-6">
        <RacketBenefits locale={locale} />
      </div>
      {racketCardsGrid(rows, locale, media)}
    </div>
  );
}

/** Сторінка збірної ракетки: триптих, ціна -10%, переваги, склад, схожі. */
async function RacketComboView({
  route,
  locale,
  media,
  content,
}: {
  route: Extract<CatalogRoute, { kind: "product" }>;
  locale: Locale;
  media: EntityMediaMap;
  content: ContentBlock | null;
}) {
  const product = route.product;
  const ov = await getOverrides();
  const info = resolveCombo(product, ov);
  const brandName = getBrandBySlug(product.brandSlug)?.name ?? "Butterfly";
  const cartCategory = CART_CATEGORY[product.categorySlug] ?? "base";
  const heroImg = pickPrimary(media, "product", info.blade?.slug ?? product.slug);
  const L = (ua: string, ru: string) => (locale === "ru" ? ru : ua);
  const roles = [
    L("Основа", "Основание"),
    L("Накладка (FH)", "Накладка (FH)"),
    L("Накладка (BH)", "Накладка (BH)"),
  ];
  const related = getProductsByCategory("rakety")
    .filter((p) => p.slug !== product.slug)
    .slice(0, 3)
    .map((p) => ({ p, info: resolveCombo(p, ov) }));

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="min-w-0">
        <ComboTriptych parts={info.parts} media={media} size="hero" />
      </div>

      <div>
        <div className="font-display text-xs font-bold uppercase tracking-[0.16em] text-ink-muted">
          {brandName}
        </div>
        <h1 className="mt-1.5 font-display text-3xl font-black uppercase leading-[1.05] tracking-tight sm:text-4xl">
          {routeH1(route, locale)}
        </h1>
        <ContentIntro text={content?.intro} />

        <div className="mt-6">
          <RacketComboPanel
            locale={locale}
            slug={product.slug}
            brandLabel={brandName}
            model={product.model}
            cartCategory={cartCategory}
            accentColor="#E8FF47"
            oldPrice={info.oldPrice}
            promoPrice={info.promoPrice}
            discountPct={info.discountPct}
            inStock={product.inStock}
            phone={siteConfig.phone}
            imageUrl={heroImg ? cldUrl(heroImg.publicId, { w: 96, h: 96, crop: "fit" }) : undefined}
          />
        </div>

        <div className="mt-6">
          <RacketBenefits locale={locale} />
        </div>

        <div className="mt-9">
          <h2 className="mb-3 font-display text-base font-bold uppercase tracking-[0.04em] text-ink">
            {L("Що всередині", "Что внутри")}
          </h2>
          <ul className="space-y-2">
            {info.parts.map((part, i) => {
              const pr = getMinPrice(part);
              return (
                <li key={`${part.slug}-${i}`}>
                  <Link
                    href={`/${locale}/${part.brandSlug}/${part.categorySlug}/${part.slug}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border-strong bg-white/[0.02] px-4 py-3 transition-colors hover:border-accent/40"
                  >
                    <span className="min-w-0">
                      <span className="block text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                        {roles[i] ?? ""}
                      </span>
                      <span className="font-semibold text-ink">{part.name[locale]}</span>
                    </span>
                    {pr !== undefined && (
                      <span className="shrink-0 text-sm text-ink-muted">{formatPrice(pr)}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <div className="lg:col-span-2">
          <h2 className="mb-5 mt-2 font-display text-lg font-bold uppercase tracking-[0.04em]">
            {catalogUi.related[locale]}
          </h2>
          {racketCardsGrid(related, locale, media)}
        </div>
      )}

      {content && (
        <div className="lg:col-span-2">
          <ContentSections block={content} locale={locale} />
        </div>
      )}
    </div>
  );
}

/** SEO-текст + перелінковка для сторінок-колекцій основ за поверхнею (ALC/ZLC). */
function SurfaceGroupSeo({ group, locale }: { group: SurfaceGroup; locale: Locale }) {
  const L = (ua: string, ru: string) => (locale === "ru" ? ru : ua);
  const h2 = "font-display text-lg font-bold uppercase tracking-[0.05em] text-ink sm:text-xl";
  const paras = pickLocalized(group.seoText, locale)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const faq = group.faq ?? [];
  const sibling = surfaceGroups.find(
    (g) => g.slug !== group.slug && g.category === group.category,
  );
  const links: { label: string; href: string }[] = [
    { label: L("Усі основи Butterfly", "Все основания Butterfly"), href: `/${locale}/${group.category}` },
  ];
  if (sibling) {
    links.push({
      label: pickLocalized(sibling.name, locale),
      href: `/${locale}/${sibling.category}/${sibling.slug}`,
    });
  }
  links.push({ label: L("Готові ракетки у зборі", "Готовые ракетки в сборе"), href: `/${locale}/rakety` });
  links.push({ label: L("Накладки Butterfly", "Накладки Butterfly"), href: `/${locale}/nakladki` });

  return (
    <div className="mt-14 space-y-10 border-t border-border-subtle pt-10 sm:mt-16">
      {paras.length > 0 && (
        <section>
          <div className="max-w-[70ch] space-y-4">
            {paras.map((p, i) => (
              <p key={i} className="font-body text-[15px] leading-[1.75] text-white/80">
                {p}
              </p>
            ))}
          </div>
        </section>
      )}
      {faq.length > 0 && (
        <section>
          <h2 className={h2}>{L("Питання й відповіді", "Вопросы и ответы")}</h2>
          <div className="mt-5 divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border-strong">
            {faq.map((f, i) => (
              <details key={i} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 font-body text-[15px] font-medium text-white/90 [&::-webkit-details-marker]:hidden">
                  <span>{pickLocalized(f.q, locale)}</span>
                  <span className="shrink-0 text-xl leading-none text-accent transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="px-4 pb-4 font-body text-sm leading-[1.7] text-white/75">
                  {pickLocalized(f.a, locale)}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}
      <section>
        <div className="mb-3 font-display text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">
          {L("Дивіться також", "Смотрите также")}
        </div>
        <div className="flex flex-wrap gap-2.5">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full border border-border-strong bg-white/[0.02] px-4 py-2 font-display text-xs font-bold uppercase tracking-[0.04em] text-white/85 transition-colors hover:border-accent/40 hover:text-accent"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
