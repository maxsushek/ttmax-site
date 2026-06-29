import { Container } from "@/components/ui/Section";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import type { Locale } from "@/i18n/config";
import type { LegalDoc } from "@/data/legal";

const UI: Record<Locale, { home: string; updated: string }> = {
  ua: { home: "Головна", updated: "Оновлено" },
  ru: { home: "Главная", updated: "Обновлено" },
};

/** YYYY-MM-DD → DD.MM.YYYY */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function LegalArticle({ doc, locale }: { doc: LegalDoc; locale: Locale }) {
  const ui = UI[locale];
  const breadcrumb = breadcrumbJsonLd(
    [
      { name: ui.home, path: "/" },
      { name: doc.title[locale], path: `/${doc.slug}` },
    ],
    locale,
  );

  return (
    <article className="py-12 sm:py-16 lg:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <Container className="max-w-3xl">
        <header className="mb-8 border-b border-border-subtle pb-6">
          <h1 className="font-display text-display-md font-black uppercase text-balance">
            {doc.title[locale]}
          </h1>
          <p className="mt-2 font-body text-[12px] uppercase tracking-[0.14em] text-ink-muted">
            {ui.updated}: {formatDate(doc.updated)}
          </p>
        </header>

        <p className="mb-8 font-body text-[15px] leading-relaxed text-ink-muted">
          {doc.intro[locale]}
        </p>

        <div className="flex flex-col gap-8">
          {doc.sections.map((s, i) => (
            <section key={i}>
              <h2 className="mb-2.5 font-display text-lg font-bold uppercase tracking-wide text-ink">
                {s.h[locale]}
              </h2>
              <div className="flex flex-col gap-2.5">
                {s.p[locale].map((para, j) => (
                  <p key={j} className="font-body text-[15px] leading-relaxed text-ink-muted">
                    {para}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Container>
    </article>
  );
}
