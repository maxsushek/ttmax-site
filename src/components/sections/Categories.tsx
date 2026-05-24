import Link from "next/link";
import { Container, Section, SectionKicker, SectionTitle } from "@/components/ui/Section";
import { categories } from "@/data/categories";
import { t } from "@/i18n";
import type { Messages } from "@/i18n/messages/types";
import type { Locale } from "@/i18n/config";

export function Categories({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages;
}) {
  const m = messages.categories;
  return (
    <Section id="categories" ariaLabelledBy="categories-title">
      <Container>
        <div className="mb-11 flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionKicker>{m.kicker}</SectionKicker>
            <SectionTitle id="categories-title">
              <span className="text-white/60">{m.titleMuted}</span>{" "}
              <span className="text-gradient-accent">{m.titleAccent}</span>
            </SectionTitle>
          </div>
          <Link
            href={`/${locale}/catalog`}
            className="nav-link font-display text-[13px] font-bold uppercase tracking-[0.1em] text-accent"
          >
            {m.seeAll} →
          </Link>
        </div>

        <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {categories.map((c) => {
            const itemTexts = m.items[c.key];
            return (
              <li key={c.key} className="h-full">
                <Link
                  href={`/${locale}/catalog/${c.key}`}
                  className="group relative flex h-full w-full flex-col overflow-hidden rounded-[18px] border border-border-strong bg-bg-raised p-5 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:bg-bg-elevated hover:shadow-card-hover sm:p-6"
                  data-cta="category"
                  data-location={c.key}
                >
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-[400ms] group-hover:scale-x-100"
                    style={{ backgroundColor: c.accentColor }}
                  />
                  <span
                    aria-hidden
                    className="mb-3 inline-block text-4xl transition-transform duration-[400ms] group-hover:-rotate-[10deg] group-hover:scale-[1.18]"
                  >
                    {c.icon}
                  </span>
                  <span
                    className="text-[11px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: c.accentColor }}
                  >
                    {t(m.productsCount, { count: c.count })}
                  </span>
                  <span className="mt-1 font-display text-[22px] font-extrabold uppercase tracking-tight">
                    {itemTexts.label}
                  </span>
                  <span className="mt-1 flex-1 font-body text-[13px] text-ink-ghost">
                    {itemTexts.desc}
                  </span>
                  <span
                    className="mt-5 text-xs font-bold uppercase tracking-[0.1em]"
                    style={{ color: c.accentColor }}
                  >
                    {m.cta} <span className="inline-block transition-transform group-hover:translate-x-1.5">→</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
