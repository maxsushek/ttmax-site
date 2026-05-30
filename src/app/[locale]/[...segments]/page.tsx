// src/app/[locale]/[...segments]/page.tsx
// Catch-all каталога: /{category}, /{brand}, /{brand}/{category}, /{brand}/{category}/{product}.
// Не перехватывает главную (/{locale}) и имеет низший приоритет, поэтому ничего существующего не ломает.
// Шаг 3B = дизайн витрины каталога + интерактивный выбор цвета/толщины и «В кошик».
// Картинки (Cloudinary) и фасетные фильтры — следующие шаги.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/Section";
import { isLocale, type Locale } from "@/i18n/config";
import { getBrandBySlug, getCrossSell, getMinPrice, isInStock } from "@/data/catalog";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/utils/format";
import type { CatalogProduct } from "@/types/catalog";
import type { ProductCategory } from "@/types";
import { ProductPurchasePanel } from "@/components/catalog/ProductPurchasePanel";
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

  const crumbs = catalogBreadcrumbs(route, locale);

  return (
    <Section as="div" className="pt-10">
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

        {route.kind === "product" ? (
          <ProductView route={route} locale={locale} />
        ) : (
          <ListingView route={route} locale={locale} />
        )}
      </Container>
    </Section>
  );
}

/* ---------------- Витрина-листинг (категория / бренд / бренд×категория) ---------------- */

function ListingView({
  route,
  locale,
}: {
  route: Exclude<CatalogRoute, { kind: "product" }>;
  locale: Locale;
}) {
  const intro =
    route.kind === "category"
      ? route.category.intro
      : route.kind === "brand"
        ? route.brand.intro
        : undefined;

  const count =
    route.kind === "category" || route.kind === "brandCategory" ? route.products.length : null;

  return (
    <>
      <header className="mb-9 max-w-3xl">
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-balance sm:text-[42px] sm:leading-[1.05]">
          {routeH1(route, locale)}
        </h1>
        {intro && (
          <p className="mt-4 font-body text-sm leading-relaxed text-ink-muted">
            {pickLocalized(intro, locale)}
          </p>
        )}
        {count !== null && count > 0 && (
          <p className="mt-4 font-display text-xs font-bold uppercase tracking-[0.12em] text-ink-dim">
            {count}
            {pluralProducts(count, locale)}
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
      ) : (
        <ProductGrid products={route.products} locale={locale} />
      )}
    </>
  );
}

function pluralProducts(_n: number, locale: Locale): string {
  return locale === "ru" ? " товаров" : " товарів";
}

function ProductGrid({ products, locale }: { products: CatalogProduct[]; locale: Locale }) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-white/[0.015] p-10 text-center">
        <p className="font-body text-sm text-ink-muted">{catalogUi.emptySoon[locale]}</p>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      {products.map((p) => (
        <li key={p.slug} className="h-full">
          <ProductCard product={p} locale={locale} />
        </li>
      ))}
    </ul>
  );
}

function ProductCard({ product, locale }: { product: CatalogProduct; locale: Locale }) {
  const price = getMinPrice(product);
  const brandName = getBrandBySlug(product.brandSlug)?.name ?? product.brandSlug;

  return (
    <Link
      href={`/${locale}/${product.brandSlug}/${product.categorySlug}/${product.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-[18px] border border-border-strong bg-bg-raised p-3 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:bg-bg-elevated hover:shadow-card-hover sm:p-4"
      data-cta="catalog-product"
      data-location={product.slug}
    >
      {/* Плейсхолдер изображения (фото — на шаге Cloudinary) */}
      <div
        aria-hidden
        className="relative mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03]"
      >
        <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-ink-ghost">
          {brandName}
        </span>
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
      <div className="mt-1 font-body text-[11px] text-ink-dim">
        {labelFor("surfaceType", product.surfaceType, locale)}
      </div>

      <div className="mt-auto pt-3 font-display text-sm font-black text-accent">
        {price !== undefined
          ? `${catalogUi.from[locale]} ${formatPrice(price)}`
          : catalogUi.priceOnRequest[locale]}
      </div>
    </Link>
  );
}

/* ---------------- Страница товара ---------------- */

function ProductView({
  route,
  locale,
}: {
  route: Extract<CatalogRoute, { kind: "product" }>;
  locale: Locale;
}) {
  const product = route.product;
  const brandName = getBrandBySlug(product.brandSlug)?.name ?? product.brandSlug;
  const related = getCrossSell(product);
  void isInStock(product);

  const specRows: { label: string; value: string }[] = [
    { label: catalogUi.surface[locale], value: labelFor("surfaceType", product.surfaceType, locale) },
  ];
  if (product.specs.speed !== undefined)
    specRows.push({ label: catalogUi.speed[locale], value: String(product.specs.speed) });
  if (product.specs.spin !== undefined)
    specRows.push({ label: catalogUi.spin[locale], value: String(product.specs.spin) });
  if (product.specs.arc !== undefined)
    specRows.push({ label: catalogUi.arc[locale], value: String(product.specs.arc) });
  if (product.specs.hardnessDeg !== undefined)
    specRows.push({ label: catalogUi.hardness[locale], value: `${product.specs.hardnessDeg}°` });
  specRows.push({ label: catalogUi.level[locale], value: labelFor("level", product.level, locale) });

  const cartCategory = CART_CATEGORY[product.categorySlug] ?? "rubber";

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      {/* Левая колонка: визуал */}
      <div>
        <div
          aria-hidden
          className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[28px] border border-border-strong bg-white/[0.03]"
        >
          <div className="pointer-events-none absolute right-[18%] top-0 h-full w-px bg-[linear-gradient(to_bottom,transparent,rgba(232,255,71,0.12)_45%,transparent)] [transform:skewX(-18deg)]" />
          <span className="font-display text-sm font-bold uppercase tracking-[0.3em] text-ink-ghost">
            {brandName}
          </span>
        </div>
      </div>

      {/* Правая колонка: бренд + h1 + покупка */}
      <div>
        <div className="font-display text-xs font-bold uppercase tracking-[0.16em] text-ink-muted">
          {brandName}
        </div>
        <h1 className="mt-1.5 font-display text-3xl font-black uppercase leading-[1.05] tracking-tight sm:text-4xl">
          {routeH1(route, locale)}
        </h1>

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
          />
        </div>

        {/* Характеристики */}
        <div className="mt-9">
          <h2 className="mb-3 font-display text-base font-bold uppercase tracking-[0.04em] text-ink">
            {catalogUi.specs[locale]}
          </h2>
          <dl className="overflow-hidden rounded-2xl border border-border-strong">
            {specRows.map((r, i) => (
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
        </div>
      </div>

      {/* Сопутствующие */}
      {related.length > 0 && (
        <div className="lg:col-span-2">
          <h2 className="mb-5 mt-2 font-display text-lg font-bold uppercase tracking-[0.04em]">
            {catalogUi.related[locale]}
          </h2>
          <ProductGrid products={related} locale={locale} />
        </div>
      )}
    </div>
  );
}
