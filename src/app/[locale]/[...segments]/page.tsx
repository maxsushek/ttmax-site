// src/app/[locale]/[...segments]/page.tsx
// Catch-all каталога: /{category}, /{brand}, /{brand}/{category}, /{brand}/{category}/{product}.
// Не перехватывает главную (/{locale}) и имеет низший приоритет, поэтому ничего существующего не ломает.
// Поддержка двух видов товара: накладки (kind: "rubber") и основания (kind: "base").
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/Section";
import { isLocale, type Locale } from "@/i18n/config";
import { getBrandBySlug, getCrossSell, getMinPrice, isInStock } from "@/data/catalog";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/utils/format";
import type { CatalogProduct, BladeClass, BladeSurface } from "@/types/catalog";
import type { ProductCategory } from "@/types";
import { ProductPurchasePanel } from "@/components/catalog/ProductPurchasePanel";
import { BasePurchasePanel } from "@/components/catalog/BasePurchasePanel";
import {
  CatalogFilters,
  type CatalogCardVM,
  type FacetGroup,
} from "@/components/catalog/CatalogFilters";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/jsonld";
import { getOverrides, applyOverrides, type OverridesMap } from "@/lib/catalog/overrides";
import { getMediaMap, pickPrimary, type EntityMediaMap } from "@/lib/media/get";
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
  type CatalogRoute,
} from "@/lib/catalog/routing";
import { buildCatalogMetadata } from "@/lib/seo/catalog-metadata";

export const dynamicParams = true;

// ISR: фото из админки появляются без передеплоя (кеш медиа инвалидируется тегом + revalidate).
export const revalidate = 600;

export function generateStaticParams() {
  return catalogStaticParams();
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
  return buildCatalogMetadata({
    locale: l,
    pathname: "/" + segments.join("/"),
    title: routeTitle(route, l),
    description: routeDescription(route, l),
    index: route.index,
  });
}

/** Категория каталога → showcase-категория корзины (для лейбла в корзине). */
const CART_CATEGORY: Record<string, ProductCategory> = {
  nakladki: "rubber",
  osnovaniya: "base",
  myachi: "ball",
  odyag: "apparel",
};

/* Подписи характеристик основания (клас / тип волокна). */
const BLADE_CLASS_LABEL: Record<BladeClass, { uk: string; ru: string }> = {
  "off-plus": { uk: "OFF+ · атака", ru: "OFF+ · атака" },
  off: { uk: "OFF", ru: "OFF" },
  "off-minus": { uk: "OFF− · універсал", ru: "OFF− · универсал" },
  "all-plus": { uk: "ALL+", ru: "ALL+" },
  all: { uk: "ALL · контроль", ru: "ALL · контроль" },
  def: { uk: "DEF · захист", ru: "DEF · защита" },
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

  const crumbs = catalogBreadcrumbs(route, locale);
  const breadcrumbLd = breadcrumbJsonLd(crumbs, locale);
  const productLd =
    eroute.kind === "product"
      ? productJsonLd({
          name: pickLocalized(eroute.product.name, locale),
          description: routeDescription(eroute, locale),
          url: `${siteConfig.url}/${locale}/${eroute.product.brandSlug}/${eroute.product.categorySlug}/${eroute.product.slug}`,
          brand: getBrandBySlug(eroute.product.brandSlug)?.name ?? eroute.product.brandSlug,
          price: getMinPrice(eroute.product),
          currency: "UAH",
          inStock: isInStock(eroute.product),
        })
      : null;

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
          <ProductView route={eroute} locale={locale} media={media} />
        ) : (
          <ListingView route={eroute} locale={locale} media={media} />
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
}: {
  route: Exclude<CatalogRoute, { kind: "product" }>;
  locale: Locale;
  media: EntityMediaMap;
}) {
  const intro =
    route.kind === "category"
      ? route.category.intro
      : route.kind === "brand"
        ? route.brand.intro
        : undefined;

  return (
    <>
      <header className="mb-9 max-w-3xl">
        <h1 className="text-balance font-display text-3xl font-black uppercase tracking-tight sm:text-[42px] sm:leading-[1.05]">
          {routeH1(route, locale)}
        </h1>
        {intro && (
          <p className="mt-4 font-body text-sm leading-relaxed text-ink-muted">
            {pickLocalized(intro, locale)}
          </p>
        )}
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
      ) : (
        <CatalogFilters
          locale={locale}
          items={buildCardVMs(route.products, locale, media)}
          groups={buildFacetGroups(route.products, locale)}
          priceBuckets={buildPriceBuckets(route.products, locale)}
        />
      )}
    </>
  );
}

/** Вторичная строка карточки: для основания — клас, для накладки — тип поверхности. */
function cardSecondary(product: CatalogProduct, locale: Locale): string {
  if (product.base) return BLADE_CLASS_LABEL[product.base.bladeClass][locale];
  if (product.surfaceType) return labelFor("surfaceType", product.surfaceType, locale);
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
        level: p.level,
      },
      order: i,
    };
  });
}

/** Динамические фасеты: только значения, реально присутствующие в списке. */
function buildFacetGroups(products: CatalogProduct[], locale: Locale): FacetGroup[] {
  const isBases = products.some((p) => p.base);
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
}: {
  route: Extract<CatalogRoute, { kind: "product" }>;
  locale: Locale;
  media: EntityMediaMap;
}) {
  return route.product.base ? (
    <BaseView route={route} locale={locale} media={media} />
  ) : (
    <RubberView route={route} locale={locale} media={media} />
  );
}

function ProductShell({
  brandName,
  h1,
  visualLabel,
  imageUrl,
  imageAlt,
  children,
  related,
  locale,
  media,
}: {
  brandName: string;
  h1: string;
  visualLabel: string;
  imageUrl: string | null;
  imageAlt: string;
  children: React.ReactNode;
  related: CatalogProduct[];
  locale: Locale;
  media: EntityMediaMap;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div>
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[28px] border border-border-strong bg-white/[0.03]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            <>
              <div className="pointer-events-none absolute right-[18%] top-0 h-full w-px bg-[linear-gradient(to_bottom,transparent,rgba(232,255,71,0.12)_45%,transparent)] [transform:skewX(-18deg)]" />
              <span className="font-display text-sm font-bold uppercase tracking-[0.3em] text-ink-ghost">
                {visualLabel}
              </span>
            </>
          )}
        </div>
      </div>

      <div>
        <div className="font-display text-xs font-bold uppercase tracking-[0.16em] text-ink-muted">
          {brandName}
        </div>
        <h1 className="mt-1.5 font-display text-3xl font-black uppercase leading-[1.05] tracking-tight sm:text-4xl">
          {h1}
        </h1>
        {children}
      </div>

      {related.length > 0 && (
        <div className="lg:col-span-2">
          <h2 className="mb-5 mt-2 font-display text-lg font-bold uppercase tracking-[0.04em]">
            {catalogUi.related[locale]}
          </h2>
          <ProductGrid products={related} locale={locale} media={media} />
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
}: {
  route: Extract<CatalogRoute, { kind: "product" }>;
  locale: Locale;
  media: EntityMediaMap;
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

  return (
    <ProductShell
      brandName={brandName}
      h1={routeH1(route, locale)}
      visualLabel={brandName}
      imageUrl={img ? cldUrl(img.publicId, { w: 900, h: 900 }) : null}
      imageAlt={img?.alt ?? `${brandName} ${product.model}`}
      related={related}
      locale={locale}
      media={media}
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

function BaseView({
  route,
  locale,
  media,
}: {
  route: Extract<CatalogRoute, { kind: "product" }>;
  locale: Locale;
  media: EntityMediaMap;
}) {
  const product = route.product;
  const base = product.base!;
  const brandName = getBrandBySlug(product.brandSlug)?.name ?? product.brandSlug;
  const related = getCrossSell(product);
  const img = pickPrimary(media, "product", product.slug);

  const L = (uk: string, ru: string) => (locale === "ru" ? ru : uk);
  const rows: { label: string; value: string }[] = [
    { label: L("Клас", "Класс"), value: BLADE_CLASS_LABEL[base.bladeClass][locale] },
    { label: L("Тип основи", "Тип основания"), value: BLADE_SURFACE_LABEL[base.surface] },
  ];
  if (base.plies) rows.push({ label: L("Шари", "Слои"), value: base.plies });
  if (base.weightG) rows.push({ label: L("Вага", "Вес"), value: `${base.weightG} г` });
  rows.push({ label: catalogUi.level[locale], value: labelFor("level", product.level, locale) });

  const cartCategory = CART_CATEGORY[product.categorySlug] ?? "base";

  return (
    <ProductShell
      brandName={brandName}
      h1={routeH1(route, locale)}
      visualLabel={brandName}
      imageUrl={img ? cldUrl(img.publicId, { w: 900, h: 900 }) : null}
      imageAlt={img?.alt ?? `${brandName} ${product.model}`}
      related={related}
      locale={locale}
      media={media}
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
