// src/lib/catalog/cross-sell.ts
// Підбір кандидатів для блоку «Схожі товари».
//
// ⚠️ НАВІЩО ПЕРЕПИСАНО. Раніше сусіди бралися за АЛФАВІТОМ слага, тому блок радив
// несумісні речі й ліпив дорогі флагмани поруч із дешевими універсалами:
//   apolonia-zlc (ZLC-флагман, OFF+ атака, 12 995 ₴) → dimitrij-ovtcharov (OFF− універсал)
//   viscaria     (OFF+ атака,  8 835 ₴)              → xstar-v (OFF− універсал, 2 595 ₴)
//   mizutani-super-zlc                               → рівно 4 наступні слаги за алфавітом
// Плюс граф виходив нерівним: 14 money-товарів мали НУЛЬ вхідних посилань (5 із 7
// накладок — Tenergy, тобто саме та серія, куди треба заганяти вагу).
//
// ЯК ПРАЦЮЄ ЗАРАЗ — два проходи:
//   1) СКОРИНГ. Кожен кандидат отримує бали за реальну сумісність (серія, волокно,
//      клас основи, тип поверхні, жорсткість, близькість ціни). Маржа власника —
//      лише невеликий тайбрейкер (priority.ts), а не головний фактор.
//   2) ВИРІВНЮВАННЯ ГРАФА. Після скорингу товари з нестачею вхідних посилань
//      примусово підставляються в топ до найрелевантніших сусідів, у яких надлишок.
//      Без цього кроку жорсткий фільтр лише стягує граф у щільні кластери, а «сироти»
//      (напр. timo-boll-control/forte/fortissimo — ALL/ALL+ серед моря OFF) лишаються
//      з нулем назавжди.
//
// Модуль СВІДОМО чистий (приймає pool аргументом і не імпортує data/catalog/index),
// інакше вийшов би цикл імпортів.
import type { CatalogProduct } from "@/types/catalog";
import {
  MARGIN_PRIORITY,
  PRIORITY_BONUS,
  MIN_IN_DEGREE,
  PRIORITY_MIN_IN_DEGREE,
} from "@/data/catalog/priority";

/** Скільки кандидатів тримаємо в пулі. Викликач ріже до 4 ПІСЛЯ filterVisible(). */
const POOL_SIZE = 10;
/** Позицій згори, які вважаємо «показаними» — на них і рахуємо вхідні посилання. */
const VISIBLE_SLOTS = 4;

/** Клас основи за зростанням атакувальності — сусідні класи сумісні, далекі ні. */
const BLADE_ORDER = ["def", "all", "all-plus", "off-minus", "off", "off-plus"] as const;

/** Сімʼї волокна: всередині сімʼї основи грають схоже. */
const SURFACE_FAMILY: Record<string, string> = {
  alc: "alc",
  "super-alc": "alc",
  zlc: "zlc",
  "super-zlc": "zlc",
  zlf: "zlc",
  carbon: "carbon",
  t5000: "carbon",
  caf: "carbon",
  cnf: "carbon",
  wood: "wood",
};

const priority = new Set(MARGIN_PRIORITY);

/** Мінімальна ціна товару. Локальна копія — щоб не тягнути data/catalog (цикл імпортів). */
function priceOf(p: CatalogProduct): number | undefined {
  const fromVariants = p.variants
    .map((v) => v.price)
    .filter((x): x is number => typeof x === "number");
  if (fromVariants.length > 0) return Math.min(...fromVariants);
  return typeof p.priceFrom === "number" ? p.priceFrom : undefined;
}

/** 0…14 балів за близькість ціни: сусід удвічі дорожчий/дешевший — майже нуль. */
function priceScore(a: CatalogProduct, b: CatalogProduct): number {
  const pa = priceOf(a);
  const pb = priceOf(b);
  if (pa === undefined || pb === undefined || pa <= 0 || pb <= 0) return 0;
  const ratio = pa > pb ? pb / pa : pa / pb;
  return Math.round(Math.max(0, ratio - 0.5) * 28);
}

/** Наскільки товар b підходить як «схожий» до a. Більше — краще. */
function score(a: CatalogProduct, b: CatalogProduct): number {
  let s = 0;

  if (a.seriesSlug && a.seriesSlug === b.seriesSlug) s += 40;

  if (a.base && b.base) {
    if (a.base.surface === b.base.surface) s += 24;
    else if (SURFACE_FAMILY[a.base.surface] === SURFACE_FAMILY[b.base.surface]) s += 16;

    const ia = BLADE_ORDER.indexOf(a.base.bladeClass as (typeof BLADE_ORDER)[number]);
    const ib = BLADE_ORDER.indexOf(b.base.bladeClass as (typeof BLADE_ORDER)[number]);
    if (ia >= 0 && ib >= 0) {
      const d = Math.abs(ia - ib);
      // Свідомо НЕ даємо балів за різницю >1: OFF+ і OFF− — різні ігри,
      // саме на цьому алфавітний підбір і горів.
      if (d === 0) s += 26;
      else if (d === 1) s += 18;
    }
    if (a.base.fiber && a.base.fiber === b.base.fiber) s += 6;
  }

  if (!a.base && !b.base) {
    if (a.surfaceType && a.surfaceType === b.surfaceType) s += 24;
    if (a.playStyle && a.playStyle === b.playStyle) s += 16;

    const ha = a.specs?.hardnessDeg;
    const hb = b.specs?.hardnessDeg;
    if (typeof ha === "number" && typeof hb === "number") {
      const d = Math.abs(ha - hb);
      if (d <= 3) s += 14;
      else if (d <= 6) s += 7;
    }
  }

  if (a.gear?.gearType && a.gear.gearType === b.gear?.gearType) s += 30;

  if (a.level && a.level === b.level) s += 8;
  s += priceScore(a, b);
  if (priority.has(b.slug)) s += PRIORITY_BONUS;

  return s;
}

/**
 * Граф крос-селу: slug → впорядкований список слагів-кандидатів.
 * Будується один раз на процес (викликач мемоізує).
 */
export function buildCrossSellGraph(pool: CatalogProduct[]): Map<string, string[]> {
  const byCategory = new Map<string, CatalogProduct[]>();
  for (const p of pool) {
    const list = byCategory.get(p.categorySlug);
    if (list) list.push(p);
    else byCategory.set(p.categorySlug, [p]);
  }

  // Прохід 1 — скоринг.
  const graph = new Map<string, string[]>();
  for (const p of pool) {
    if (p.crossSell && p.crossSell.length > 0) {
      graph.set(p.slug, [...p.crossSell]);
      continue;
    }
    const ranked = (byCategory.get(p.categorySlug) ?? [])
      .filter((c) => c.slug !== p.slug)
      .map((c) => ({ slug: c.slug, s: score(p, c) }))
      // Тайбрейк за slug — щоб порядок був стабільним між білдами (інакше
      // однакові за балами товари тасувалися б і ламали кеш сторінок).
      .sort((x, y) => y.s - x.s || x.slug.localeCompare(y.slug))
      .slice(0, POOL_SIZE)
      .map((x) => x.slug);
    graph.set(p.slug, ranked);
  }

  // Прохід 2 — вирівнювання: жодна картка money-категорій не лишається без вхідних.
  const MONEY = new Set(["nakladki", "osnovaniya"]);
  const inDegree = new Map<string, number>();
  for (const p of pool) inDegree.set(p.slug, 0);
  for (const [, list] of graph) {
    for (const slug of list.slice(0, VISIBLE_SLOTS)) {
      inDegree.set(slug, (inDegree.get(slug) ?? 0) + 1);
    }
  }

  /** Видає товару РІВНО одне вхідне посилання. true — вдалося. */
  const grantOne = (orphan: CatalogProduct, floor: (slug: string) => number): boolean => {
    const neighbours = (byCategory.get(orphan.categorySlug) ?? []).filter(
      (c) => c.slug !== orphan.slug,
    );

    /**
     * @param evictRichest false — витісняємо рівно 4-ту позицію (зберігає порядок
     * релевантності). true — витісняємо того з видимої четвірки, у кого НАЙБІЛЬШЕ
     * вхідних: без цього «багаті» товари (14 вхідних) сидять на 1-3 місцях і лишаються
     * недосяжними, ємність графа виглядає вичерпаною, хоча насправді вона є.
     */
    const take = (c: CatalogProduct, evictRichest: boolean): boolean => {
      const list = graph.get(c.slug);
      if (!list || list.includes(orphan.slug)) return false;
      // Явний crossSell — авторський вибір, не чіпаємо.
      if (c.crossSell && c.crossSell.length > 0) return false;

      let at = VISIBLE_SLOTS - 1;
      if (evictRichest) {
        let best = -1;
        for (let i = 0; i < Math.min(VISIBLE_SLOTS, list.length); i += 1) {
          const slug = list[i];
          if (!slug) continue;
          const deg = inDegree.get(slug) ?? 0;
          if (deg > floor(slug) && deg > best) {
            best = deg;
            at = i;
          }
        }
        if (best < 0) return false;
      }

      const displaced = list[at];
      // Донор не віддає посилання, якщо витіснений впаде нижче підлоги — інакше,
      // витягуючи одного, ми створюємо нову сироту.
      if (displaced && (inDegree.get(displaced) ?? 0) <= floor(displaced)) return false;

      list.splice(at, 0, orphan.slug);
      inDegree.set(orphan.slug, (inDegree.get(orphan.slug) ?? 0) + 1);
      if (displaced) inDegree.set(displaced, (inDegree.get(displaced) ?? 0) - 1);
      if (list.length > POOL_SIZE) list.length = POOL_SIZE;
      return true;
    };

    // Прохід А — найрелевантніші сусіди. Дає осмислені рекомендації.
    const byRelevance = neighbours
      .map((c) => ({ c, s: score(orphan, c) }))
      .sort((x, y) => y.s - x.s || x.c.slug.localeCompare(y.c.slug));
    for (const { c } of byRelevance) if (take(c, false)) return true;

    // Прохід Б — резерв: витісняємо найбагатшого з видимої четвірки. Потрібен, бо прохід А
    // впирається в підлогу (донор із рівно 3 вхідними віддати не може), і товар лишається
    // нижче норми, хоча вільна ємність у графі є — просто в інших вузлах.
    for (const { c } of byRelevance) if (take(c, true)) return true;
    return false;
  };

  /**
   * Тягне товари категорій MONEY до цільового мінімуму.
   *
   * ⚠️ ДВА РАУНДИ, І ПОРЯДОК ВАЖЛИВИЙ. Спершу підлога для ВСІХ (MIN_IN_DEGREE), і лише
   * потім бонус пріоритетним. Якщо навпаки — пріоритетні розбирають донорські слоти
   * першими, і звичайні товари провалюються нижче підлоги (перевірено симуляцією:
   * 11 карток падали до 1-2 вхідних).
   *
   * ⚠️ РОЗДАЄМО ПО КОЛУ, а не «кожен добирає все й одразу»: жадібний порядок віддавав усю
   * ємність першим у черзі, і останні (Dignics — серія з 4 моделей проти 10 у Tenergy)
   * лишались на підлозі. За один прохід кожен бере МАКСИМУМ одне посилання.
   * Цикл спиняється, коли прохід не дав приросту — вільної ємності справді не лишилось.
   */
  const topUp = (target: (slug: string) => number, floor: (slug: string) => number) => {
    const candidates = pool.filter((p) => MONEY.has(p.categorySlug) && target(p.slug) > 0);
    for (let guard = 0; guard < 50; guard += 1) {
      const needy = candidates
        .filter((p) => (inDegree.get(p.slug) ?? 0) < target(p.slug))
        .sort(
          (a, b) =>
            (inDegree.get(a.slug) ?? 0) / target(a.slug) -
            (inDegree.get(b.slug) ?? 0) / target(b.slug),
        );
      if (needy.length === 0) break;
      let progressed = false;
      for (const orphan of needy) if (grantOne(orphan, floor)) progressed = true;
      if (!progressed) break;
    }
  };

  const base = () => MIN_IN_DEGREE;
  // Раунд 1 — підлога для всіх.
  topUp(base, base);
  // Раунд 2 — пріоритетні товари власника добираються до підвищеного мінімуму.
  // Це і є «перелінковка в пріоритеті на них». Підлога лишається базовою — нікого не обвалюємо.
  topUp((slug) => (priority.has(slug) ? PRIORITY_MIN_IN_DEGREE : 0), base);

  return graph;
}
