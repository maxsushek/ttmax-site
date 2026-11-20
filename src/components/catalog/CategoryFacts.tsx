// «Головне» під H1 категорії/хаба: короткі факти-відповіді (lib/catalog/categoryFacts.ts).
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Fact } from "@/lib/catalog/categoryFacts";

export function CategoryFacts({ facts, locale }: { facts: Fact[]; locale: Locale }) {
  if (facts.length === 0) return null;
  return (
    <section
      aria-label={locale === "ua" ? "Головне" : "Главное"}
      data-category-facts
      className="-mt-4 mb-8 max-w-3xl rounded-2xl border border-accent/30 bg-accent/[0.04] px-5 py-4"
    >
      <h2 className="font-display text-[12px] font-bold uppercase tracking-[0.14em] text-accent">
        {locale === "ua" ? "Головне" : "Главное"}
      </h2>
      <ul className="mt-2 flex flex-col gap-1.5">
        {facts.map((f, i) => (
          <li key={i} className="flex gap-2.5 font-body text-[14px] leading-[1.6] text-white/85">
            <span aria-hidden className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span>
              {f.text}
              {f.link && (
                <>
                  {" "}
                  <Link href={`/${locale}${f.link.href}`} prefetch={false} className="whitespace-nowrap font-semibold text-accent hover:underline">
                    {f.link.label} →
                  </Link>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
