// src/lib/reviews/invite-copy.ts
// Текст запрошення залишити відгук — менеджер копіює його з бота й шле клієнту у Viber/Telegram.
//
// Персоналізація: імʼя клієнта, його товари, підказка «про що написати» під тип товару
// (так відгуки виходять змістовні — і корисні іншим покупцям, і для SEO). Три варіанти
// подачі й дві мови: менеджер перемикає кнопками, щоб розсилка не виглядала шаблонною.
//
// ⚠️ Правила, яких тексти тримаються свідомо:
//  • просимо ЧЕСНИЙ відгук, а не «пʼять зірок» — вибіркове випрошування хороших відгуків
//    (review gating) Google забороняє;
//  • жодних знижок/бонусів за відгук — це «стимульовані відгуки»;
//  • лише правдиві обіцянки: «без реєстрації» (так і є), «хвилина часу».
import type { CatalogProduct } from "@/types/catalog";

export type CopyLang = "uk" | "ru";
export const INVITE_VARIANTS = 3;

type Cat = "rubber" | "base" | "racket" | "shoes" | "clothes" | "bags" | "care" | "balls" | "table" | "other";

const GEAR_CAT: Record<string, Cat> = {
  shoes: "shoes",
  tshirt: "clothes", suit: "clothes", shorts: "clothes", pants: "clothes", track: "clothes",
  jacket: "clothes", skirt: "clothes", sweater: "clothes", socks: "clothes", band: "clothes", cap: "clothes",
  bag: "bags", backpack: "bags", case: "bags", "shoe-bag": "bags", "ball-bag": "bags", "ball-tube": "bags",
  glue: "care", cleaner: "care", care: "care", sponge: "care", film: "care", "edge-tape": "care",
  overgrip: "care", insole: "care",
  balls: "balls",
  table: "table", net: "table",
};

function catOf(p: CatalogProduct): Cat {
  if (p.kind === "racket") return "racket";
  if (p.kind === "base" || p.base) return "base";
  if (p.gear) return GEAR_CAT[p.gear.gearType] ?? "other";
  return "rubber";
}

const ASK: Record<Cat, Record<CopyLang, string>> = {
  rubber: {
    uk: "Найбільше допоможуть деталі: швидкість, обертання, контроль і на якій основі граєте.",
    ru: "Больше всего помогут детали: скорость, вращение, контроль и на каком основании играете.",
  },
  base: {
    uk: "Найбільше допоможуть деталі: відчуття удару, швидкість і з якими накладками граєте.",
    ru: "Больше всего помогут детали: ощущение удара, скорость и с какими накладками играете.",
  },
  racket: {
    uk: "Найбільше допоможуть деталі: як грається ракетка й чи підійшла під ваш рівень.",
    ru: "Больше всего помогут детали: как играется ракетка и подошла ли под ваш уровень.",
  },
  shoes: {
    uk: "Найбільше допоможуть деталі: як сіли за розміром і як тримають підлогу.",
    ru: "Больше всего помогут детали: как сели по размеру и как держат пол.",
  },
  clothes: {
    uk: "Найбільше допоможуть деталі: як сіло за розміром і як тканина поводиться на тренуванні.",
    ru: "Больше всего помогут детали: как село по размеру и как ткань ведёт себя на тренировке.",
  },
  bags: {
    uk: "Найбільше допоможуть деталі: якість, місткість і чи зручно носити.",
    ru: "Больше всего помогут детали: качество, вместительность и удобно ли носить.",
  },
  care: {
    uk: "Найбільше допоможуть деталі: чи зручно користуватися й чи помітний результат.",
    ru: "Больше всего помогут детали: удобно ли пользоваться и заметен ли результат.",
  },
  balls: {
    uk: "Найбільше допоможуть деталі: якість мʼячів, відскок і як довго служать.",
    ru: "Больше всего помогут детали: качество мячей, отскок и как долго служат.",
  },
  table: {
    uk: "Найбільше допоможуть деталі: якість, збирання і як грається.",
    ru: "Больше всего помогут детали: качество, сборка и как играется.",
  },
  other: {
    uk: "Пишіть як є — що сподобалось, що ні й кому б порадили.",
    ru: "Пишите как есть — что понравилось, что нет и кому бы посоветовали.",
  },
};

/** Головний товар замовлення визначає підказку: накладка важливіша за торцеву стрічку. */
const CAT_PRIORITY: Cat[] = ["racket", "base", "rubber", "shoes", "table", "balls", "bags", "clothes", "care", "other"];

/** «Сподіваємось, X вже …» — під тип товару. */
const STATUS: Record<Cat, Record<CopyLang, string>> = {
  rubber: { uk: "вже на ракетці й у грі", ru: "уже на ракетке и в игре" },
  base: { uk: "вже в грі", ru: "уже в игре" },
  racket: { uk: "вже в грі", ru: "уже в игре" },
  shoes: { uk: "вже на майданчику", ru: "уже на площадке" },
  clothes: { uk: "вже на тренуваннях", ru: "уже на тренировках" },
  bags: { uk: "вже з вами на тренуваннях", ru: "уже с вами на тренировках" },
  care: { uk: "вже в справі", ru: "уже в деле" },
  balls: { uk: "вже в грі", ru: "уже в игре" },
  table: { uk: "вже в грі", ru: "уже в игре" },
  other: { uk: "вже радує", ru: "уже радует" },
};

const PLACEHOLDER_NAMES = /^(швидке|быстрый|клієнт|клиент|покупець|покупатель|без імені|без имени|test|тест)/i;

/** «олег моргун» → «Олег»; заглушки CRM («Швидке замовлення») → null. */
export function firstName(raw: string | null | undefined): string | null {
  const s = (raw ?? "").trim();
  if (!s || PLACEHOLDER_NAMES.test(s) || /\d/.test(s)) return null;
  const w = s.split(/\s+/)[0] ?? "";
  if (w.length < 2 || w.length > 20) return null;
  return w.charAt(0).toLocaleUpperCase("uk") + w.slice(1).toLocaleLowerCase("uk");
}

/** Назва без «Butterfly»; кирилична загальна назва — з малої («торцева стрічка Logo …»). */
function shortName(p: CatalogProduct, lang: CopyLang): string {
  const n = (lang === "ru" ? p.name.ru : p.name.ua).replace(/\s*Butterfly\s*/g, " ").replace(/\s+/g, " ").trim();
  return /^[Ѐ-ӿ]/.test(n) ? n.charAt(0).toLocaleLowerCase("uk") + n.slice(1) : n;
}

export type InviteCopy = { full: string; short: string };

export function inviteCopy(opts: {
  lang: CopyLang;
  name: string | null;
  products: CatalogProduct[];
  url: string;
  variant: number;
}): InviteCopy {
  const { lang, url, products } = opts;
  const ru = lang === "ru";
  const name = firstName(opts.name);
  const v = ((opts.variant % INVITE_VARIANTS) + INVITE_VARIANTS) % INVITE_VARIANTS;

  const names = products.map((p) => shortName(p, lang));
  const single = names.length === 1 ? names[0]! : null;
  const cats = new Set(products.map(catOf));
  const cat: Cat = CAT_PRIORITY.find((c) => cats.has(c)) ?? "other";
  const ask = ASK[cat][lang];
  const list = names.slice(0, 3).map((n) => `• ${n}`).join("\n") + (names.length > 3 ? (ru ? "\n• и другое" : "\n• та інше") : "");
  const ucFirst = (s: string) => s.charAt(0).toLocaleUpperCase("uk") + s.slice(1);

  let full: string;
  if (v === 0) {
    const hi = name ? (ru ? `${name}, здравствуйте! 👋` : `${name}, вітаю! 👋`) : ru ? "Здравствуйте! 👋" : "Вітаємо! 👋";
    const how = single ? (ru ? `Как вам ${single}?` : `Як вам ${single}?`) : ru ? `Как вам покупка?\n${list}` : `Як вам покупка?\n${list}`;
    full = [
      hi,
      ru ? "Это TTMAX. Спасибо, что выбрали нас 🏓" : "Це TTMAX. Дякуємо, що обрали нас 🏓",
      "",
      how,
      "",
      ru
        ? "Будем искренне благодарны за честный отзыв: он помогает другим игрокам сделать правильный выбор, а нам — становиться лучше."
        : "Будемо щиро вдячні за чесний відгук: він допомагає іншим гравцям зробити правильний вибір, а нам — ставати кращими.",
      ask,
      "",
      ru ? "Оставить отзыв — меньше минуты, без регистрации:" : "Залишити відгук — менше хвилини, без реєстрації:",
      `👉 ${url}`,
      "",
      ru ? "Хорошей игры!\nКоманда TTMAX" : "Гарної гри!\nКоманда TTMAX",
    ].join("\n");
  } else if (v === 1) {
    const hi = name ? (ru ? `Привет, ${name}! 🏓` : `Привіт, ${name}! 🏓`) : ru ? "Привет! 🏓" : "Привіт! 🏓";
    const hope = single
      ? ru
        ? `Надеемся, ${single} ${STATUS[cat].ru} 💪`
        : `Сподіваємось, ${single} ${STATUS[cat].uk} 💪`
      : ru
        ? `Надеемся, покупка уже радует 💪\n${list}`
        : `Сподіваємось, покупка вже радує 💪\n${list}`;
    full = [
      hi,
      hope,
      "",
      ru
        ? "Поделитесь впечатлениями — несколько честных слов помогут другим игрокам с выбором."
        : "Поділіться враженнями — кілька чесних слів допоможуть іншим гравцям із вибором.",
      ask,
      "",
      `👉 ${url}`,
      "",
      ru ? "Спасибо, что играете с TTMAX!" : "Дякуємо, що граєте з TTMAX!",
    ].join("\n");
  } else {
    const thanks = name
      ? ru
        ? `${name}, спасибо за покупку в TTMAX! 🙌`
        : `${name}, дякуємо за покупку в TTMAX! 🙌`
      : ru
        ? "Спасибо за покупку в TTMAX! 🙌"
        : "Дякуємо за покупку в TTMAX! 🙌";
    full = [
      thanks,
      "",
      ru
        ? "Мы внимательно читаем каждый отзыв и учимся на нём — поэтому нам очень ценно ваше мнение о покупке:"
        : "Ми уважно читаємо кожен відгук і вчимося на ньому — тому для нас дуже цінна ваша думка про покупку:",
      list,
      "",
      cat === "other"
        ? ask
        : ru
          ? `Что понравилось, а что можно сделать лучше? ${ask}`
          : `Що сподобалось, а що можна зробити краще? ${ask}`,
      "",
      ru ? "Это займёт минуту, регистрация не нужна:" : "Це займе хвилину, реєстрація не потрібна:",
      `👉 ${url}`,
      "",
      ru ? "С уважением,\nкоманда TTMAX 🏓" : "З повагою,\nкоманда TTMAX 🏓",
    ].join("\n");
  }

  const shortWho = name ? `${name}, ` : "";
  const short = ru
    ? `${ucFirst(`${shortWho}спасибо за покупку в TTMAX!`)} Будем благодарны за честный отзыв — это минута времени: ${url}`
    : `${ucFirst(`${shortWho}дякуємо за покупку в TTMAX!`)} Будемо вдячні за чесний відгук — це хвилина часу: ${url}`;

  return { full, short };
}
