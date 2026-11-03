import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { buildBlogMetadata } from "@/lib/seo/blog-metadata";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo/jsonld";
import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/Section";
import { PLAYERS } from "@/data/players";
import { allProfiles } from "@/data/playerProfiles";
import { PlayerFace } from "@/components/content/PlayerFace";
import { fmtDate } from "@/components/content/PlayerProfileView";

const T = {
  ua: {
    title: "На чому грають професіонали: інвентар гравців | TTMAX",
    description:
      "🏓 Основи й накладки гравців Butterfly — Харімото, Фань Чженьдун, Лінь Юньжу, Болль — за офіційними сторінками Butterfly з датою, плюс карʼєра й титули.",
    h1: "Гравці Butterfly: на чому грають і карʼєра",
    intro:
      "Інвентар кожного гравця — з офіційної сторінки Butterfly із датою «станом на»: основа, накладка на форхенд і на бекхенд. На сторінці гравця — головні титули, коротка біографія й посилання на ці моделі в магазині.",
    home: "Головна",
    players: "Гравці",
    blade: "Основа",
    rubbers: "Накладки",
    asOf: "станом на",
  },
  ru: {
    title: "На чём играют профессионалы: инвентарь игроков | TTMAX",
    description:
      "🏓 Основания и накладки игроков Butterfly — Харимото, Фань Чжэньдун, Линь Юньжу, Болль — по официальным страницам Butterfly с датой, плюс карьера и титулы.",
    h1: "Игроки Butterfly: на чём играют и карьера",
    intro:
      "Инвентарь каждого игрока — с официальной страницы Butterfly с датой «по состоянию на»: основание, накладка на форхенд и на бэкхенд. На странице игрока — главные титулы, краткая биография и ссылки на эти модели в магазине.",
    home: "Главная",
    players: "Игроки",
    blade: "Основание",
    rubbers: "Накладки",
    asOf: "на",
  },
} satisfies Record<Locale, Record<string, string>>;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: l } = await params;
  if (!isLocale(l)) return {};
  return buildBlogMetadata({ locale: l, pathname: "/igroki", title: T[l].title, description: T[l].description });
}

export default async function PlayersIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale: Locale = l;
  const t = T[locale];
  const profiles = allProfiles();

  const breadcrumb = breadcrumbJsonLd(
    [
      { name: t.home, path: "/" },
      { name: t.players, path: "/igroki" },
    ],
    locale,
  );
  const list = itemListJsonLd({
    url: `${siteConfig.url}/${locale}/igroki`,
    name: t.h1,
    items: profiles.map((p) => ({ name: PLAYERS[p.slug].name[locale], url: `${siteConfig.url}/${locale}/igroki/${p.slug}` })),
  });

  return (
    <div className="py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(list) }} />
      <Container className="max-w-4xl">
        <h1 className="font-display text-display-md font-black uppercase">{t.h1}</h1>
        <p className="mt-4 max-w-3xl font-body text-[15px] leading-relaxed text-ink-muted">{t.intro}</p>
        <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {profiles.map((p) => {
            const rubbers = [p.equipment.fh?.name, p.equipment.bh?.name].filter(Boolean).join(" / ");
            return (
              <li key={p.slug}>
                <Link
                  href={`/${locale}/igroki/${p.slug}`}
                  className="flex h-full items-center gap-4 rounded-2xl border border-border-subtle bg-bg-raised p-4 transition-colors hover:border-accent/50"
                >
                  <PlayerFace slug={p.slug} locale={locale} size={56} />
                  <span className="min-w-0">
                    <span className="block font-display text-[16px] font-bold text-ink">
                      {PLAYERS[p.slug].name[locale]} <span className="text-ink-dim">({p.country.code})</span>
                    </span>
                    <span className="block font-body text-[13px] text-ink-muted">
                      {t.blade}: {p.equipment.blade.name}
                    </span>
                    {rubbers && (
                      <span className="block font-body text-[13px] text-ink-muted">
                        {t.rubbers}: {rubbers}
                      </span>
                    )}
                    <span className="block font-body text-[12px] text-ink-dim">
                      {t.asOf} {fmtDate(p.equipment.asOf)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </div>
  );
}
