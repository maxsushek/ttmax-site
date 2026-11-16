// Словник настільного тенісу: короткі визначення термінів із якорями (#slug) і DefinedTermSet.
// Дані й правила — у src/data/glossary.ts.
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, localeToLang, type Locale } from "@/i18n/config";
import { buildBlogMetadata } from "@/lib/seo/blog-metadata";
import { breadcrumbJsonLd, definedTermSetJsonLd } from "@/lib/seo/jsonld";
import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/Section";
import { GLOSSARY, GLOSSARY_CATEGORIES, GLOSSARY_CHECKED, glossaryByCategory } from "@/data/glossary";
import { fmtDate } from "@/components/content/PlayerProfileView";

export const revalidate = false;

const T = {
  ua: {
    title: "Словник настільного тенісу: терміни й визначення | TTMAX",
    description:
      "📖 Словник настільного тенісу: {n} — правила ITTF, удари, обертання, накладки й основи (ALC, ZLC, тензор, OX). Коротко, з посиланнями на гайди.",
    h1: "Словник настільного тенісу",
    intro:
      "Короткі визначення термінів настільного тенісу — від правил ITTF і назв ударів до матеріалів основ і типів накладок. Кожен термін має своє посилання (якір), а поруч — стаття чи розділ каталогу, де тема розібрана докладно.",
    home: "Головна",
    crumb: "Словник",
    more: "Докладніше",
    termPage: "Про термін",
    aka: "Також",
    updated: "Оновлено",
  },
  ru: {
    title: "Словарь настольного тенниса: термины и определения | TTMAX",
    description:
      "📖 Словарь настольного тенниса: {n} — правила ITTF, удары, вращение, накладки и основания (ALC, ZLC, тензор, OX). Коротко, со ссылками на гайды.",
    h1: "Словарь настольного тенниса",
    intro:
      "Короткие определения терминов настольного тенниса — от правил ITTF и названий ударов до материалов оснований и типов накладок. У каждого термина своя ссылка (якорь), а рядом — статья или раздел каталога, где тема разобрана подробно.",
    home: "Главная",
    crumb: "Словарь",
    more: "Подробнее",
    termPage: "О термине",
    aka: "Также",
    updated: "Обновлено",
  },
} satisfies Record<Locale, Record<string, string>>;

/** «162 терміни» / «162 термина» — число разом зі словом у правильній формі. */
function termsCount(n: number, locale: Locale): string {
  const forms = locale === "ua" ? ["термін", "терміни", "термінів"] : ["термин", "термина", "терминов"];
  const m10 = n % 10;
  const m100 = n % 100;
  const f = m10 === 1 && m100 !== 11 ? 0 : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 1 : 2;
  return `${n} ${forms[f]}`;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: l } = await params;
  if (!isLocale(l)) return {};
  return buildBlogMetadata({
    locale: l,
    pathname: "/slovnyk",
    title: T[l].title,
    description: T[l].description.replace("{n}", termsCount(GLOSSARY.length, l)),
  });
}

export default async function GlossaryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale: Locale = l;
  const t = T[locale];
  const url = `${siteConfig.url}/${locale}/slovnyk`;

  const breadcrumb = breadcrumbJsonLd(
    [
      { name: t.home, path: "/" },
      { name: t.crumb, path: "/slovnyk" },
    ],
    locale,
  );
  const set = definedTermSetJsonLd({
    url,
    name: t.h1,
    description: t.intro,
    inLanguage: localeToLang[locale],
    terms: GLOSSARY.map((g) => ({
      slug: g.slug,
      name: g.term[locale],
      alternateName: g.aka[locale],
      description: g.def[locale],
    })),
  });
  const cats = GLOSSARY_CATEGORIES.map((c) => ({ ...c, items: glossaryByCategory(c.key, locale) })).filter(
    (c) => c.items.length > 0,
  );

  return (
    <div className="py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(set) }} />
      <Container className="max-w-4xl">
        <nav className="font-body text-[13px] text-ink-muted" aria-label="breadcrumb">
          <Link href={`/${locale}`} className="hover:text-ink">
            {t.home}
          </Link>{" "}
          / <span className="text-ink">{t.crumb}</span>
        </nav>
        <h1 className="mt-3 font-display text-display-md font-black uppercase">{t.h1}</h1>
        <p className="mt-4 max-w-3xl font-body text-[15px] leading-relaxed text-ink-muted">{t.intro}</p>
        <p className="mt-2 font-body text-[12px] text-ink-dim">
          {termsCount(GLOSSARY.length, locale)} · {t.updated} {fmtDate(GLOSSARY_CHECKED)}
        </p>

        {/* Зміст розділів: на телефоні — горизонтальні «чіпи», що переносяться. */}
        <ul className="mt-6 flex flex-wrap gap-2">
          {cats.map((c) => (
            <li key={c.key}>
              <a
                href={`#${c.key}`}
                className="inline-block rounded-full border border-border-subtle px-3 py-1.5 font-body text-[13px] text-ink-muted transition-colors hover:border-accent/50 hover:text-ink"
              >
                {c.title[locale]} <span className="text-ink-dim">({c.items.length})</span>
              </a>
            </li>
          ))}
        </ul>

        {cats.map((c) => (
          <section key={c.key} id={c.key} className="mt-10 scroll-mt-24">
            <h2 className="font-display text-xl font-black uppercase sm:text-2xl">{c.title[locale]}</h2>
            <dl className="mt-4 divide-y divide-border-subtle border-y border-border-subtle">
              {c.items.map((g) => (
                <div key={g.slug} id={g.slug} className="scroll-mt-24 py-4">
                  <dt className="font-display text-[16px] font-bold text-ink">
                    <dfn className="not-italic">{g.term[locale]}</dfn>
                    <a
                      href={`#${g.slug}`}
                      aria-label={`#${g.slug}`}
                      className="ml-2 font-body text-[13px] font-normal text-ink-dim hover:text-accent"
                    >
                      #
                    </a>
                  </dt>
                  <dd className="mt-1.5 font-body text-[15px] leading-relaxed text-ink-muted">
                    {g.def[locale]}
                    {g.aka[locale].length > 0 && (
                      <span className="mt-1 block text-[13px] text-ink-dim">
                        {t.aka}: {g.aka[locale].join(", ")}
                      </span>
                    )}
                    {g.page && (
                      <Link
                        href={`/${locale}/slovnyk/${g.slug}`}
                        prefetch={false}
                        className="mr-4 mt-1.5 inline-block text-[13px] font-semibold text-accent hover:underline"
                      >
                        {t.termPage} →
                      </Link>
                    )}
                    {g.href && (
                      <Link
                        href={`/${locale}${g.href}`}
                        prefetch={false}
                        data-glossary-link={g.slug}
                        className="mt-1.5 inline-block text-[13px] font-semibold text-accent hover:underline"
                      >
                        {t.more} →
                      </Link>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </Container>
    </div>
  );
}
