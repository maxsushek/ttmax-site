// src/components/catalog/PlayersUsing.tsx
// Блок «Хто грає» на картці товару: гравці, у чинному інвентарі яких є цей товар
// (дані — src/data/playerProfiles.ts, джерело — офіційні сторінки Butterfly з датою).
// Перелінковка картка → профіль гравця; зворотний бік — блок товарів на сторінці гравця.
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { PLAYERS } from "@/data/players";
import { playersUsingProduct } from "@/data/playerProfiles";
import { PlayerFace } from "@/components/content/PlayerFace";

const T = {
  ua: { heading: "Хто грає", asOf: "за даними Butterfly станом на", all: "Усі гравці" },
  ru: { heading: "Кто играет", asOf: "по данным Butterfly на", all: "Все игроки" },
} satisfies Record<Locale, Record<string, string>>;

function fmt(iso: string) {
  const [y, m, d] = iso.split("-");
  return d ? `${d}.${m}.${y}` : iso;
}

export function PlayersUsing({ productSlug, locale }: { productSlug?: string; locale: Locale }) {
  if (!productSlug) return null;
  const list = playersUsingProduct(productSlug);
  if (list.length === 0) return null;
  const t = T[locale];
  return (
    <section aria-label={t.heading}>
      <h2 className="mb-4 mt-2 font-display text-lg font-bold uppercase tracking-[0.04em]">{t.heading}</h2>
      <ul className="flex flex-wrap gap-3">
        {list.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/${locale}/igroki/${p.slug}`}
              data-player-link="product"
              className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-raised px-3 py-2 transition-colors hover:border-accent/50"
            >
              <PlayerFace slug={p.slug} locale={locale} size={40} />
              <span>
                <span className="block font-body text-[14px] font-bold text-ink">
                  {PLAYERS[p.slug].name[locale]} ({p.country.code})
                </span>
                <span className="block font-body text-[12px] text-ink-muted">
                  {t.asOf} {fmt(p.equipment.asOf)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href={`/${locale}/igroki`} className="mt-3 inline-block font-body text-[13px] text-accent hover:underline">
        {t.all} →
      </Link>
    </section>
  );
}
