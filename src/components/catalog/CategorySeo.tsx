// src/components/catalog/CategorySeo.tsx
// SEO-низ категорії: текст + FAQ (+FAQPage schema емітиться в page.tsx) + перелінковка
// на топ-товари та суміжні категорії. Серверний компонент, без JS, mobile-first.
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { CatalogCategory } from "@/types/catalog";

type Lnk = { ua: string; ru: string; path: string };

// «Розумна» перелінковка під топ-товари й суміжні категорії (path — без /{locale}).
const LINKS: Record<string, Lnk[]> = {
  nakladki: [
    { ua: "Dignics 05", ru: "Dignics 05", path: "/butterfly/nakladki/dignics-05" },
    { ua: "Dignics 09C", ru: "Dignics 09C", path: "/butterfly/nakladki/dignics-09c" },
    { ua: "Tenergy 05", ru: "Tenergy 05", path: "/butterfly/nakladki/tenergy-05" },
    { ua: "Основи", ru: "Основания", path: "/osnovaniya" },
    { ua: "Готові ракетки", ru: "Готовые ракетки", path: "/rakety" },
  ],
  osnovaniya: [
    { ua: "Viscaria", ru: "Viscaria", path: "/butterfly/osnovaniya/viscaria" },
    { ua: "Timo Boll ALC", ru: "Timo Boll ALC", path: "/butterfly/osnovaniya/timo-boll-alc" },
    { ua: "Apolonia ZLC", ru: "Apolonia ZLC", path: "/butterfly/osnovaniya/apolonia-zlc" },
    { ua: "Основи ALC", ru: "Основания ALC", path: "/osnovaniya/alc" },
    { ua: "Основи ZLC", ru: "Основания ZLC", path: "/osnovaniya/zlc" },
    { ua: "Накладки", ru: "Накладки", path: "/nakladki" },
    { ua: "Готові ракетки", ru: "Готовые ракетки", path: "/rakety" },
  ],
  rakety: [
    { ua: "Накладки", ru: "Накладки", path: "/nakladki" },
    { ua: "Основи", ru: "Основания", path: "/osnovaniya" },
    { ua: "Dignics 05", ru: "Dignics 05", path: "/butterfly/nakladki/dignics-05" },
    { ua: "Viscaria", ru: "Viscaria", path: "/butterfly/osnovaniya/viscaria" },
  ],
  setki: [
    { ua: "М'ячі", ru: "Мячи", path: "/myachi" },
    { ua: "Аксесуари", ru: "Аксессуары", path: "/aksessuary" },
    { ua: "Готові ракетки", ru: "Готовые ракетки", path: "/rakety" },
  ],
  obuv: [
    { ua: "Одяг", ru: "Одежда", path: "/odyag" },
    { ua: "Аксесуари", ru: "Аксессуары", path: "/aksessuary" },
    { ua: "Накладки", ru: "Накладки", path: "/nakladki" },
  ],
  myachi: [
    { ua: "Готові ракетки", ru: "Готовые ракетки", path: "/rakety" },
    { ua: "Накладки", ru: "Накладки", path: "/nakladki" },
    { ua: "Аксесуари", ru: "Аксессуары", path: "/aksessuary" },
  ],
  chehly: [
    { ua: "Готові ракетки", ru: "Готовые ракетки", path: "/rakety" },
    { ua: "Накладки", ru: "Накладки", path: "/nakladki" },
    { ua: "Аксесуари", ru: "Аксессуары", path: "/aksessuary" },
  ],
  aksessuary: [
    { ua: "Накладки", ru: "Накладки", path: "/nakladki" },
    { ua: "Чохли та сумки", ru: "Чехлы и сумки", path: "/chehly" },
    { ua: "М'ячі", ru: "Мячи", path: "/myachi" },
  ],
  odyag: [
    { ua: "Взуття", ru: "Обувь", path: "/obuv" },
    { ua: "Аксесуари", ru: "Аксессуары", path: "/aksessuary" },
  ],
};

export function CategorySeo({
  category,
  locale,
  linksOnly = false,
}: {
  category: CatalogCategory;
  locale: Locale;
  linksOnly?: boolean;
}) {
  const L = (ua: string, ru: string) => (locale === "ru" ? ru : ua);
  const h2 = "font-display text-lg font-bold uppercase tracking-[0.05em] text-ink sm:text-xl";

  const paras = category.seoText
    ? (locale === "ru" ? category.seoText.ru : category.seoText.ua)
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const faq = category.faq ?? [];
  const links = LINKS[category.slug] ?? [];

  if (paras.length === 0 && faq.length === 0 && links.length === 0) return null;

  return (
    <div className="mt-14 space-y-10 border-t border-border-subtle pt-10 sm:mt-16">
      {/* SEO-текст */}
      {!linksOnly && paras.length > 0 && (
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

      {/* FAQ */}
      {!linksOnly && faq.length > 0 && (
        <section>
          <h2 className={h2}>{L("Питання й відповіді", "Вопросы и ответы")}</h2>
          <div className="mt-5 divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border-strong">
            {faq.map((f, i) => (
              <details key={i} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 font-body text-[15px] font-medium text-white/90 [&::-webkit-details-marker]:hidden">
                  <span>{locale === "ru" ? f.q.ru : f.q.ua}</span>
                  <span className="shrink-0 text-xl leading-none text-accent transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="px-4 pb-4 font-body text-sm leading-[1.7] text-white/75">
                  {locale === "ru" ? f.a.ru : f.a.ua}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Перелінковка */}
      {links.length > 0 && (
        <section>
          <div className="mb-3 font-display text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">
            {L("Дивіться також", "Смотрите также")}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {links.map((l) => (
              <Link
                key={l.path}
                href={`/${locale}${l.path}`}
                className="rounded-full border border-border-strong bg-white/[0.02] px-4 py-2 font-display text-xs font-bold uppercase tracking-[0.04em] text-white/85 transition-colors hover:border-accent/40 hover:text-accent"
              >
                {locale === "ru" ? l.ru : l.ua}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
