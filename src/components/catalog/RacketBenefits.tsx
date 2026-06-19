// src/components/catalog/RacketBenefits.tsx
import type { Locale } from "@/i18n/config";

const TITLE: Record<Locale, string> = {
  ua: "При купівлі збірної ракетки:",
  ru: "При покупке сборной ракетки:",
};

const BENEFITS: Record<Locale, string[]> = {
  ua: [
    "Безкоштовна доставка",
    "Безкоштовне збирання (поклейка)",
    "Безкоштовне обрізання накладок",
    "Торцева стрічка в подарунок",
  ],
  ru: [
    "Бесплатная доставка",
    "Бесплатная поклейка",
    "Бесплатная обрезка накладок",
    "Торцевая лента в подарок",
  ],
};

export function RacketBenefits({ locale }: { locale: Locale }) {
  return (
    <div className="rounded-2xl border border-accent/25 bg-accent/[0.06] p-4 sm:p-5">
      <div className="mb-3 font-display text-sm font-black uppercase tracking-[0.06em] text-accent">
        {TITLE[locale]}
      </div>
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {BENEFITS[locale].map((b) => (
          <li key={b} className="flex items-center gap-2.5 font-body text-sm font-medium text-ink">
            <span
              aria-hidden
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[12px] font-black text-bg-base"
            >
              ✓
            </span>
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}
