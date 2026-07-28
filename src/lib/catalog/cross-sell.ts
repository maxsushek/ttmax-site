// src/lib/catalog/cross-sell.ts
// Підбір кандидатів для блоку «Схожі товари».
//
// ⚠️ НАВІЩО ПЕРЕПИСАНО. Раніше сусіди бралися за АЛФАВІТОМ слага, тому блок радив
// несумісні речі й ліпив дорогі флагмани поруч із дешевими універсалами:
//   apolonia-zlc (ZLC-флагман, OFF+ атака, 12 995 ₴) → dimitrij-ovtcharov (OFF− універсал)
//   viscaria     (OFF+ атака,  8 835 ₴)              → xstar-v (OFF− універсал, 2 595 ₴)
// Плюс граф виходив украй нерівним: 14 money-товарів мали НУЛЬ вхідних посилань.
//
// ЯК ПРАЦЮЄ ЗАРАЗ.
// Ключова ідея: слоти роздаються З УРАХУВАННЯМ ПОТОЧНОГО НАВАНТАЖЕННЯ кандидата, а не
// «спершу порахували релевантність, потім латаємо дірки». До балів релевантності
// додається (а) бонус пріоритетним товарам власника, (б) бонус за НЕДОБІР до цілі,
// (в) ШТРАФ за перебір. Штраф більший за бонус — інакше товар, релевантний багатьом
// (Tenergy 05 підходить до 10 своїх же моделей), виграє слот за слотом і забирає вагу
// в решти пріоритетного списку. Саме через це перша версія давала розкид 5-14 всередині
// списку власника; тепер коридор 7-10.
//
// Далі два ремонтні проходи: спершу ПІДЛОГА для всіх money-карток (щоб ніхто не лишився
// нижче MIN_IN_DEGREE), потім добір пріоритетних до їхньої цілі. Порядок важливий —
// якщо навпаки, пріоритетні розбирають донорські слоти й звичайні падають нижче підлоги.
//
// Модуль СВІДОМО чистий (приймає pool аргументом і не імпортує data/catalog/index),
// інакше вийшов би цикл імпортів.
import type { CatalogProduct } from "@/types/catalog";
import {
  MARGIN_PRIORITY,
  PRIORITY_BONUS,
  MIN_IN_DEGREE,
  PRIORITY_TARGET_IN_DEGREE,
  DEFICIT_WEIGHT,
  SURPLUS_PENALTY,
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

  const MONEY = new Set(["nakladki", "osnovaniya"]);
  const inDegree = new Map<string, number>();
  for (const p of pool) inDegree.set(p.slug, 0);

  /** Скільки вхідних посилань «належить» товару. */
  const targetOf = (slug: string) =>
    priority.has(slug) ? PRIORITY_TARGET_IN_DEGREE : MIN_IN_DEGREE;

  /** Бонус за недобір / штраф за перебір — те, що вирівнює розподіл. */
  const loadAdjust = (slug: string) => {
    const diff = targetOf(slug) - (inDegree.get(slug) ?? 0);
    return diff > 0 ? diff * DEFICIT_WEIGHT : diff * SURPLUS_PENALTY;
  };

  const graph = new Map<string, string[]>();

  // Прохід 1 — роздача слотів із урахуванням навантаження.
  // Порядок карток фіксований (за slug), щоб результат не «плавав» між білдами.
  for (const p of [...pool].sort((a, b) => a.slug.localeCompare(b.slug))) {
    if (p.crossSell && p.crossSell.length > 0) {
      graph.set(p.slug, [...p.crossSell]);
      for (const slug of p.crossSell.slice(0, VISIBLE_SLOTS)) {
        inDegree.set(slug, (inDegree.get(slug) ?? 0) + 1);
      }
      continue;
    }

    const candidates = (byCategory.get(p.categorySlug) ?? []).filter((c) => c.slug !== p.slug);
    const picked: string[] = [];

    for (let slot = 0; slot < Math.min(VISIBLE_SLOTS, candidates.length); slot += 1) {
      let bestSlug: string | null = null;
      let bestScore = -Infinity;
      for (const c of candidates) {
        if (picked.includes(c.slug)) continue;
        const total =
          score(p, c) + (priority.has(c.slug) ? PRIORITY_BONUS : 0) + loadAdjust(c.slug);
        // Тайбрейк за slug — стабільність між білдами.
        if (total > bestScore || (total === bestScore && bestSlug && c.slug < bestSlug)) {
          bestScore = total;
          bestSlug = c.slug;
        }
      }
      if (!bestSlug) break;
      picked.push(bestSlug);
      inDegree.set(bestSlug, (inDegree.get(bestSlug) ?? 0) + 1);
    }

    // Хвіст пулу — чиста релевантність. Викликач ріже до 4 ПІСЛЯ filterVisible(),
    // тож запас потрібен на випадок, коли частину кандидатів приховано (товари без фото).
    const tail = candidates
      .filter((c) => !picked.includes(c.slug))
      .map((c) => ({ slug: c.slug, s: score(p, c) }))
      .sort((x, y) => y.s - x.s || x.slug.localeCompare(y.slug))
      .slice(0, POOL_SIZE - picked.length)
      .map((x) => x.slug);

    graph.set(p.slug, [...picked, ...tail]);
  }

  /**
   * Ремонт: тягне money-картки до цілі, витісняючи найзавантаженішого з видимої четвірки.
   * `floor` захищає донора — нижче нього не опускаємо, інакше витягуючи одного
   * створюємо нову сироту.
   */
  const repair = (target: (slug: string) => number, floor: (slug: string) => number) => {
    for (let guard = 0; guard < 60; guard += 1) {
      const needy = pool
        .filter((p) => MONEY.has(p.categorySlug) && (inDegree.get(p.slug) ?? 0) < target(p.slug))
        .sort(
          (a, b) =>
            (inDegree.get(a.slug) ?? 0) - target(a.slug) - ((inDegree.get(b.slug) ?? 0) - target(b.slug)),
        );
      if (needy.length === 0) break;

      let progressed = false;
      for (const orphan of needy) {
        const donors = (byCategory.get(orphan.categorySlug) ?? [])
          .filter((c) => c.slug !== orphan.slug)
          .map((c) => ({ c, s: score(orphan, c) }))
          .sort((x, y) => y.s - x.s || x.c.slug.localeCompare(y.c.slug));

        for (const { c } of donors) {
          const list = graph.get(c.slug);
          if (!list || list.includes(orphan.slug)) continue;
          // Явний crossSell — авторський вибір, не чіпаємо.
          if (c.crossSell && c.crossSell.length > 0) continue;

          // Витісняємо НАЙЗАВАНТАЖЕНІШОГО з видимої четвірки — так вага йде від тих,
          // у кого надлишок, а не від першого-ліпшого.
          let at = -1;
          let richest = -Infinity;
          for (let i = 0; i < Math.min(VISIBLE_SLOTS, list.length); i += 1) {
            const slug = list[i];
            if (!slug) continue;
            const deg = inDegree.get(slug) ?? 0;
            if (deg > floor(slug) && deg > richest) {
              richest = deg;
              at = i;
            }
          }
          if (at < 0) continue;

          const displaced = list[at];
          list.splice(at, 0, orphan.slug);
          inDegree.set(orphan.slug, (inDegree.get(orphan.slug) ?? 0) + 1);
          if (displaced) inDegree.set(displaced, (inDegree.get(displaced) ?? 0) - 1);
          if (list.length > POOL_SIZE) list.length = POOL_SIZE;
          progressed = true;
          break;
        }
      }
      if (!progressed) break;
    }
  };

  const floorAll = () => MIN_IN_DEGREE;
  // Спершу підлога для ВСІХ money-карток…
  repair(floorAll, floorAll);
  // …і лише потім добір пріоритетних до цілі. Підлога лишається базовою — нікого не обвалюємо.
  repair((slug) => (priority.has(slug) ? PRIORITY_TARGET_IN_DEGREE : 0), floorAll);

  return graph;
}
