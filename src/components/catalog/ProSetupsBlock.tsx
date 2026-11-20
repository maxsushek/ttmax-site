// Блок «Які накладки ставлять на {основу}» / «На які основи ставлять {накладку}» на картках основ,
// накладок і готових ракеток. Дані — інвентар гравців Butterfly з офіційних сторінок Butterfly Japan
// (src/data/proSetups.ts). Замінив блок «Хто грає», який знав лише гравців із профілями на сайті.
//
// ⚠️ GEO: заголовок — питання, перше речення — пряма відповідь із числами. Саме так ШІ-асистенти
// цитують «яку накладку ставлять на Viscaria»; таблиця нижче — доказ, з датою й джерелом у кожному рядку.
// Нічого не радимо «від себе»: лише що реально стоїть у гравців.
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { CatalogProduct } from "@/types/catalog";
import { PLAYERS } from "@/data/players";
import { getProductBySlug, getProductPath, getProductsByCategory } from "@/data/catalog";
import {
  PRO_SETUPS,
  PRO_STATS_PATH,
  bladeRanking,
  proSetupUrl,
  rubberRanking,
  fiberFamily,
  setupRanking,
  setupsWithBlade,
  setupsWithFamily,
  setupsWithRubber,
  type Count,
  type ProSetup,
  type RubberSide,
  type SetupItem,
} from "@/data/proSetups";
import { PlayerFace } from "@/components/content/PlayerFace";
import { fmtDate } from "@/components/content/PlayerProfileView";

type L = Record<Locale, string>;

/** «1 гравець / 3 гравці / 11 гравців». */
export function playersN(n: number, locale: Locale): string {
  const f = locale === "ua" ? ["гравець", "гравці", "гравців"] : ["игрок", "игрока", "игроков"];
  const m10 = n % 10;
  const m100 = n % 100;
  const i = m10 === 1 && m100 !== 11 ? 0 : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 1 : 2;
  return `${n} ${f[i]}`;
}

/** «21 гравець грає» / «25 гравців грають» — дієслово в числі. */
function play(n: number, locale: Locale): string {
  const one = n % 10 === 1 && n % 100 !== 11;
  return locale === "ua" ? (one ? "грає" : "грають") : one ? "играет" : "играют";
}

/** Назва позиції інвентарю: модель з каталогу (з посиланням) або назва з Butterfly / «основа на замовлення». */
export function itemLabel(i: SetupItem, locale: Locale): { text: string; href: string | null } {
  const p = i.product ? getProductBySlug(i.product) : undefined;
  if (i.custom) {
    const spec = i.custom.spec ? ` (${i.custom.spec[locale]})` : "";
    return { text: `${i.custom.label[locale]}${spec}`, href: null };
  }
  if (p) return { text: p.model, href: `/${locale}${getProductPath(p)}` };
  return { text: i.name ?? "—", href: null };
}

export function ItemCell({ item, locale }: { item: SetupItem | null; locale: Locale }) {
  if (!item) return <span className="text-ink-dim">—</span>;
  const l = itemLabel(item, locale);
  return l.href ? (
    <Link href={l.href} prefetch={false} className="font-semibold text-accent hover:underline">
      {l.text}
    </Link>
  ) : (
    <span>{l.text}</span>
  );
}

export function PlayerCell({ s, locale }: { s: ProSetup; locale: Locale }) {
  if (s.profile) {
    return (
      <Link
        href={`/${locale}/igroki/${s.profile}`}
        prefetch={false}
        data-player-link="product"
        className="inline-flex items-center gap-2 font-semibold text-ink hover:text-accent"
      >
        <PlayerFace slug={s.profile} locale={locale} size={28} />
        <span>
          {PLAYERS[s.profile].name[locale]}
          {s.country ? <span className="font-normal text-ink-dim"> ({s.country})</span> : null}
        </span>
      </Link>
    );
  }
  return (
    <span className="text-ink">
      {s.name}
      {s.country ? <span className="text-ink-dim"> ({s.country})</span> : null}
    </span>
  );
}

export function AsOfCell({ s }: { s: ProSetup }) {
  return (
    <a href={proSetupUrl(s)} target="_blank" rel="noopener nofollow" className="whitespace-nowrap text-ink-muted hover:text-ink hover:underline">
      {fmtDate(s.asOf)}
    </a>
  );
}

/** «Dignics 09C (4)» або «Dignics 09C і Zyre 03 (по 3)» — лідер(и) рейтингу. */
export function topPhrase(counts: Count[], locale: Locale, max = 3): string | null {
  if (counts.length === 0) return null;
  const top = counts[0]!.n;
  const leaders = counts.filter((c) => c.n === top).slice(0, max);
  const names = leaders.map((c) => itemLabel(c.item, locale).text);
  const and = locale === "ua" ? " і " : " и ";
  const joined = names.length > 1 ? `${names.slice(0, -1).join(", ")}${and}${names[names.length - 1]}` : names[0];
  return leaders.length > 1 ? `${joined} (${locale === "ua" ? "по" : "по"} ${top})` : `${joined} (${top})`;
}

const T = {
  ua: {
    bladeH: (m: string) => `Які накладки ставлять на ${m}`,
    rubberH: (m: string) => `На які основи ставлять ${m}`,
    racketH: (m: string) => `Що ставлять на ${m} гравці Butterfly`,
    player: "Гравець",
    fh: "Форхенд",
    bh: "Бекхенд",
    blade: "Основа",
    side: "Сторона",
    asOf: "Станом на",
    players: "Гравців",
    more: (n: number) => `Показати всіх (${n})`,
    sideName: { fh: "форхенд", bh: "бекхенд", both: "обидві сторони", single: "не вказано" } as Record<RubberSide, string>,
    singleRow: "сторону не вказано",
    source: (d: string) =>
      `Джерело: сторінки гравців на сайті Butterfly Japan, перевірено ${d}; дата в рядку — «станом на» з цієї сторінки. Сторони Butterfly не підписує: форхенд і бекхенд — за сталим порядком «основа → форхенд → бекхенд».`,
    stats: "Статистика інвентаря всіх гравців Butterfly",
    ready: (m: string) => `Готові ракетки на ${m} у TTMAX`,
  },
  ru: {
    bladeH: (m: string) => `Какие накладки ставят на ${m}`,
    rubberH: (m: string) => `На какие основания ставят ${m}`,
    racketH: (m: string) => `Что ставят на ${m} игроки Butterfly`,
    player: "Игрок",
    fh: "Форхенд",
    bh: "Бэкхенд",
    blade: "Основание",
    side: "Сторона",
    asOf: "На дату",
    players: "Игроков",
    more: (n: number) => `Показать всех (${n})`,
    sideName: { fh: "форхенд", bh: "бэкхенд", both: "обе стороны", single: "не указано" } as Record<RubberSide, string>,
    singleRow: "сторона не указана",
    source: (d: string) =>
      `Источник: страницы игроков на сайте Butterfly Japan, проверено ${d}; дата в строке — «по состоянию на» с этой страницы. Стороны Butterfly не подписывает: форхенд и бэкхенд — по постоянному порядку «основание → форхенд → бэкхенд».`,
    stats: "Статистика инвентаря всех игроков Butterfly",
    ready: (m: string) => `Готовые ракетки на ${m} в TTMAX`,
  },
};

/** Основи на замовлення однією позицією (у підсумкових таблицях). */
export const CUSTOM: L = { ua: "Основи на замовлення (не продаються)", ru: "Основания на заказ (не продаются)" };

const FAMILY: Record<"alc" | "zlc", { label: L; hub: string }> = {
  alc: { label: { ua: "з арилат-карбоном (ALC і Super ALC)", ru: "с арилат-карбоном (ALC и Super ALC)" }, hub: "/osnovaniya/alc" },
  zlc: { label: { ua: "із ZL-карбоном (ZLC і Super ZLC)", ru: "с ZL-карбоном (ZLC и Super ZLC)" }, hub: "/osnovaniya/zlc" },
};

const th = "border-b border-border-strong px-3 py-2 text-left text-[12px] font-bold uppercase tracking-wide text-ink-muted";
const td = "border-b border-border-subtle px-3 py-2 align-middle";

/** Таблиця «гравець — форхенд — бекхенд — дата». Перші `limit` рядків видно, решта — під <details>. */
export function SetupsTable({ list, locale, limit = 12 }: { list: ProSetup[]; locale: Locale; limit?: number }) {
  const t = T[locale];
  const rows = (items: ProSetup[]) =>
    items.map((s) => (
      <tr key={s.page}>
        <td className={td}>
          <PlayerCell s={s} locale={locale} />
        </td>
        {s.single ? (
          <td className={td} colSpan={2}>
            <ItemCell item={s.single} locale={locale} /> <span className="text-[12px] text-ink-dim">({t.singleRow})</span>
          </td>
        ) : (
          <>
            <td className={td}>
              <ItemCell item={s.fh} locale={locale} />
            </td>
            <td className={td}>
              <ItemCell item={s.bh} locale={locale} />
            </td>
          </>
        )}
        <td className={td}>
          <AsOfCell s={s} />
        </td>
      </tr>
    ));
  const head = (
    <thead>
      <tr>
        <th scope="col" className={th}>
          {t.player}
        </th>
        <th scope="col" className={th}>
          {t.fh}
        </th>
        <th scope="col" className={th}>
          {t.bh}
        </th>
        <th scope="col" className={th}>
          {t.asOf}
        </th>
      </tr>
    </thead>
  );
  const table = (items: ProSetup[]) => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse font-body text-[14px]">
        {head}
        <tbody>{rows(items)}</tbody>
      </table>
    </div>
  );
  return (
    <>
      {table(list.slice(0, limit))}
      {list.length > limit && (
        <details className="mt-2">
          <summary className="cursor-pointer font-body text-[13px] font-semibold text-accent">{t.more(list.length)}</summary>
          <div className="mt-2">{table(list.slice(limit))}</div>
        </details>
      )}
    </>
  );
}

function Footer({ locale }: { locale: Locale }) {
  const t = T[locale];
  return (
    <>
      <p className="mt-3 font-body text-[12px] leading-relaxed text-ink-dim">{t.source(fmtDate(PRO_SETUPS.checked))}</p>
      <Link href={`/${locale}${PRO_STATS_PATH}`} prefetch={false} className="mt-2 inline-block font-body text-[13px] font-semibold text-accent hover:underline">
        {t.stats} →
      </Link>
    </>
  );
}

/** Відповідь першим реченням для основи: хто грає і що найчастіше стоїть. */
function bladeAnswer(model: string, list: ProSetup[], locale: Locale): string {
  const ua = locale === "ua";
  if (list.length === 1) {
    const s = list[0]!;
    const who = s.profile ? PLAYERS[s.profile].name[locale] : s.name;
    const kit = s.single
      ? `${itemLabel(s.single, locale).text}${ua ? " (сторону не вказано)" : " (сторона не указана)"}`
      : ua
        ? `на форхенді ${itemLabel(s.fh!, locale).text}, на бекхенді ${itemLabel(s.bh!, locale).text}`
        : `на форхенде ${itemLabel(s.fh!, locale).text}, на бэкхенде ${itemLabel(s.bh!, locale).text}`;
    return ua
      ? `На ${model} грає ${who}${s.country ? ` (${s.country})` : ""}: ${kit} — за даними Butterfly станом на ${fmtDate(s.asOf)}.`
      : `На ${model} играет ${who}${s.country ? ` (${s.country})` : ""}: ${kit} — по данным Butterfly на ${fmtDate(s.asOf)}.`;
  }
  const r = rubberRanking(list);
  const fh = topPhrase(r.fh, locale);
  const bh = topPhrase(r.bh, locale);
  const head = ua
    ? `На ${model} ${play(list.length, locale)} ${playersN(list.length, locale)} Butterfly — так зазначено на їхніх офіційних сторінках на сайті Butterfly Japan.`
    : `На ${model} ${play(list.length, locale)} ${playersN(list.length, locale)} Butterfly — так указано на их официальных страницах на сайте Butterfly Japan.`;
  const tail =
    fh && bh
      ? ua
        ? ` На форхенді найчастіше стоїть ${fh}, на бекхенді — ${bh}.`
        : ` На форхенде чаще всего стоит ${fh}, на бэкхенде — ${bh}.`
      : "";
  return head + tail;
}

function ReadyRackets({ blade, list, locale }: { blade: CatalogProduct; list: ProSetup[]; locale: Locale }) {
  const combos = getProductsByCategory("rakety").filter((p) => p.combo?.blade === blade.slug);
  if (combos.length === 0) return null;
  // Першими — збірки з накладками, які реально стоять у гравців на цій основі.
  const used = new Set(list.flatMap((s) => [s.fh?.product, s.bh?.product]).filter(Boolean));
  const score = (p: CatalogProduct) => Number(used.has(p.combo!.fh)) + Number(used.has(p.combo!.bh));
  const pick = [...combos].sort((a, b) => score(b) - score(a) || (a.priority ?? 3) - (b.priority ?? 3)).slice(0, 6);
  return (
    <div className="mt-5">
      <p className="font-body text-[14px] font-bold text-ink">{T[locale].ready(blade.model)}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {pick.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/${locale}${getProductPath(p)}`}
              prefetch={false}
              className="inline-block rounded-full border border-border-subtle px-3 py-1.5 font-body text-[13px] text-ink-muted transition-colors hover:border-accent/50 hover:text-ink"
            >
              {p.model}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Shell({ title, answer, children }: { title: string; answer: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} data-pro-setups>
      <h2 className="mb-3 mt-2 font-display text-lg font-bold uppercase tracking-[0.04em]">{title}</h2>
      <p className="mb-4 max-w-3xl font-body text-[15px] leading-relaxed text-ink">{answer}</p>
      {children}
    </section>
  );
}

/** Таблиця «накладка — форхенд — бекхенд» (скільки гравців). */
export function RubberRankTable({ list, locale, limit = 6 }: { list: ProSetup[]; locale: Locale; limit?: number }) {
  const t = T[locale];
  const r = rubberRanking(list);
  const keys = r.any.slice(0, limit);
  const n = (xs: Count[], k: string) => xs.find((c) => c.key === k)?.n ?? 0;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse font-body text-[14px]">
        <thead>
          <tr>
            <th scope="col" className={th}>
              {locale === "ua" ? "Накладка" : "Накладка"}
            </th>
            <th scope="col" className={th}>
              {t.fh}
            </th>
            <th scope="col" className={th}>
              {t.bh}
            </th>
          </tr>
        </thead>
        <tbody>
          {keys.map((c) => (
            <tr key={c.key}>
              <td className={td}>
                <ItemCell item={c.item} locale={locale} />
              </td>
              <td className={td}>{n(r.fh, c.key)}</td>
              <td className={td}>{n(r.bh, c.key)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Основа, на якій гравців Butterfly немає: що стоїть на основах ТОГО САМОГО волокна (ALC / ZLC).
 * Це факт про групу, а не порада для цієї моделі — так і сказано в тексті.
 */
function FamilyFallback({ product, locale }: { product: CatalogProduct; locale: Locale }) {
  const fam = fiberFamily(product.base?.surface);
  if (!fam) return null;
  const list = setupsWithFamily(fam);
  if (list.length < 8) return null;
  const r = rubberRanking(list);
  const fh = topPhrase(r.fh, locale);
  const bh = topPhrase(r.bh, locale);
  const ua = locale === "ua";
  const f = FAMILY[fam];
  const answer = ua
    ? `Гравців Butterfly саме з ${product.model} в офіційних даних Butterfly Japan немає. На основах ${f.label.ua} ${play(list.length, locale)} ${playersN(list.length, locale)} Butterfly; на форхенді в них найчастіше ${fh}, на бекхенді — ${bh}.`
    : `Игроков Butterfly именно с ${product.model} в официальных данных Butterfly Japan нет. На основаниях ${f.label.ru} ${play(list.length, locale)} ${playersN(list.length, locale)} Butterfly; на форхенде у них чаще всего ${fh}, на бэкхенде — ${bh}.`;
  return (
    <Shell title={T[locale].bladeH(product.model)} answer={answer}>
      <RubberRankTable list={list} locale={locale} />
      <Link href={`/${locale}${f.hub}`} prefetch={false} className="mt-3 inline-block font-body text-[13px] font-semibold text-accent hover:underline">
        {ua ? `Усі основи ${f.label.ua}` : `Все основания ${f.label.ru}`} →
      </Link>
      <ReadyRackets blade={product} list={list} locale={locale} />
      <Footer locale={locale} />
    </Shell>
  );
}

function BladeBlock({ product, locale }: { product: CatalogProduct; locale: Locale }) {
  const list = setupsWithBlade(product.slug);
  if (list.length === 0) return <FamilyFallback product={product} locale={locale} />;
  return (
    <Shell title={T[locale].bladeH(product.model)} answer={bladeAnswer(product.model, list, locale)}>
      <SetupsTable list={list} locale={locale} />
      <ReadyRackets blade={product} list={list} locale={locale} />
      <Footer locale={locale} />
    </Shell>
  );
}

function RubberBlock({ product, locale }: { product: CatalogProduct; locale: Locale }) {
  const uses = setupsWithRubber(product.slug);
  if (uses.length === 0) return null;
  const t = T[locale];
  const ua = locale === "ua";
  const fh = uses.filter((u) => u.side === "fh" || u.side === "both").length;
  const bh = uses.filter((u) => u.side === "bh" || u.side === "both").length;
  const both = uses.filter((u) => u.side === "both").length;
  const single = uses.filter((u) => u.side === "single").length;
  const blades = bladeRanking(uses.map((u) => u.setup));
  const topBlades = blades.filter((b) => b.key !== "custom").slice(0, 3);
  const custom = blades.find((b) => b.key === "custom")?.n ?? 0;
  const list = (xs: Count[]) => xs.map((b) => `${itemLabel(b.item, locale).text} (${b.n})`).join(", ");

  let answer = ua
    ? `${product.model} — в інвентарі ${playersN(uses.length, locale)} Butterfly: на форхенді в ${fh}, на бекхенді в ${bh}`
    : `${product.model} — в инвентаре ${playersN(uses.length, locale)} Butterfly: на форхенде у ${fh}, на бэкхенде у ${bh}`;
  if (both > 0) answer += ua ? ` (з обох боків — у ${both})` : ` (с обеих сторон — у ${both})`;
  if (single > 0) answer += ua ? `, ще в ${single} сторону не вказано` : `, ещё у ${single} сторона не указана`;
  answer += ".";
  if (topBlades.length > 0) {
    answer += ua ? ` Найчастіше — з основами ${list(topBlades)}` : ` Чаще всего — с основаниями ${list(topBlades)}`;
    if (custom > 0) answer += ua ? `; ще ${custom} — на основах на замовлення` : `; ещё ${custom} — на основаниях на заказ`;
    answer += ".";
  }

  return (
    <Shell title={t.rubberH(product.model)} answer={answer}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse font-body text-[14px]">
          <thead>
            <tr>
              <th scope="col" className={th}>
                {t.blade}
              </th>
              <th scope="col" className={th}>
                {t.players}
              </th>
            </tr>
          </thead>
          <tbody>
            {blades.slice(0, 10).map((b) => (
              <tr key={b.key}>
                <td className={td}>
                  {b.key === "custom" ? <span>{CUSTOM[locale]}</span> : <ItemCell item={b.item} locale={locale} />}
                </td>
                <td className={td}>{b.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer font-body text-[13px] font-semibold text-accent">{t.more(uses.length)}</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse font-body text-[14px]">
            <thead>
              <tr>
                <th scope="col" className={th}>
                  {t.player}
                </th>
                <th scope="col" className={th}>
                  {t.blade}
                </th>
                <th scope="col" className={th}>
                  {t.side}
                </th>
                <th scope="col" className={th}>
                  {t.asOf}
                </th>
              </tr>
            </thead>
            <tbody>
              {uses.map(({ setup, side }) => (
                <tr key={setup.page}>
                  <td className={td}>
                    <PlayerCell s={setup} locale={locale} />
                  </td>
                  <td className={td}>
                    <ItemCell item={setup.blade} locale={locale} />
                  </td>
                  <td className={td}>{t.sideName[side]}</td>
                  <td className={td}>
                    <AsOfCell s={setup} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <Footer locale={locale} />
    </Shell>
  );
}

function RacketBlock({ product, locale }: { product: CatalogProduct; locale: Locale }) {
  const combo = product.combo;
  const blade = combo ? getProductBySlug(combo.blade) : undefined;
  if (!combo || !blade) return null;
  const list = setupsWithBlade(blade.slug);
  if (list.length === 0) return null;
  const ua = locale === "ua";
  const exact = list.filter((s) => s.fh?.product === combo.fh && s.bh?.product === combo.bh);
  const fhM = getProductBySlug(combo.fh)?.model ?? combo.fh;
  const bhM = getProductBySlug(combo.bh)?.model ?? combo.bh;
  const names = exact.map((s) => (s.profile ? PLAYERS[s.profile].name[locale] : s.name)).join(", ");
  const first = exact.length
    ? ua
      ? `Таку саму збірку — ${blade.model}, ${fhM} на форхенді й ${bhM} на бекхенді — мають: ${names}. `
      : `Такая же сборка — ${blade.model}, ${fhM} на форхенде и ${bhM} на бэкхенде — у: ${names}. `
    : "";
  return (
    <Shell title={T[locale].racketH(blade.model)} answer={first + bladeAnswer(blade.model, list, locale)}>
      <SetupsTable list={list} locale={locale} />
      <Footer locale={locale} />
    </Shell>
  );
}

/** Блок для картки товару: сам вибирає вигляд за типом товару; для решти — нічого. */
export function ProSetupsBlock({ productSlug, locale }: { productSlug?: string; locale: Locale }) {
  const product = productSlug ? getProductBySlug(productSlug) : undefined;
  if (!product) return null;
  if (product.kind === "base") return <BladeBlock product={product} locale={locale} />;
  // У накладок kind не заданий (products.ts) — за замовчуванням це накладка.
  if ((product.kind ?? "rubber") === "rubber") return <RubberBlock product={product} locale={locale} />;
  if (product.kind === "racket") return <RacketBlock product={product} locale={locale} />;
  return null;
}


/* ───────────────────────── Блок для хабів і категорій ───────────────────────── */

export type HubScope = "osnovaniya" | "nakladki" | "rakety" | "alc" | "zlc";

export function hubScopeFor(kind: string, slug: string): HubScope | null {
  if (kind === "category" && (slug === "osnovaniya" || slug === "nakladki" || slug === "rakety")) return slug;
  if (kind === "surfaceGroup" && (slug === "alc" || slug === "zlc")) return slug;
  return null;
}

function BladeCountTable({ rows, locale }: { rows: Count[]; locale: Locale }) {
  const t = T[locale];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[360px] border-collapse font-body text-[14px]">
        <thead>
          <tr>
            <th scope="col" className={th}>
              {t.blade}
            </th>
            <th scope="col" className={th}>
              {t.players}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.key}>
              <td className={td}>{b.key === "custom" ? CUSTOM[locale] : <ItemCell item={b.item} locale={locale} />}</td>
              <td className={td}>{b.n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * «Що в профі» на категорії/хабі: відповідь першим реченням + таблиця. Ті самі цифри, що на
 * сторінці статистики (/igroki/inventar), — сюди лише головне для цього розділу.
 */
export function ProSetupsHub({ scope, locale }: { scope: HubScope; locale: Locale }) {
  const ua = locale === "ua";
  const all = scope === "alc" || scope === "zlc" ? setupsWithFamily(scope) : PRO_SETUPS.setups;
  if (all.length < 5) return null;
  const r = rubberRanking(all);
  const blades = bladeRanking(all);
  const sale = blades.filter((b) => b.key !== "custom");
  const custom = blades.find((b) => b.key === "custom")?.n ?? 0;
  const two = all.filter((s) => s.fh && s.bh).length;
  const top3 = (xs: Count[]) => xs.slice(0, 3).map((c) => `${itemLabel(c.item, locale).text} (${c.n})`).join(", ");
  const src = ua
    ? `за офіційними сторінками гравців на сайті Butterfly Japan (враховано: ${all.length})`
    : `по официальным страницам игроков на сайте Butterfly Japan (учтено: ${all.length})`;

  let title: string;
  let answer: string;
  let body: React.ReactNode;
  if (scope === "osnovaniya") {
    title = ua ? "На яких основах грають профі Butterfly" : "На каких основаниях играют профи Butterfly";
    answer = ua
      ? `З основ, що є в продажу, у гравців Butterfly найчастіше ${top3(sale)} — ${src}. Ще ${playersN(custom, locale)} — на основах на замовлення, яких у продажу немає.`
      : `Из оснований, которые есть в продаже, у игроков Butterfly чаще всего ${top3(sale)} — ${src}. Ещё ${playersN(custom, locale)} — на основаниях на заказ, которых в продаже нет.`;
    body = <BladeCountTable rows={sale.slice(0, 8)} locale={locale} />;
  } else if (scope === "nakladki") {
    title = ua ? "Які накладки ставлять профі Butterfly" : "Какие накладки ставят профи Butterfly";
    answer = ua
      ? `На форхенді в гравців Butterfly найчастіше ${topPhrase(r.fh, locale)}, на бекхенді — ${topPhrase(r.bh, locale)}: з ${two}, у кого вказано обидві накладки, ${src}.`
      : `На форхенде у игроков Butterfly чаще всего ${topPhrase(r.fh, locale)}, на бэкхенде — ${topPhrase(r.bh, locale)}: из ${two}, у кого указаны обе накладки, ${src}.`;
    body = <RubberRankTable list={all} locale={locale} limit={8} />;
  } else if (scope === "rakety") {
    const best = setupRanking(all)[0];
    const kit = best
      ? `${itemLabel(best.blade, locale).text} + ${itemLabel(best.fh, locale).text} / ${itemLabel(best.bh, locale).text} (${best.n})`
      : null;
    title = ua ? "Яку ракетку збирають профі Butterfly" : "Какую ракетку собирают профи Butterfly";
    answer = ua
      ? `У гравців Butterfly найчастіша основа з продажу — ${topPhrase(sale, locale)}, на форхенді — ${topPhrase(r.fh, locale)}, на бекхенді — ${topPhrase(r.bh, locale)}${kit ? `; найчастіша повна збірка — ${kit}` : ""}. Дані — ${src}.`
      : `У игроков Butterfly самое частое основание из продажи — ${topPhrase(sale, locale)}, на форхенде — ${topPhrase(r.fh, locale)}, на бэкхенде — ${topPhrase(r.bh, locale)}${kit ? `; самая частая полная сборка — ${kit}` : ""}. Данные — ${src}.`;
    body = <RubberRankTable list={all} locale={locale} limit={6} />;
  } else {
    const fam = FAMILY[scope];
    title = ua ? `Що ставлять профі на основи ${scope.toUpperCase()}` : `Что ставят профи на основания ${scope.toUpperCase()}`;
    answer = ua
      ? `На основах ${fam.label.ua} ${play(all.length, locale)} ${playersN(all.length, locale)} Butterfly${custom ? ` (${custom} — на основах на замовлення)` : ""}. Найчастіше — ${top3(sale)}; на форхенді в них ${topPhrase(r.fh, locale)}, на бекхенді — ${topPhrase(r.bh, locale)}.`
      : `На основаниях ${fam.label.ru} ${play(all.length, locale)} ${playersN(all.length, locale)} Butterfly${custom ? ` (${custom} — на основаниях на заказ)` : ""}. Чаще всего — ${top3(sale)}; на форхенде у них ${topPhrase(r.fh, locale)}, на бэкхенде — ${topPhrase(r.bh, locale)}.`;
    body = (
      <div className="grid gap-5 md:grid-cols-2">
        <BladeCountTable rows={sale.slice(0, 6)} locale={locale} />
        <RubberRankTable list={all} locale={locale} limit={6} />
      </div>
    );
  }
  return (
    <div className="mt-12 max-w-4xl" data-pro-setups-hub={scope}>
      <Shell title={title} answer={answer}>
        {body}
        <Footer locale={locale} />
      </Shell>
    </div>
  );
}
