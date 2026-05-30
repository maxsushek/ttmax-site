// src/app/[locale]/[...segments]/page.tsx
// Catch-all каталога: /{category}, /{brand}, /{brand}/{category}, /{brand}/{category}/{product}.
// Не перехватывает главную (/{locale}) и имеет низший приоритет, поэтому ничего существующего не ломает.
// Шаг 2 = корректные роуты + метаданные + минимальный серверный рендер. Вёрстка/корзина/картинки — следующие шаги.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/Section";
import { isLocale, type Locale } from "@/i18n/config";
import { getBrandBySlug, getCrossSell, getMinPrice } from "@/data/catalog";
import type { CatalogProduct } from "@/types/catalog";
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
        <nav aria-label="breadcrumb" className="mb-6 text-xs text-ink-muted">
          {crumbs.map((c, i) => (
            <span key={c.path}>
              {i > 0 && <span className="mx-1.5">/</span>}
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

        <h1 className="mb-6 font-display text-3xl font-black uppercase sm:text-4xl">
          {routeH1(route, locale)}
        </h1>

        <RouteBody route={route} locale={locale} />
      </Container>
    </Section>
  );
}

function RouteBody({ route, locale }: { route: CatalogRoute; locale: Locale }) {
  switch (route.kind) {
    case "category":
      return (
        <>
          {route.category.intro && (
            <p className="mb-8 max-w-2xl text-sm text-ink-muted">
              {pickLocalized(route.category.intro, locale)}
            </p>
          )}
          <ProductGrid products={route.products} locale={locale} />
        </>
      );
    case "brand":
      return (
        <>
          {route.brand.intro && (
            <p className="mb-8 max-w-2xl text-sm text-ink-muted">
              {pickLocalized(route.brand.intro, locale)}
            </p>
          )}
          <ul className="flex flex-wrap gap-3">
            {route.categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/${locale}/${route.brand.slug}/${c.slug}`}
                  className="inline-flex rounded-xl border border-white/15 px-4 py-2 text-sm text-ink transition-colors hover:border-accent/60 hover:text-accent"
                >
                  {pickLocalized(c.name, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </>
      );
    case "brandCategory":
      return <ProductGrid products={route.products} locale={locale} />;
    case "product":
      return <ProductView product={route.product} locale={locale} />;
  }
}

function ProductGrid({ products, locale }: { products: CatalogProduct[]; locale: Locale }) {
  if (products.length === 0) {
    return <p className="text-sm text-ink-muted">{catalogUi.emptySoon[locale]}</p>;
  }
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => {
        const price = getMinPrice(p);
        const brandName = getBrandBySlug(p.brandSlug)?.name ?? p.brandSlug;
        return (
          <li
            key={p.slug}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-accent/40"
          >
            <Link href={`/${locale}/${p.brandSlug}/${p.categorySlug}/${p.slug}`} className="block">
              <div className="mb-3 aspect-square rounded-xl bg-white/5" aria-hidden />
              <div className="text-[11px] uppercase tracking-wide text-ink-muted">{brandName}</div>
              <div className="font-display font-bold text-ink">{p.model}</div>
              <div className="mt-1 text-xs text-ink-muted">
                {labelFor("surfaceType", p.surfaceType, locale)}
              </div>
              <div className="mt-2 text-sm font-bold text-accent">
                {price !== undefined
                  ? `${catalogUi.from[locale]} ${price} ${catalogUi.uah[locale]}`
                  : catalogUi.priceOnRequest[locale]}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ProductView({ product, locale }: { product: CatalogProduct; locale: Locale }) {
  const price = getMinPrice(product);
  const brandName = getBrandBySlug(product.brandSlug)?.name ?? product.brandSlug;
  const related = getCrossSell(product);

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

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="aspect-square rounded-3xl bg-white/5" aria-hidden />

      <div>
        <div className="text-sm uppercase tracking-wide text-ink-muted">{brandName}</div>
        <div className="mb-5 mt-1 text-2xl font-bold text-accent">
          {price !== undefined
            ? `${price} ${catalogUi.uah[locale]}`
            : catalogUi.priceOnRequest[locale]}
        </div>

        <div className="mb-4">
          <div className="mb-2 text-[11px] uppercase tracking-wide text-ink-muted">
            {catalogUi.colors[locale]}
          </div>
          <div className="flex gap-2">
            {product.colors.map((c) => (
              <span
                key={c}
                className="rounded-lg border border-white/15 px-3 py-1 text-sm text-ink"
              >
                {labelFor("color", c, locale)}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-2 text-[11px] uppercase tracking-wide text-ink-muted">
            {catalogUi.thickness[locale]}
          </div>
          <div className="flex flex-wrap gap-2">
            {product.thicknessOptions.map((t) => (
              <span
                key={t}
                className="rounded-lg border border-white/15 px-3 py-1 text-sm text-ink"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <p className="mb-6 text-xs text-ink-muted">{catalogUi.chooseInStep3[locale]}</p>

        <h2 className="mb-3 font-display text-lg font-bold uppercase">{catalogUi.specs[locale]}</h2>
        <table className="w-full text-sm">
          <tbody>
            {specRows.map((r) => (
              <tr key={r.label} className="border-b border-white/10">
                <td className="py-2 text-ink-muted">{r.label}</td>
                <td className="py-2 text-right text-ink">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {related.length > 0 && (
        <div className="lg:col-span-2">
          <h2 className="mb-4 mt-2 font-display text-lg font-bold uppercase">
            {catalogUi.related[locale]}
          </h2>
          <ProductGrid products={related} locale={locale} />
        </div>
      )}
    </div>
  );
}
