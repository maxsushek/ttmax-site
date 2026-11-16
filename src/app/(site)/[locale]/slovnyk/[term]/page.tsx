// Окрема сторінка терміна словника: /{locale}/slovnyk/{slug}.
// ⚠️ Існує лише для термінів із полем `page` (див. src/data/glossary.ts): терміни, що мають
// власну статтю чи хаб, окремих сторінок не отримують — щоб не конкурувати зі статтями.
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, localeToLang, locales, type Locale } from "@/i18n/config";
import { buildBlogMetadata } from "@/lib/seo/blog-metadata";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/jsonld";
import { orgId, ref } from "@/lib/seo/ids";
import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/Section";
import { GLOSSARY_CHECKED, getGlossaryTerm, glossaryPages, glossaryTermPath } from "@/data/glossary";
import { fmtDate } from "@/components/content/PlayerProfileView";

export const revalidate = false;
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => glossaryPages().map((t) => ({ locale, term: t.slug })));
}

const T = {
  ua: {
    home: "Головна",
    crumb: "Словник",
    aka: "Також",
    faq: "Питання й відповіді",
    related: "Повʼязані терміни",
    more: "Читайте також",
    sources: "Джерела",
    updated: "Оновлено",
    all: "Усі терміни словника",
  },
  ru: {
    home: "Главная",
    crumb: "Словарь",
    aka: "Также",
    faq: "Вопросы и ответы",
    related: "Связанные термины",
    more: "Читайте также",
    sources: "Источники",
    updated: "Обновлено",
    all: "Все термины словаря",
  },
} satisfies Record<Locale, Record<string, string>>;

type Params = Promise<{ locale: string; term: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale: l, term } = await params;
  const g = getGlossaryTerm(term);
  if (!isLocale(l) || !g?.page) return {};
  return buildBlogMetadata({
    locale: l,
    pathname: `/slovnyk/${g.slug}`,
    title: g.page.metaTitle[l],
    description: g.page.metaDescription[l],
  });
}

export default async function GlossaryTermPage({ params }: { params: Params }) {
  const { locale: l, term } = await params;
  const g = getGlossaryTerm(term);
  if (!isLocale(l) || !g?.page) notFound();
  const locale: Locale = l;
  const t = T[locale];
  const page = g.page;
  const base = `${siteConfig.url}/${locale}/slovnyk`;
  const url = `${base}/${g.slug}`;

  const breadcrumb = breadcrumbJsonLd(
    [
      { name: t.home, path: "/" },
      { name: t.crumb, path: "/slovnyk" },
      { name: g.term[locale], path: `/slovnyk/${g.slug}` },
    ],
    locale,
  );
  const definedTerm = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "@id": `${url}#term`,
    name: g.term[locale],
    ...(g.aka[locale].length ? { alternateName: g.aka[locale] } : {}),
    description: g.def[locale],
    url,
    inLanguage: localeToLang[locale],
    inDefinedTermSet: ref(`${base}#set`),
    publisher: ref(orgId()),
  };
  const faq = page.faq.length > 0 ? faqJsonLd(page.faq.map((f) => ({ q: f.q[locale], a: f.a[locale] }))) : null;
  const related = page.related.map((s) => getGlossaryTerm(s)).filter((x) => x != null);

  return (
    <div className="py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTerm) }} />
      {faq && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />}
      <Container className="max-w-3xl">
        <nav className="font-body text-[13px] text-ink-muted" aria-label="breadcrumb">
          <Link href={`/${locale}`} className="hover:text-ink">
            {t.home}
          </Link>{" "}
          /{" "}
          <Link href={`/${locale}/slovnyk`} className="hover:text-ink">
            {t.crumb}
          </Link>{" "}
          / <span className="text-ink">{g.term[locale]}</span>
        </nav>
        <h1 className="mt-3 text-balance font-display text-3xl font-black uppercase leading-[1.05] sm:text-4xl">
          {page.h1[locale]}
        </h1>
        {g.aka[locale].length > 0 && (
          <p className="mt-2 font-body text-[13px] text-ink-dim">
            {t.aka}: {g.aka[locale].join(", ")}
          </p>
        )}

        {/* Коротке визначення — те саме, що в словнику й у розмітці DefinedTerm. */}
        <p className="mt-5 rounded-2xl border border-accent/25 bg-accent/[0.05] p-4 font-body text-[16px] leading-relaxed text-ink">
          <dfn className="not-italic">{g.def[locale]}</dfn>
        </p>

        <div className="mt-6 flex flex-col gap-3.5">
          {page.body[locale].map((para, i) => (
            <p key={i} className="font-body text-[15px] leading-relaxed text-ink-muted">
              {para}
            </p>
          ))}
        </div>

        {page.facts && (
          <div className="mt-6 overflow-x-auto">
            <table className="rtable w-full border-collapse font-body text-[14px]">
              <thead>
                <tr>
                  {page.facts.columns.map((c, i) => (
                    <th
                      key={i}
                      scope="col"
                      className="border-b border-border-strong px-3 py-2 text-left font-bold uppercase tracking-wide text-ink-muted"
                    >
                      {c[locale]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {page.facts.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        data-label={page.facts?.columns[ci]?.[locale] ?? ""}
                        className="border-b border-border-subtle px-3 py-2 text-ink"
                      >
                        {cell.href ? (
                          <Link href={`/${locale}${cell.href}`} className="font-semibold text-accent hover:underline">
                            {cell[locale]}
                          </Link>
                        ) : (
                          cell[locale]
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {page.links.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide">{t.more}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {page.links.map((lnk) => (
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
          </section>
        )}

        {page.faq.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide">{t.faq}</h2>
            <div className="mt-3 flex flex-col gap-4">
              {page.faq.map((f, i) => (
                <div key={i}>
                  <p className="mb-1 font-body text-[15px] font-bold text-ink">{f.q[locale]}</p>
                  <p className="font-body text-[14px] leading-relaxed text-ink-muted">{f.a[locale]}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide">{t.related}</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/${locale}${glossaryTermPath(r)}`}
                    prefetch={false}
                    title={r.def[locale]}
                    className="inline-block rounded-full border border-border-subtle px-3 py-1.5 font-body text-[13px] text-ink-muted transition-colors hover:border-accent/50 hover:text-ink"
                  >
                    {r.term[locale]}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {page.sources.length > 0 && (
          <section className="mt-8 border-t border-border-subtle pt-5">
            <h2 className="font-display text-[12px] font-bold uppercase tracking-[0.1em] text-ink-muted">{t.sources}</h2>
            <ul className="mt-2 flex flex-col gap-1">
              {page.sources.map((s) => (
                <li key={s.url} className="font-body text-[13px] text-ink-muted">
                  <a href={s.url} target="_blank" rel="noopener" className="hover:text-ink hover:underline">
                    {s.label[locale]}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 font-body text-[12px] text-ink-dim">
              {t.updated} {fmtDate(GLOSSARY_CHECKED)} ·{" "}
              <Link href={`/${locale}/slovnyk`} className="hover:text-ink hover:underline">
                {t.all}
              </Link>
            </p>
          </section>
        )}
      </Container>
    </div>
  );
}
