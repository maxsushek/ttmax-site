// src/components/ui/fieldStyles.ts
// Спільний вигляд полів вводу (ui/Input і ui/PhoneField) — щоб на оформленні, у «Швидкому
// замовленні» й у формі консультації поля виглядали й поводились однаково.
//
// Зразок — «розумна форма» проєкту sparkservice (css/styles.css: .mf-input, .mf-ok, .mf-hint):
// рамка з м'яким кільцем у фокусі, зелена рамка й галочка, що «виростає», коли значення чинне,
// червона рамка для помилки. Кольори — з нашої теми, а не sparkservice: там світла тема з
// червоним акцентом, у нас темна з жовтим.
import { cn } from "@/utils/cn";

/** dark — на темному тлі сайту (оформлення, вікно швидкого замовлення); light — на світлій картці (форма консультації). */
export type FieldTone = "dark" | "light";
export type FieldState = "idle" | "valid" | "invalid";

const BOX: Record<FieldTone, Record<FieldState, string>> = {
  dark: {
    idle: "border-white/10 bg-white/[0.05] focus-within:border-accent/45 focus-within:ring-accent/15",
    valid: "border-success bg-success/[0.05] focus-within:ring-success/15",
    invalid: "border-danger bg-danger/[0.05] focus-within:ring-danger/15",
  },
  // Світла картка стоїть на жовтому тлі: наші зелений і рожево-червоний там не читаються,
  // тож для неї — темніші відтінки з контрастом, достатнім і на білому, і на жовтому.
  light: {
    idle: "border-black/10 bg-white/60 focus-within:border-black/30 focus-within:bg-white focus-within:ring-black/10",
    valid: "border-emerald-700 bg-white focus-within:ring-emerald-700/15",
    invalid: "border-red-700 bg-white focus-within:ring-red-700/15",
  },
};

/** Кольори тексту й позначок за станом — окремо для кожного тла. */
export const FIELD_INK: Record<
  FieldTone,
  { ok: string; err: string; muted: string; okBg: string; errBg: string; okSoft: string }
> = {
  dark: {
    ok: "text-success",
    err: "text-danger",
    muted: "text-ink-muted",
    okBg: "bg-success",
    errBg: "bg-danger",
    okSoft: "bg-success/[0.12]",
  },
  light: {
    ok: "text-emerald-800",
    err: "text-red-700",
    muted: "text-black/60",
    okBg: "bg-emerald-700",
    errBg: "bg-red-700",
    okSoft: "bg-emerald-800/10",
  },
};

/**
 * Рамка поля (обгортка довкола <input>).
 * overflow-hidden — щоб вміст не виходив за заокруглені кути: якщо браузер таки зафарбує
 * автозаповнене поле своїм кольором (див. .tt-field у globals.css), заливка лишиться в рамці.
 * Кільце фокуса — тінь самої рамки, його це не обрізає.
 */
export function fieldBox(state: FieldState, tone: FieldTone = "dark"): string {
  return cn(
    "relative flex items-center overflow-hidden rounded-xl border-[1.5px] focus-within:ring-4",
    "transition-[border-color,box-shadow,background-color] duration-200",
    BOX[tone][state],
  );
}

/**
 * Сам <input> усередині рамки.
 * ⚠️ 16 px, не менше, на будь-якій ширині: iOS Safari сам збільшує сторінку, коли курсор стає
 * в поле зі шрифтом, дрібнішим за 16 px, і назад не зменшує — права частина форми їде за екран.
 * iOS — 6 із 9 мобільних покупок. Без sm:-винятку: iPhone горизонтально ширший за 640 px.
 */
export function fieldInput(tone: FieldTone = "dark"): string {
  return cn(
    // tt-field — кольори автозаповнення браузера не перефарбовують поле (globals.css).
    "tt-field min-h-[50px] w-full min-w-0 flex-1 bg-transparent py-3 pr-10 font-body text-[16px] outline-none",
    tone === "dark"
      ? "text-ink placeholder:text-ink-ghost"
      : "text-bg-base placeholder:text-black/40",
  );
}

/** Галочка праворуч у полі: з'являється, «виростаючи», коли значення чинне. */
export function fieldCheck(visible: boolean, tone: FieldTone = "dark"): string {
  return cn(
    "pointer-events-none absolute right-3.5 font-body text-[17px] font-extrabold leading-none",
    FIELD_INK[tone].ok,
    "transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,0.61,0.36,1)] motion-reduce:transition-none",
    visible ? "scale-100 opacity-100" : "scale-50 opacity-0",
  );
}

/** Підпис над полем. */
export const fieldLabel = "mb-1.5 flex items-center justify-between font-body text-xs font-medium";

/** Колір підпису за станом поля. */
export function fieldLabelTone(state: FieldState, tone: FieldTone = "dark"): string {
  const ink = FIELD_INK[tone];
  return state === "invalid" ? ink.err : state === "valid" ? ink.ok : ink.muted;
}

/** Рядок під полем (підказка або помилка). Висота зарезервована — форма не «стрибає». */
export const fieldNote =
  "mt-1.5 flex min-h-[18px] items-center gap-1.5 font-body text-[12px] leading-snug";
