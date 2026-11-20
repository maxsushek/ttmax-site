// Статистика інвентаря гравців Butterfly: які основи й накладки реально стоять у ≈100 профі.
// Дані — src/data/proSetups.ts (офіційні сторінки гравців Butterfly Japan з датою «станом на»).
//
// ⚠️ НЕ КАНІБАЛ /igroki. Там — гравці (карʼєра й інвентар 25 найвідоміших, запит «на чому грають
// професіонали» + імена). Тут — зведені цифри по всіх гравцях Butterfly: «яку накладку найчастіше
// ставлять профі», «найпопулярніша основа». Усі числа рахуються з даних під час збірки.
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, localeToLang, type Locale } from "@/i18n/config";
import { buildBlogMetadata } from "@/lib/seo/blog-metadata";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/jsonld";
import { orgId, websiteId, ref } from "@/lib/seo/ids";
import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/Section";
import {
  PRO_SETUPS,
  PRO_STATS_PATH,
  bladeRanking,
  rubberRanking,
  setupFamily,
  setupRanking,
  type Count,
  type ProSetup,
} from "@/data/proSetups";
import {
  AsOfCell,
  CUSTOM,
  ItemCell,
  PlayerCell,
  RubberRankTable,
  itemLabel,
  playersN,
  topPhrase,
} from "@/components/catalog/ProSetupsBlock";
import { fmtDate } from "@/components/content/PlayerProfileView";

export const revalidate = false;

type L = Record<Locale, string>;
const th = "border-b border-border-strong px-3 py-2 text-left text-[12px] font-bold uppercase tracking-wide text-ink-muted";
const td = "border-b border-border-subtle px-3 py-2 align-middle";

/** Усі числа сторінки — з даних, тут і рахуються (title/description теж). */
function stats() {
  const all = PRO_SETUPS.setups;
  const two = all.filter((s) => s.fh && s.bh);
  const r = rubberRanking(all);
  const blades = bladeRanking(all);
  const catalogBlades = blades.filter((b) => b.key !== "custom" && b.item.product);
  const custom = blades.find((b) => b.key === "custom")?.n ?? 0;
  const sameBoth = two.filter((s) => s.fh!.product && s.fh!.product === s.bh!.product).length;
  const men = all.filter((s) => s.women === false);
  const women = all.filter((s) => s.women === true);
  const fam = { alc: 0, zlc: 0, other: 0 };
  for (const s of all) fam[setupFamily(s) ?? "other"]++;
  const customSetups = all.filter((s) => s.blade.custom);
  const customFam = { alc: 0, zlc: 0, other: 0 };
  for (const s of customSetups) customFam[setupFamily(s) ?? "other"]++;
  const dates = all.map((s) => s.asOf).sort();
  return { all, two, r, blades, catalogBlades, custom, sameBoth, men, women, fam, customSetups, customFam, minDate: dates[0]!, maxDate: dates[dates.length - 1]! };
}

const name = (c: Count | undefined, locale: Locale) => (c ? itemLabel(c.item, locale).text : "—");

function texts(locale: Locale) {
  const s = stats();
  const ua = locale === "ua";
  const fh1 = s.r.fh[0];
  const bh1 = s.r.bh[0];
  const b1 = s.catalogBlades[0];
  const n = s.all.length;
  return {
    s,
    title: ua ? "Інвентар профі Butterfly: основи й накладки | TTMAX" : "Инвентарь профи Butterfly: основания и накладки | TTMAX",
    description: ua
      ? `📊 Інвентар гравців Butterfly (${n}): на форхенді найчастіше ${name(fh1, locale)} (${fh1?.n}), на бекхенді — ${name(bh1, locale)} (${bh1?.n}). Основи, збірки, джерела.`
      : `📊 Инвентарь игроков Butterfly (${n}): на форхенде чаще всего ${name(fh1, locale)} (${fh1?.n}), на бэкхенде — ${name(bh1, locale)} (${bh1?.n}). Основания, сборки, источники.`,
    h1: ua ? "Які основи й накладки у профі: статистика інвентаря Butterfly" : "Какие основания и накладки у профи: статистика инвентаря Butterfly",
    answer: ua
      ? `Серед гравців Butterfly, чий інвентар опубліковано на сайті Butterfly Japan (їх ${n}), найпопулярніша накладка на форхенді — ${name(fh1, locale)}: вона стоїть у ${fh1?.n} з ${s.two.length}, у кого вказано обидві накладки. На бекхенді найчастіше ${topPhrase(s.r.bh, locale)}. З основ, що є в продажу, лідирує ${name(b1, locale)} (${b1?.n}), а ще ${playersN(s.custom, locale)} — на основах на замовлення.`
      : `Среди игроков Butterfly, чей инвентарь опубликован на сайте Butterfly Japan (их ${n}), самая популярная накладка на форхенде — ${name(fh1, locale)}: она стоит у ${fh1?.n} из ${s.two.length}, у кого указаны обе накладки. На бэкхенде чаще всего ${topPhrase(s.r.bh, locale)}. Из оснований, которые есть в продаже, лидирует ${name(b1, locale)} (${b1?.n}), а ещё ${playersN(s.custom, locale)} — на основаниях на заказ.`,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: l } = await params;
  if (!isLocale(l)) return {};
  const t = texts(l);
  return buildBlogMetadata({ locale: l, pathname: PRO_STATS_PATH, title: t.title, description: t.description });
}

const UI = {
  ua: {
    home: "Головна",
    players: "Гравці",
    crumb: "Статистика інвентаря",
    checked: "Звірено з Butterfly Japan",
    range: "дати «станом на» в гравців",
    blades: "Основи профі Butterfly",
    bladesText: "Скільки гравців Butterfly грають на кожній основі. Основи на замовлення Butterfly робить спеціально для гравця — у продажу їх немає.",
    rubbers: "Накладки на форхенді й бекхенді",
    rubbersText: "Скільки гравців ставлять накладку на кожну сторону. Враховано гравців, у яких на сторінці Butterfly вказано дві накладки; сторони — за сталим порядком «основа → форхенд → бекхенд».",
    setups: "Найчастіші збірки",
    setupsText: "Однакові комбінації «основа + форхенд + бекхенд» серед основ, що є в продажу.",
    who: "Хто",
    blade: "Основа",
    rubber: "Накладка",
    fh: "Форхенд",
    bh: "Бекхенд",
    count: "Гравців",
    share: "Частка",
    mw: "Чоловіки й жінки",
    mwRow: ["Форхенд — найчастіше", "Бекхенд — найчастіше", "Основа з продажу — найчастіше"],
    men: "Чоловіки",
    women: "Жінки",
    fiber: "З якого волокна основи",
    fiberRows: ["Арилат-карбон (ALC і Super ALC)", "ZL-карбон (ZLC і Super ZLC)", "Інше (дерево, CNF, карбон тощо)"],
    all: "Інвентар усіх гравців",
    player: "Гравець",
    asOf: "Станом на",
    faq: "Питання й відповіді",
    method: "Звідки дані",
    methodText: (d: string) =>
      `Інвентар узято з офіційних сторінок контрактних гравців Butterfly на сайті Butterfly Japan (butterfly.co.jp/players): основа й накладки з датою «станом на». Сторони накладок Butterfly не підписує — форхенд і бекхенд указано за сталим порядком «основа → форхенд → бекхенд»; якщо накладка Butterfly одна, сторону не вказано. Гравців без опублікованого інвентарю не враховано. Остання перевірка — ${d}.`,
    profiles: "Гравці з окремими сторінками: карʼєра й інвентар",
  },
  ru: {
    home: "Главная",
    players: "Игроки",
    crumb: "Статистика инвентаря",
    checked: "Сверено с Butterfly Japan",
    range: "даты «по состоянию на» у игроков",
    blades: "Основания профи Butterfly",
    bladesText: "Сколько игроков Butterfly играют на каждом основании. Основания на заказ Butterfly делает специально для игрока — в продаже их нет.",
    rubbers: "Накладки на форхенде и бэкхенде",
    rubbersText: "Сколько игроков ставят накладку на каждую сторону. Учтены игроки, у которых на странице Butterfly указаны две накладки; стороны — по постоянному порядку «основание → форхенд → бэкхенд».",
    setups: "Самые частые сборки",
    setupsText: "Одинаковые комбинации «основание + форхенд + бэкхенд» среди оснований, которые есть в продаже.",
    who: "Кто",
    blade: "Основание",
    rubber: "Накладка",
    fh: "Форхенд",
    bh: "Бэкхенд",
    count: "Игроков",
    share: "Доля",
    mw: "Мужчины и женщины",
    mwRow: ["Форхенд — чаще всего", "Бэкхенд — чаще всего", "Основание из продажи — чаще всего"],
    men: "Мужчины",
    women: "Женщины",
    fiber: "Из какого волокна основания",
    fiberRows: ["Арилат-карбон (ALC и Super ALC)", "ZL-карбон (ZLC и Super ZLC)", "Другое (дерево, CNF, карбон и т. д.)"],
    all: "Инвентарь всех игроков",
    player: "Игрок",
    asOf: "На дату",
    faq: "Вопросы и ответы",
    method: "Откуда данные",
    methodText: (d: string) =>
      `Инвентарь взят с официальных страниц контрактных игроков Butterfly на сайте Butterfly Japan (butterfly.co.jp/players): основание и накладки с датой «по состоянию на». Стороны накладок Butterfly не подписывает — форхенд и бэкхенд указаны по постоянному порядку «основание → форхенд → бэкхенд»; если накладка Butterfly одна, сторона не указана. Игроки без опубликованного инвентаря не учтены. Последняя проверка — ${d}.`,
    profiles: "Игроки с отдельными страницами: карьера и инвентарь",
  },
};

function faq(locale: Locale) {
  const { s } = texts(locale);
  const d = fmtDate(PRO_SETUPS.checked);
  const fh = s.r.fh;
  const bh = s.r.bh;
  const top3 = (xs: Count[]) => xs.slice(0, 3).map((c) => `${name(c, locale)} (${c.n})`).join(", ");
  const menFh = rubberRanking(s.men).fh;
  const womenFh = rubberRanking(s.women).fh;
  const womenBh = rubberRanking(s.women).bh;
  const items: { q: L; a: L }[] = [
    {
      q: { ua: "Яку накладку найчастіше ставлять профі на форхенд?", ru: "Какую накладку чаще всего ставят профи на форхенд?" },
      a: {
        ua: `${name(fh[0], "ua")} — на форхенді в гравців Butterfly: ${fh[0]?.n} із ${s.two.length} (враховано тих, у кого на офіційній сторінці вказано дві накладки). Далі — ${top3(fh.slice(1))}. Перевірено ${d}.`,
        ru: `${name(fh[0], "ru")} — на форхенде у игроков Butterfly: ${fh[0]?.n} из ${s.two.length} (учтены те, у кого на официальной странице указаны две накладки). Дальше — ${top3(fh.slice(1))}. Проверено ${d}.`,
      },
    },
    {
      q: { ua: "Яку накладку профі ставлять на бекхенд?", ru: "Какую накладку профи ставят на бэкхенд?" },
      a: {
        ua: `На бекхенді вибір рівніший: ${top3(bh)} — серед гравців Butterfly, у кого на сторінці вказано обидві накладки (їх ${s.two.length}). Однакові накладки з обох боків: ${s.sameBoth} із ${s.two.length}.`,
        ru: `На бэкхенде выбор ровнее: ${top3(bh)} — среди игроков Butterfly, у кого на странице указаны обе накладки (их ${s.two.length}). Одинаковые накладки с обеих сторон: ${s.sameBoth} из ${s.two.length}.`,
      },
    },
    {
      q: { ua: "На якій основі грає найбільше профі Butterfly?", ru: "На каком основании играет больше всего профи Butterfly?" },
      a: {
        ua: `Серед основ, що є в продажу, — ${top3(s.catalogBlades)}. Ще ${s.custom} з ${s.all.length} гравців — на основах на замовлення, які Butterfly робить спеціально для них.`,
        ru: `Среди оснований, которые есть в продаже, — ${top3(s.catalogBlades)}. Ещё ${s.custom} из ${s.all.length} игроков — на основаниях на заказ, которые Butterfly делает специально для них.`,
      },
    },
    {
      q: { ua: "Що означає «основа на замовлення» в інвентарі профі?", ru: "Что значит «основание на заказ» в инвентаре профи?" },
      a: {
        ua: `Так Butterfly Japan позначає основу, виготовлену спеціально для гравця (特注); у продажу таких немає. Склад за виносками на сторінках Butterfly: з арилат-карбоном (ALC або Super ALC) — ${s.customFam.alc}, із ZL-карбоном (ZLC або Super ZLC) — ${s.customFam.zlc}, інші — ${s.customFam.other}; усього таких основ — ${s.customSetups.length}.`,
        ru: `Так Butterfly Japan обозначает основание, изготовленное специально для игрока (特注); в продаже таких нет. Состав по сноскам на страницах Butterfly: с арилат-карбоном (ALC или Super ALC) — ${s.customFam.alc}, с ZL-карбоном (ZLC или Super ZLC) — ${s.customFam.zlc}, другие — ${s.customFam.other}; всего таких оснований — ${s.customSetups.length}.`,
      },
    },
    {
      q: { ua: "Чим інвентар жінок відрізняється від чоловічого?", ru: "Чем инвентарь женщин отличается от мужского?" },
      a: {
        ua: `На форхенді лідер той самий — ${name(menFh[0], "ua")} (у чоловіків ${menFh[0]?.n}, у жінок ${womenFh.find((c) => c.key === menFh[0]?.key)?.n ?? 0}). На бекхенді в жінок найчастіше ${topPhrase(womenBh, "ua")}. Враховано: жінок — ${s.women.length}, чоловіків — ${s.men.length}.`,
        ru: `На форхенде лидер тот же — ${name(menFh[0], "ru")} (у мужчин ${menFh[0]?.n}, у женщин ${womenFh.find((c) => c.key === menFh[0]?.key)?.n ?? 0}). На бэкхенде у женщин чаще всего ${topPhrase(womenBh, "ru")}. Учтено: женщин — ${s.women.length}, мужчин — ${s.men.length}.`,
      },
    },
    {
      q: { ua: "Звідки ці дані й наскільки вони свіжі?", ru: "Откуда эти данные и насколько они свежие?" },
      a: {
        ua: `З офіційних сторінок гравців Butterfly на сайті Butterfly Japan; остання перевірка — ${d}. У кожного гравця своя дата «станом на» — від ${fmtDate(s.minDate)} до ${fmtDate(s.maxDate)}; вона вказана в таблиці з посиланням на сторінку Butterfly.`,
        ru: `С официальных страниц игроков Butterfly на сайте Butterfly Japan; последняя проверка — ${d}. У каждого игрока своя дата «по состоянию на» — от ${fmtDate(s.minDate)} до ${fmtDate(s.maxDate)}; она указана в таблице со ссылкой на страницу Butterfly.`,
      },
    },
  ];
  return items;
}

function CountTable({ rows, locale, total, first }: { rows: Count[]; locale: Locale; total: number; first: string }) {
  const u = UI[locale];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse font-body text-[14px]">
        <thead>
          <tr>
            <th scope="col" className={th}>
              {first}
            </th>
            <th scope="col" className={th}>
              {u.count}
            </th>
            <th scope="col" className={th}>
              {u.share}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.key}>
              <td className={td}>{c.key === "custom" ? CUSTOM[locale] : <ItemCell item={c.item} locale={locale} />}</td>
              <td className={td}>{c.n}</td>
              <td className={td}>{Math.round((c.n / total) * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ProStatsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale: Locale = l;
  const u = UI[locale];
  const t = texts(locale);
  const s = t.s;
  const url = `${siteConfig.url}/${locale}${PRO_STATS_PATH}`;
  const qa = faq(locale);

  const breadcrumb = breadcrumbJsonLd(
    [
      { name: u.home, path: "/" },
      { name: u.players, path: "/igroki" },
      { name: u.crumb, path: PRO_STATS_PATH },
    ],
    locale,
  );
  // Dataset: таблиця інвентаря — відкриті дані з джерелом і датою (Google Dataset Search, ШІ-асистенти).
  const dataset = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${url}#dataset`,
    name: t.h1,
    description: t.answer,
    url,
    inLanguage: localeToLang[locale],
    dateModified: PRO_SETUPS.checked,
    temporalCoverage: `${s.minDate}/${s.maxDate}`,
    isAccessibleForFree: true,
    creator: ref(orgId()),
    publisher: ref(orgId()),
    isPartOf: ref(websiteId()),
    isBasedOn: PRO_SETUPS.source,
    keywords: ["Butterfly", "table tennis", "pro equipment", "blade", "rubber", "Dignics", "Zyre 03", "Tenergy"],
    variableMeasured: ["player", "country", "blade", "forehand rubber", "backhand rubber", "as of date"],
    distribution: [
      { "@type": "DataDownload", encodingFormat: "text/markdown", contentUrl: `${siteConfig.url}/llms/inventar.txt` },
    ],
  };
  const faqLd = faqJsonLd(qa.map((f) => ({ q: f.q[locale], a: f.a[locale] })));

  const setups = setupRanking(s.all).filter((x) => x.n >= 2);
  const menR = rubberRanking(s.men);
  const womenR = rubberRanking(s.women);
  const menB = bladeRanking(s.men).filter((b) => b.key !== "custom");
  const womenB = bladeRanking(s.women).filter((b) => b.key !== "custom");
  const byName = [...s.all].sort((a: ProSetup, b: ProSetup) => a.name.localeCompare(b.name));
  const h2 = "font-display text-xl font-black uppercase sm:text-2xl";
  const lead = "mt-2 max-w-3xl font-body text-[14px] leading-relaxed text-ink-muted";

  return (
    <div className="py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dataset) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Container className="max-w-4xl">
        <nav className="font-body text-[13px] text-ink-muted" aria-label="breadcrumb">
          <Link href={`/${locale}`} className="hover:text-ink">
            {u.home}
          </Link>{" "}
          /{" "}
          <Link href={`/${locale}/igroki`} className="hover:text-ink">
            {u.players}
          </Link>{" "}
          / <span className="text-ink">{u.crumb}</span>
        </nav>
        <h1 className="mt-3 text-balance font-display text-display-md font-black uppercase">{t.h1}</h1>
        <p className="mt-4 max-w-3xl font-body text-[16px] leading-relaxed text-ink">{t.answer}</p>
        <p className="mt-2 font-body text-[12px] text-ink-dim">
          {u.checked}: <time dateTime={PRO_SETUPS.checked}>{fmtDate(PRO_SETUPS.checked)}</time> · {u.range}: {fmtDate(s.minDate)}–{fmtDate(s.maxDate)}
        </p>

        <section id="rubbers" className="mt-10 scroll-mt-24">
          <h2 className={h2}>{u.rubbers}</h2>
          <p className={lead}>{u.rubbersText}</p>
          <div className="mt-4">
            <RubberRankTable list={s.all} locale={locale} limit={12} />
          </div>
        </section>

        <section id="blades" className="mt-10 scroll-mt-24">
          <h2 className={h2}>{u.blades}</h2>
          <p className={lead}>{u.bladesText}</p>
          <div className="mt-4">
            <CountTable rows={s.blades} locale={locale} total={s.all.length} first={u.blade} />
          </div>
        </section>

        {setups.length > 0 && (
          <section id="setups" className="mt-10 scroll-mt-24">
            <h2 className={h2}>{u.setups}</h2>
            <p className={lead}>{u.setupsText}</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse font-body text-[14px]">
                <thead>
                  <tr>
                    {[u.blade, u.fh, u.bh, u.count, u.who].map((h) => (
                      <th key={h} scope="col" className={th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {setups.map((x) => (
                    <tr key={`${x.blade.product}-${x.fh.product}-${x.bh.product}`}>
                      <td className={td}>
                        <ItemCell item={x.blade} locale={locale} />
                      </td>
                      <td className={td}>
                        <ItemCell item={x.fh} locale={locale} />
                      </td>
                      <td className={td}>
                        <ItemCell item={x.bh} locale={locale} />
                      </td>
                      <td className={td}>{x.n}</td>
                      <td className={`${td} text-[13px] text-ink-muted`}>{x.who.map((w) => w.name).join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section id="men-women" className="mt-10 scroll-mt-24">
          <h2 className={h2}>{u.mw}</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse font-body text-[14px]">
              <thead>
                <tr>
                  <th scope="col" className={th}></th>
                  <th scope="col" className={th}>
                    {u.men} ({s.men.length})
                  </th>
                  <th scope="col" className={th}>
                    {u.women} ({s.women.length})
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  [menR.fh, womenR.fh],
                  [menR.bh, womenR.bh],
                  [menB, womenB],
                ].map(([m, w], i) => (
                  <tr key={i}>
                    <th scope="row" className={`${td} text-left font-semibold text-ink-muted`}>
                      {u.mwRow[i]}
                    </th>
                    <td className={td}>{topPhrase(m!, locale) ?? "—"}</td>
                    <td className={td}>{topPhrase(w!, locale) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="fiber" className="mt-10 scroll-mt-24">
          <h2 className={h2}>{u.fiber}</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse font-body text-[14px]">
              <tbody>
                {[s.fam.alc, s.fam.zlc, s.fam.other].map((n, i) => (
                  <tr key={i}>
                    <th scope="row" className={`${td} text-left font-semibold text-ink`}>
                      {u.fiberRows[i]}
                    </th>
                    <td className={td}>{n}</td>
                    <td className={td}>{Math.round((n / s.all.length) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { href: "/osnovaniya/alc", ua: "Основи ALC", ru: "Основания ALC" },
              { href: "/osnovaniya/zlc", ua: "Основи ZLC", ru: "Основания ZLC" },
              { href: "/nakladki", ua: "Накладки Butterfly", ru: "Накладки Butterfly" },
              { href: "/rakety", ua: "Готові ракетки", ru: "Готовые ракетки" },
            ].map((x) => (
              <Link
                key={x.href}
                href={`/${locale}${x.href}`}
                prefetch={false}
                className="rounded-full border border-border-subtle px-3 py-1.5 font-body text-[13px] text-ink-muted transition-colors hover:border-accent/50 hover:text-ink"
              >
                {x[locale]}
              </Link>
            ))}
          </div>
        </section>

        <section id="all" className="mt-10 scroll-mt-24">
          <h2 className={h2}>
            {u.all} ({s.all.length})
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse font-body text-[14px]">
              <thead>
                <tr>
                  {[u.player, u.blade, u.fh, u.bh, u.asOf].map((h) => (
                    <th key={h} scope="col" className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byName.map((x) => (
                  <tr key={x.page}>
                    <td className={td}>
                      <PlayerCell s={x} locale={locale} />
                    </td>
                    <td className={td}>
                      <ItemCell item={x.blade} locale={locale} />
                    </td>
                    {x.single ? (
                      <td className={td} colSpan={2}>
                        <ItemCell item={x.single} locale={locale} />{" "}
                        <span className="text-[12px] text-ink-dim">({locale === "ua" ? "сторону не вказано" : "сторона не указана"})</span>
                      </td>
                    ) : (
                      <>
                        <td className={td}>
                          <ItemCell item={x.fh} locale={locale} />
                        </td>
                        <td className={td}>
                          <ItemCell item={x.bh} locale={locale} />
                        </td>
                      </>
                    )}
                    <td className={td}>
                      <AsOfCell s={x} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link href={`/${locale}/igroki`} prefetch={false} className="mt-3 inline-block font-body text-[13px] font-semibold text-accent hover:underline">
            {u.profiles} →
          </Link>
        </section>

        <section id="faq" className="mt-12 scroll-mt-24">
          <h2 className={h2}>{u.faq}</h2>
          <div className="mt-4 flex flex-col gap-5">
            {qa.map((f, i) => (
              <div key={i}>
                <h3 className="mb-1 font-body text-[15px] font-bold text-ink">{f.q[locale]}</h3>
                <p className="font-body text-[14px] leading-relaxed text-ink-muted">{f.a[locale]}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 border-t border-border-subtle pt-5">
          <h2 className="font-display text-[12px] font-bold uppercase tracking-[0.1em] text-ink-muted">{u.method}</h2>
          <p className="mt-2 max-w-3xl font-body text-[13px] leading-relaxed text-ink-muted">{u.methodText(fmtDate(PRO_SETUPS.checked))}</p>
          <a href={PRO_SETUPS.source} target="_blank" rel="noopener" className="mt-2 inline-block font-body text-[13px] text-ink-muted hover:text-ink hover:underline">
            butterfly.co.jp/players
          </a>
        </section>
      </Container>
    </div>
  );
}

