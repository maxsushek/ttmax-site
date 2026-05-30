import Link from "next/link";
import { Container, Section, SectionKicker, SectionTitle } from "@/components/ui/Section";
import { brands } from "@/data/brands";
import { t } from "@/i18n";
import type { Messages } from "@/i18n/messages/types";
import type { Locale } from "@/i18n/config";

// Коллекции Butterfly → реальная категория (вместо битых /brands/{id}).
const COLLECTION_HREF: Record<string, string> = {
  tenergy: "/nakladki",
  dignics: "/nakladki",
  rozena: "/nakladki",
  viscaria: "/osnovaniya",
  hadraw: "/osnovaniya",
  wear: "/odyag",
};

export function Brands({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages;
}) {
  const m = messages.brands;
  return (
    <Section
      className="border-t border-border-subtle bg-white/[0.007] !py-16 lg:!py-20"
      ariaLabelledBy="brands-title"
    >
      <Container>
        <div className="mb-11 text-center">
          <SectionKicker>{m.kicker}</SectionKicker>
          <SectionTitle id="brands-title">{m.title}</SectionTitle>
        </div>
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {brands.map((b) => (
            <li key={b.id}>
              <Link
                href={`/${locale}${COLLECTION_HREF[b.id] ?? "/butterfly"}`}
                className="group flex flex-col items-center rounded-2xl border border-border-subtle bg-bg-raised px-3 py-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-accent/15 hover:bg-bg-elevated"
                data-cta="brand"
                data-location={b.id}
              >
                <span
                  aria-hidden
                  className="mb-2.5 text-[26px] transition-transform duration-[400ms] group-hover:rotate-[8deg] group-hover:scale-[1.28]"
                >
                  {b.flag}
                </span>
                <span className="mb-1 font-display text-[17px] font-extrabold uppercase tracking-[0.04em]">
                  {b.name}
                </span>
                <span className="font-body text-[11px] text-ink-muted transition-colors group-hover:text-accent">
                  {t(m.productsCount, { count: b.productsCount })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
