// src/components/content/PlayerProfileView.tsx
// Сторінка гравця: на чому грає (з датою й джерелом Butterfly) → товари з цінами → титули →
// біографія → історія інвентарю → статті, де згадується гравець → FAQ → джерела.
// Розмітка: ProfilePage + Person (sameAs → Wikidata), BreadcrumbList, FAQPage.
import Link from "next/link";
import { Container } from "@/components/ui/Section";
import { breadcrumbJsonLd, faqJsonLd, personJsonLd } from "@/lib/seo/jsonld";
import { siteConfig } from "@/config/site";
import type { Locale } from "@/i18n/config";
import { PLAYERS, type PlayerSlug } from "@/data/players";
import { allProfiles, profileProductSlugs, type EquipmentItem, type PlayerProfile } from "@/data/playerProfiles";
import { getAllPosts } from "@/data/blog";
import { getProductBySlug } from "@/data/catalog";
import { BlogProducts } from "@/components/content/BlogProducts";
import { PlayerFace } from "@/components/content/PlayerFace";

const UI = {
  ua: {
    home: "Головна",
    players: "Гравці",
    equipment: "На чому грає",
    asOf: "Станом на",
    source: "джерело — сторінка гравця Butterfly",
    blade: "Основа",
    fh: "Форхенд",
    bh: "Бекхенд",
    oneRubber: "Накладка (сторону не вказано)",
    products: "Інвентар гравця в магазині TTMAX",
    achievements: "Головні досягнення",
    year: "Рік",
    event: "Турнір",
    result: "Результат",
    bio: "Карʼєра",
    history: "Попередній інвентар",
    period: "Період",
    rubbers: "Накладки",
    articles: "Статті, де згадується гравець",
    faq: "Часті запитання",
    sources: "Джерела",
    others: "Інші гравці",
    photo: "Фото",
    checked: "Дані звірено",
    born: "Народження",
    country: "Країна",
    status: "Статус",
    active: "грає",
    retired: "завершив карʼєру",
    retiredF: "завершила карʼєру",
    best: "Найвищий рейтинг ITTF",
    hand: "Рука",
    right: "права",
    left: "ліва",
  },
  ru: {
    home: "Главная",
    players: "Игроки",
    equipment: "На чём играет",
    asOf: "На",
    source: "источник — страница игрока Butterfly",
    blade: "Основание",
    fh: "Форхенд",
    bh: "Бэкхенд",
    oneRubber: "Накладка (сторона не указана)",
    products: "Инвентарь игрока в магазине TTMAX",
    achievements: "Главные достижения",
    year: "Год",
    event: "Турнир",
    result: "Результат",
    bio: "Карьера",
    history: "Прежний инвентарь",
    period: "Период",
    rubbers: "Накладки",
    articles: "Статьи, где упоминается игрок",
    faq: "Частые вопросы",
    sources: "Источники",
    others: "Другие игроки",
    photo: "Фото",
    checked: "Данные сверены",
    born: "Рождение",
    country: "Страна",
    status: "Статус",
    active: "играет",
    retired: "завершил карьеру",
    retiredF: "завершила карьеру",
    best: "Лучший рейтинг ITTF",
    hand: "Рука",
    right: "правая",
    left: "левая",
  },
} satisfies Record<Locale, Record<string, string>>;

/** Гравчині — для форми «завершила карʼєру». Імена в players.ts без статі, тож явний список. */
const FEMALE = new Set<string>(["harimoto-miwa", "cheng-i-ching", "zhu-yuling", "polcanova-sofia", "diaz-adriana", "liu-shiwen", "fukuhara-ai"]);

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (d) return `${d}.${m}.${y}`;
  if (m) return `${m}.${y}`;
  return y ?? iso;
}

function productHref(slug: string): string | null {
  const p = getProductBySlug(slug);
  return p ? `/${p.brandSlug}/${p.categorySlug}/${p.slug}` : null;
}

function Item({ item, locale }: { item: EquipmentItem | null; locale: Locale }) {
  if (!item) return <span className="text-ink-dim">—</span>;
  const href = item.product ? productHref(item.product) : null;
  return href ? (
    <Link href={`/${locale}${href}`} data-player-link="equipment" className="text-accent hover:underline">
      {item.name}
    </Link>
  ) : (
    <span>{item.name}</span>
  );
}

/** Статті блогу, у таблицях яких є цей гравець (клітинка з player). */
function postsWithPlayer(slug: PlayerSlug) {
  return getAllPosts().filter((post) =>
    post.sections.some((s) => (s.table?.rows ?? []).some((r) => r.some((c) => c.player === slug))),
  );
}

export function PlayerProfileView({ profile, locale }: { profile: PlayerProfile; locale: Locale }) {
  const ui = UI[locale];
  const player = PLAYERS[profile.slug];
  const name = player.name[locale];
  const path = `/igroki/${profile.slug}`;
  const pageUrl = `${siteConfig.url}/${locale}${path}`;
  const eq = profile.equipment;
  const posts = postsWithPlayer(profile.slug);
  const others = allProfiles().filter((p) => p.slug !== profile.slug);
  const productSlugs = profileProductSlugs(profile);
  const status = profile.active ? ui.active : FEMALE.has(profile.slug) ? ui.retiredF : ui.retired;

  const person = personJsonLd({
    name,
    alternateName: player.nameEn,
    url: pageUrl,
    jobTitle: locale === "ua" ? "Гравець у настільний теніс" : "Игрок в настольный теннис",
    description: profile.summary[locale],
    image: player.photo ? `${siteConfig.url}${player.photo.src}` : undefined,
    sameAs: [`https://www.wikidata.org/wiki/${player.wikidata}`, eq.source],
    nationality: profile.country[locale],
    birthDate: profile.born ?? undefined,
  });
  const profilePage = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: pageUrl,
    name: `${name} — ${ui.equipment.toLowerCase()}`,
    dateModified: profile.checked,
    inLanguage: locale === "ua" ? "uk" : "ru",
    mainEntity: person,
  };
  const breadcrumb = breadcrumbJsonLd(
    [
      { name: ui.home, path: "/" },
      { name: ui.players, path: "/igroki" },
      { name, path },
    ],
    locale,
  );
  const faqLd = profile.faq.length > 0 ? faqJsonLd(profile.faq.map((f) => ({ q: f.q[locale], a: f.a[locale] }))) : null;

  const facts: { label: string; value: string }[] = [
    { label: ui.country, value: `${profile.country[locale]} (${profile.country.code})` },
    ...(profile.born ? [{ label: ui.born, value: fmtDate(profile.born) }] : []),
    { label: ui.status, value: profile.retired ? `${status}, ${profile.retired}` : status },
    ...(profile.hand ? [{ label: ui.hand, value: ui[profile.hand] }] : []),
    ...(profile.ranking.best ? [{ label: ui.best, value: `№${profile.ranking.best}${profile.ranking.bestDate ? ` (${fmtDate(profile.ranking.bestDate)})` : ""}` }] : []),
  ];

  const h2 = "mb-3 mt-10 font-display text-lg font-bold uppercase tracking-wide text-ink";
  const p = "font-body text-[15px] leading-relaxed text-ink-muted";

  return (
    <div className="py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePage) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
      <Container className="max-w-3xl">
        <nav className="mb-6 font-body text-[12px] uppercase tracking-[0.12em] text-ink-dim" aria-label="breadcrumb">
          <Link href={`/${locale}`} className="hover:text-ink">{ui.home}</Link>
          {" / "}
          <Link href={`/${locale}/igroki`} className="hover:text-ink">{ui.players}</Link>
          {" / "}
          <span className="text-ink-muted">{name}</span>
        </nav>

        <header className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <PlayerFace slug={profile.slug} locale={locale} size={96} />
          <div>
            <h1 className="font-display text-display-md font-black uppercase leading-tight">
              {locale === "ua" ? `${name}: на чому грає і карʼєра` : `${name}: на чём играет и карьера`}
            </h1>
            <p className="mt-1 font-body text-[13px] text-ink-dim">{player.nameEn}</p>
          </div>
        </header>

        <p className="mt-6 font-body text-[16px] leading-relaxed text-ink">{profile.summary[locale]}</p>

        <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-1.5 rounded-2xl border border-border-subtle bg-bg-raised p-4 sm:grid-cols-2">
          {facts.map((f) => (
            <div key={f.label} className="flex gap-2 font-body text-[14px]">
              <dt className="text-ink-dim">{f.label}:</dt>
              <dd className="text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>

        <section id="inventar">
          <h2 className={h2}>{ui.equipment}</h2>
          <div className="overflow-hidden rounded-2xl border border-border-subtle">
            <table className="w-full font-body text-[14px]">
              <tbody>
                {(eq.bh
                  ? ([
                      [ui.blade, eq.blade],
                      [ui.fh, eq.fh],
                      [ui.bh, eq.bh],
                    ] as const)
                  : // ⚠️ Butterfly вказує одну накладку без сторони (Фань Чженьдун, Чжан Цзіке):
                    // не підписуємо її «форхендом» — цього джерело не стверджує.
                    ([
                      [ui.blade, eq.blade],
                      [ui.oneRubber, eq.fh],
                    ] as const)
                ).map(([label, item]) => (
                  <tr key={label} className="border-b border-border-subtle last:border-0">
                    <th scope="row" className="w-1/3 bg-bg-raised px-4 py-2.5 text-left font-normal text-ink-dim">
                      {label}
                    </th>
                    <td className="px-4 py-2.5 text-ink">
                      <Item item={item} locale={locale} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 font-body text-[12px] text-ink-dim">
            {ui.asOf} {fmtDate(eq.asOf)},{" "}
            <a href={eq.source} target="_blank" rel="noopener" className="underline-offset-2 hover:underline">
              {ui.source}
            </a>
            {eq.note ? ` · ${eq.note[locale]}` : ""}
          </p>
        </section>

        {productSlugs.length > 0 && (
          <div className="mt-6">
            <BlogProducts owner={`player:${profile.slug}`} slugs={productSlugs} locale={locale} heading={ui.products} />
          </div>
        )}

        {profile.achievements.length > 0 && (
          <section id="dosyahnennya">
            <h2 className={h2}>{ui.achievements}</h2>
            <div className="overflow-x-auto rounded-2xl border border-border-subtle">
              <table className="w-full font-body text-[14px]">
                <thead>
                  <tr className="bg-bg-raised text-left text-ink-dim">
                    <th className="px-4 py-2 font-normal">{ui.year}</th>
                    <th className="px-4 py-2 font-normal">{ui.event}</th>
                    <th className="px-4 py-2 font-normal">{ui.result}</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.achievements.map((a, i) => (
                    <tr key={i} className="border-t border-border-subtle">
                      <td className="px-4 py-2 tabular-nums text-ink">{a.year}</td>
                      <td className="px-4 py-2 text-ink">{a.event[locale]}</td>
                      <td className="px-4 py-2 text-ink">{a.result[locale]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section id="karyera">
          <h2 className={h2}>{ui.bio}</h2>
          <div className="flex flex-col gap-3">
            {profile.bio[locale].map((para, i) => (
              <p key={i} className={p}>
                {para}
              </p>
            ))}
          </div>
        </section>

        {profile.history.length > 0 && (
          <section id="istoriya">
            <h2 className={h2}>{ui.history}</h2>
            <div className="overflow-x-auto rounded-2xl border border-border-subtle">
              <table className="w-full font-body text-[14px]">
                <thead>
                  <tr className="bg-bg-raised text-left text-ink-dim">
                    <th className="px-4 py-2 font-normal">{ui.period}</th>
                    <th className="px-4 py-2 font-normal">{ui.blade}</th>
                    <th className="px-4 py-2 font-normal">{ui.rubbers}</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.history.map((h, i) => (
                    <tr key={i} className="border-t border-border-subtle">
                      <td className="px-4 py-2 text-ink">{h.period[locale]}</td>
                      <td className="px-4 py-2 text-ink">{h.blade}</td>
                      <td className="px-4 py-2 text-ink">{h.rubbers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {posts.length > 0 && (
          <section id="statti">
            <h2 className={h2}>{ui.articles}</h2>
            <ul className="flex flex-col gap-2">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/${locale}/blog/${post.slug}`}
                    data-player-link="post"
                    className="block rounded-lg border border-border-subtle px-4 py-3 font-body text-[14px] text-ink hover:border-border-strong hover:text-accent"
                  >
                    {post.h1[locale]}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {profile.faq.length > 0 && (
          <section id="faq">
            <h2 className={h2}>{ui.faq}</h2>
            <div className="flex flex-col gap-3">
              {profile.faq.map((f, i) => (
                <details key={i} className="rounded-xl border border-border-subtle bg-bg-raised px-4 py-3" open={i === 0}>
                  <summary className="cursor-pointer font-body text-[15px] font-bold text-ink">{f.q[locale]}</summary>
                  <p className={`mt-2 ${p}`}>{f.a[locale]}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {others.length > 0 && (
          <section id="inshi">
            <h2 className={h2}>{ui.others}</h2>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link
                    href={`/${locale}/igroki/${o.slug}`}
                    data-player-link="other"
                    className="flex items-center gap-3 rounded-lg border border-border-subtle px-3 py-2 hover:border-border-strong"
                  >
                    <PlayerFace slug={o.slug} locale={locale} size={32} />
                    <span className="font-body text-[14px] text-ink">
                      {PLAYERS[o.slug].name[locale]} <span className="text-ink-dim">({o.country.code})</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="dzherela" className="mt-10 border-t border-border-subtle pt-6">
          <h2 className="mb-2 font-display text-[13px] font-bold uppercase tracking-[0.12em] text-ink-dim">{ui.sources}</h2>
          <ul className="flex flex-col gap-1">
            {profile.sources.map((s) => (
              <li key={s.url} className="font-body text-[13px]">
                <a href={s.url} target="_blank" rel="noopener" className="text-ink-muted hover:text-ink hover:underline">
                  {s.label[locale]}
                </a>
              </li>
            ))}
          </ul>
          {player.photo && (
            <p className="mt-3 font-body text-[12px] text-ink-dim">
              {ui.photo}: {player.photo.author},{" "}
              <a href={player.photo.licenseUrl ?? player.photo.sourceUrl} target="_blank" rel="noopener license" className="hover:underline">
                {player.photo.license}
              </a>
              ,{" "}
              <a href={player.photo.sourceUrl} target="_blank" rel="noopener" className="hover:underline">
                Wikimedia Commons
              </a>
            </p>
          )}
          <p className="mt-1 font-body text-[12px] text-ink-dim">
            {ui.checked}: {fmtDate(profile.checked)}
          </p>
        </section>
      </Container>
    </div>
  );
}
