// /ua/vidguky, /ru/vidguky — відгуки про магазин + останні відгуки про товари.
//
// ⚠️ Без AggregateRating у розмітці — свідомо. Відгуки про магазин на сайті самого
// магазину Google вважає «self-serving» і зірок для Organization/LocalBusiness не показує;
// така розмітка лише ризикує ручною санкцією. Зірки працюють на картках товарів
// (Product.aggregateRating) і в Google — через Google Customer Reviews / профіль компанії.
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { buildCatalogMetadata } from "@/lib/seo/catalog-metadata";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { Container, Section } from "@/components/ui/Section";
import { getLatestProductReviews, getStoreReviews, summarize } from "@/lib/reviews/data";
import { ReviewItem, ReviewSummaryCard } from "@/components/reviews/ReviewsSection";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { REVIEW_T } from "@/components/reviews/strings";
import { getProductBySlug } from "@/data/catalog";
import { isReviewsConfigured } from "@/lib/reviews/secret";

const META = {
  ua: {
    title: "Відгуки про магазин TTMAX — Butterfly в Україні",
    description:
      "⭐ Відгуки покупців TTMAX про замовлення, доставку й обслуговування, а також відгуки про накладки, основи та екіпірування Butterfly. Залиште свій.",
    h1: "Відгуки про TTMAX",
    lead: "Тут покупці розповідають, як пройшли замовлення й доставка. Відгуки публікуємо після перевірки — без вибору «лише хороших»: прибираємо тільки спам і образи.",
    latest: "Останні відгуки про товари",
  },
  ru: {
    title: "Отзывы о магазине TTMAX — Butterfly в Украине",
    description:
      "⭐ Отзывы покупателей TTMAX о заказе, доставке и обслуживании, а также отзывы о накладках, основаниях и экипировке Butterfly. Оставьте свой.",
    h1: "Отзывы о TTMAX",
    lead: "Здесь покупатели рассказывают, как прошли заказ и доставка. Отзывы публикуем после проверки — без отбора «только хороших»: убираем лишь спам и оскорбления.",
    latest: "Последние отзывы о товарах",
  },
} as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: l } = await params;
  if (!isLocale(l)) return {};
  return buildCatalogMetadata({
    locale: l,
    pathname: "/vidguky",
    title: META[l].title,
    description: META[l].description,
  });
}

export default async function ReviewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale: Locale = l;
  const m = META[locale];
  const t = REVIEW_T[locale];

  const [store, latest] = await Promise.all([getStoreReviews(), getLatestProductReviews()]);
  const summary = summarize(store);
  const crumbsLd = breadcrumbJsonLd(
    [
      { name: locale === "ru" ? "Главная" : "Головна", path: "/" },
      { name: m.h1, path: "/vidguky" },
    ],
    locale,
  );

  return (
    <Section as="div" className="pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbsLd) }} />
      <Container>
        <h1 className="font-display text-3xl font-black uppercase leading-[1.05] tracking-tight sm:text-4xl">{m.h1}</h1>
        <p className="mt-4 max-w-[70ch] font-body text-[15px] leading-relaxed text-ink-muted">{m.lead}</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="min-w-0">
            <h2 className="mb-4 font-display text-lg font-bold uppercase tracking-[0.04em] text-ink">{t.storeTitle}</h2>
            {summary.count > 0 ? (
              <>
                <ReviewSummaryCard summary={summary} locale={locale} />
                <div className="mt-2">
                  {store.map((r) => (
                    <ReviewItem key={r.id} r={r} locale={locale} />
                  ))}
                </div>
              </>
            ) : (
              <p className="font-body text-[15px] text-ink-muted">{t.emptyStore}</p>
            )}
          </div>
          {isReviewsConfigured() && (
            <div className="rounded-2xl border border-border-strong bg-white/[0.02] p-5 lg:self-start">
              <h2 className="mb-4 font-display text-base font-bold uppercase tracking-[0.04em] text-ink">{t.write}</h2>
              <ReviewForm kind="store" locale={locale} />
            </div>
          )}
        </div>

        {latest.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-2 font-display text-lg font-bold uppercase tracking-[0.04em] text-ink">{m.latest}</h2>
            <div className="max-w-[80ch]">
              {latest.map((r) => {
                const p = r.productSlug ? getProductBySlug(r.productSlug) : undefined;
                return (
                  <ReviewItem
                    key={r.id}
                    r={r}
                    locale={locale}
                    productLink={
                      p ? { name: p.name[locale], href: `/${locale}/${p.brandSlug}/${p.categorySlug}/${p.slug}#reviews` } : null
                    }
                  />
                );
              })}
            </div>
          </section>
        )}

        <p className="mt-10 font-body text-[13px] text-ink-dim">
          <Link href={`/${locale}/nakladki`} className="text-accent hover:underline">
            {locale === "ru" ? "Каталог накладок Butterfly" : "Каталог накладок Butterfly"}
          </Link>
          {" · "}
          <Link href={`/${locale}/osnovaniya`} className="text-accent hover:underline">
            {locale === "ru" ? "Основания Butterfly" : "Основи Butterfly"}
          </Link>
        </p>
      </Container>
    </Section>
  );
}
