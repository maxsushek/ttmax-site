// Розмірна сітка Butterfly: офіційні таблиці розмірів одягу, взуття й аксесуарів.
// Дані, правила й причини — у src/data/sizeCharts.ts (числа лише з першоджерел Butterfly).
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, localeToLang, type Locale } from "@/i18n/config";
import { buildBlogMetadata } from "@/lib/seo/blog-metadata";
import { breadcrumbJsonLd, faqJsonLd, howToJsonLd } from "@/lib/seo/jsonld";
import { orgId, websiteId, ref } from "@/lib/seo/ids";
import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/Section";
import { SIZE_CHARTS, SIZE_CHART_PATH, getSizeChart, hasSizeCharts, type SizeChart } from "@/data/sizeCharts";
import { SizeChartTable } from "@/components/content/SizeChartTable";
import { fmtDate } from "@/components/content/PlayerProfileView";

export const revalidate = false;

const T = {
  ua: {
    home: "Головна",
    crumb: "Розмірна сітка",
    updated: "Звірено з джерелами",
    contents: "Зміст",
    source: "Джерело",
    sources: "Джерела",
    official: "офіційне джерело Butterfly",
    dealer: "офіційний дилер Butterfly",
    snapshot: "архівна копія від",
    faq: "Питання й відповіді",
    catalog: "У каталозі",
    howToAnchor: "Як обрати розмір",
  },
  ru: {
    home: "Главная",
    crumb: "Размерная сетка",
    updated: "Сверено с источниками",
    contents: "Содержание",
    source: "Источник",
    sources: "Источники",
    official: "официальный источник Butterfly",
    dealer: "официальный дилер Butterfly",
    snapshot: "архивная копия от",
    faq: "Вопросы и ответы",
    catalog: "В каталоге",
    howToAnchor: "Как выбрать размер",
  },
} satisfies Record<Locale, Record<string, string>>;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: l } = await params;
  if (!isLocale(l) || !hasSizeCharts()) return {};
  return buildBlogMetadata({
    locale: l,
    pathname: SIZE_CHART_PATH,
    title: SIZE_CHARTS.page.metaTitle[l],
    description: SIZE_CHARTS.page.metaDescription[l],
  });
}

/** Унікальні джерела всіх таблиць — для підсумкового списку й `citation` у розмітці. */
function allSources(): SizeChart["sources"] {
  const seen = new Set<string>();
  const out: SizeChart["sources"] = [];
  for (const c of SIZE_CHARTS.charts) {
    for (const s of c.sources) {
      if (seen.has(s.url)) continue;
      seen.add(s.url);
      out.push(s);
    }
  }
  // Офіційні — першими.
  return out.sort((a, b) => Number(b.official) - Number(a.official));
}

/** «(архівна копія від 18.05.2024)» — з посиланням на саму копію, за якою звіряли числа. */
function Snapshot({ source, locale }: { source: SizeChart["sources"][number]; locale: Locale }) {
  if (!source.snapshot) return null;
  const label = `${T[locale].snapshot} ${fmtDate(source.snapshot)}`;
  return (
    <>
      {" ("}
      {source.archiveUrl ? (
        <a href={source.archiveUrl} target="_blank" rel="noopener nofollow" className="underline underline-offset-2 hover:text-ink">
          {label}
        </a>
      ) : (
        label
      )}
      {")"}
    </>
  );
}

function SourceLine({ chart, locale }: { chart: SizeChart; locale: Locale }) {
  const t = T[locale];
  return (
    <p className="mt-2 font-body text-[12px] leading-relaxed text-ink-dim">
      {t.source}:{" "}
      {chart.sources.map((s, i) => (
        <span key={s.url}>
          {i > 0 && "; "}
          <a href={s.url} target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-ink">
            {s.label[locale]}
          </a>
          <Snapshot source={s} locale={locale} />
        </span>
      ))}
    </p>
  );
}

export default async function SizeChartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  if (!isLocale(l) || !hasSizeCharts()) notFound();
  const locale: Locale = l;
  const t = T[locale];
  const { page, sections, checked } = SIZE_CHARTS;
  const url = `${siteConfig.url}/${locale}${SIZE_CHART_PATH}`;
  const sources = allSources();

  const breadcrumb = breadcrumbJsonLd(
    [
      { name: t.home, path: "/" },
      { name: t.crumb, path: SIZE_CHART_PATH },
    ],
    locale,
  );
  // Сторінка-довідник: дата звірки й першоджерела — у машиночитному вигляді (dateModified, citation).
  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: page.h1[locale],
    description: page.intro[locale][0],
    inLanguage: localeToLang[locale],
    dateModified: checked,
    isPartOf: ref(websiteId()),
    publisher: ref(orgId()),
    about: { "@type": "Brand", name: "Butterfly" },
    citation: sources.filter((s) => s.official).map((s) => s.url),
  };
  const faq = page.faq.length > 0 ? faqJsonLd(page.faq.map((f) => ({ q: f.q[locale], a: f.a[locale] }))) : null;
  // ⚠️ Кроки HowTo видимі на сторінці тим самим текстом (id="krok-N") — вимога до розмітки.
  const howTo = howToJsonLd({
    url,
    name: page.howToTitle[locale],
    inLanguage: localeToLang[locale],
    steps: page.howTo.map((s) => ({ name: s.name[locale], text: s.text[locale] })),
  });

  return (
    <div className="py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPage) }} />
      {faq && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />}
      {howTo && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }} />}
      <Container className="max-w-4xl">
        <nav className="font-body text-[13px] text-ink-muted" aria-label="breadcrumb">
          <Link href={`/${locale}`} className="hover:text-ink">
            {t.home}
          </Link>{" "}
          / <span className="text-ink">{t.crumb}</span>
        </nav>
        <h1 className="mt-3 text-balance font-display text-display-md font-black uppercase">{page.h1[locale]}</h1>
        <div className="mt-4 flex max-w-3xl flex-col gap-3">
          {page.intro[locale].map((para, i) => (
            <p
              key={i}
              className={`font-body leading-relaxed ${i === 0 ? "text-[16px] text-ink" : "text-[15px] text-ink-muted"}`}
            >
              {para}
            </p>
          ))}
        </div>
        <p className="mt-3 font-body text-[12px] text-ink-dim">
          {t.updated}: <time dateTime={checked}>{fmtDate(checked)}</time>
        </p>

        {/* Зміст: розділи + «як обрати розмір». */}
        <nav aria-label={t.contents}>
          <ul className="mt-6 flex flex-wrap gap-2">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="inline-block rounded-full border border-border-subtle px-3 py-1.5 font-body text-[13px] text-ink-muted transition-colors hover:border-accent/50 hover:text-ink"
                >
                  {s.title[locale]}
                </a>
              </li>
            ))}
            {page.howTo.length > 0 && (
              <li>
                <a
                  href="#yak-obraty-rozmir"
                  className="inline-block rounded-full border border-border-subtle px-3 py-1.5 font-body text-[13px] text-ink-muted transition-colors hover:border-accent/50 hover:text-ink"
                >
                  {t.howToAnchor}
                </a>
              </li>
            )}
          </ul>
        </nav>

        {sections.map((s) => (
          <section key={s.id} id={s.id} className="mt-12 scroll-mt-24">
            <h2 className="font-display text-xl font-black uppercase sm:text-2xl">{s.title[locale]}</h2>
            {s.text && (
              <p className="mt-3 max-w-3xl font-body text-[15px] leading-relaxed text-ink-muted">{s.text[locale]}</p>
            )}
            {s.charts.map((id) => {
              const chart = getSizeChart(id);
              if (!chart) return null;
              return (
                <div key={id} id={id} className="mt-7 scroll-mt-24">
                  <h3 className="font-display text-[17px] font-bold text-ink">{chart.title[locale]}</h3>
                  <p className="mt-1.5 max-w-3xl font-body text-[14px] leading-relaxed text-ink-muted">
                    {chart.lead[locale]}
                  </p>
                  <div className="mt-3">
                    <SizeChartTable chart={chart} locale={locale} />
                  </div>
                  {chart.note && (
                    <p className="mt-3 max-w-3xl rounded-xl border-l-2 border-accent bg-white/[0.03] px-4 py-2.5 font-body text-[13px] leading-relaxed text-ink-muted">
                      {chart.note[locale]}
                    </p>
                  )}
                  <SourceLine chart={chart} locale={locale} />
                </div>
              );
            })}
            {s.links.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="font-body text-[13px] text-ink-dim">{t.catalog}:</span>
                {s.links.map((lnk) => (
                  <Link
                    key={lnk.href}
                    href={`/${locale}${lnk.href}`}
                    prefetch={false}
                    className="rounded-full border border-border-subtle px-3 py-1.5 font-body text-[13px] text-ink-muted transition-colors hover:border-accent/50 hover:text-ink"
                  >
                    {lnk.label[locale]}
                  </Link>
                ))}
              </div>
            )}
          </section>
        ))}

        {page.howTo.length > 0 && (
          <section id="yak-obraty-rozmir" className="mt-12 scroll-mt-24">
            <h2 className="font-display text-xl font-black uppercase sm:text-2xl">{page.howToTitle[locale]}</h2>
            <ol className="mt-5 flex flex-col gap-3">
              {page.howTo.map((st, k) => (
                <li
                  key={k}
                  id={`krok-${k + 1}`}
                  className="flex scroll-mt-24 gap-3.5 rounded-xl border border-border-subtle bg-bg-raised px-4 py-3.5"
                >
                  <span
                    aria-hidden
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent font-display text-[13px] font-black text-bg-base"
                  >
                    {k + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-body text-[15px] font-bold text-ink">{st.name[locale]}</span>
                    <span className="mt-1 block font-body text-[14px] leading-relaxed text-ink-muted">
                      {st.text[locale]}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {page.faq.length > 0 && (
          <section id="faq" className="mt-12 scroll-mt-24">
            <h2 className="font-display text-xl font-black uppercase sm:text-2xl">{t.faq}</h2>
            <div className="mt-4 flex flex-col gap-5">
              {page.faq.map((f, i) => (
                <div key={i}>
                  <h3 className="mb-1 font-body text-[15px] font-bold text-ink">{f.q[locale]}</h3>
                  <p className="font-body text-[14px] leading-relaxed text-ink-muted">{f.a[locale]}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12 border-t border-border-subtle pt-5">
          <h2 className="font-display text-[12px] font-bold uppercase tracking-[0.1em] text-ink-muted">{t.sources}</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {sources.map((s) => (
              <li key={s.url} className="font-body text-[13px] text-ink-muted">
                <a href={s.url} target="_blank" rel="noopener" className="hover:text-ink hover:underline">
                  {s.label[locale]}
                </a>{" "}
                <span className="text-ink-dim">
                  — {s.official ? t.official : t.dealer}
                  <Snapshot source={s} locale={locale} />
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 font-body text-[12px] text-ink-dim">
            {t.updated}: {fmtDate(checked)}
          </p>
        </section>
      </Container>
    </div>
  );
}
