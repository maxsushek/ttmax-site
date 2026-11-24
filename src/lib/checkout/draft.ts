// src/lib/checkout/draft.ts
// Чернетка оформлення: те, що покупець устиг ввести, переживає закриття вікна оформлення.
//
// ⚠️ НАВІЩО (24.11.2026). Форма оформлення існує, лише доки відкрита (CartDrawer монтує її
// умовно), тож хрестик у шапці стирав усе введене: ім'я, телефон, місто, відділення. Людина
// закривала вікно, щоб глянути розмірну сітку чи додати товар, — і поверталась до порожньої
// форми. Власник попросив це виправити.
//
// Де лежить і скільки: localStorage, 7 днів від останньої зміни; після успішного замовлення
// стирається одразу. Власник спитав, як роблять великі магазини (24.11.2026): там, де можна
// замовити без кабінету, введене живе разом із кошиком кілька днів (WooCommerce тримає сесію
// покупця 2 доби, Shopify — кошик близько двох тижнів), а надовго дані запамʼятовує кабінет або
// автозаповнення браузера. Спершу тут був sessionStorage (до закриття вкладки) — тоді людина,
// що повернулась наступного дня, бачила кошик (він у localStorage без строку), але порожню
// форму. Не прибирати строк: без нього імʼя, телефон і адреса лишались би в браузері назавжди,
// а з одного компʼютера (клуб, родина) замовляють різні люди.
//
// Чого тут немає й бути не повинно:
//  • даних картки — ніколи й ніде, крім самих полів форми;
//  • способу оплати — перелік іде з config/payment.ts і може змінитись між візитами;
//  • кроку — з першого кроку виходять лише через перевірку (reopenStep1 у CheckoutForm).
import { phoneDigits } from "@/utils/phone";
import type { DeliveryMethod } from "./shipping";

const KEY = "ttmax_checkout_draft_v1";

/** Скільки живе чернетка від останньої зміни. */
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Найбільша довжина коментаря у формі. Сервер (/api/orders) приймає до 2000 — із запасом. */
export const COMMENT_MAX = 600;

/** Спосіб доставки, з якого форма починає. */
export const DEFAULT_DELIVERY: DeliveryMethod = "np";

export type CheckoutDraft = {
  fullName: string;
  /** Цифри «0XXXXXXXXX» (див. utils/phone.ts). */
  phone: string;
  email: string;
  city: string;
  npBranch: string;
  ukrBranch: string;
  delivery: DeliveryMethod;
  comment: string;
  /** Галочка «Поклеїти накладки на основу». */
  glue: boolean;
};

/** Текстові поля чернетки й найбільша довжина кожного — та сама, що maxLength у полях форми. */
const TEXT_LIMITS = {
  fullName: 120,
  email: 254,
  city: 120,
  npBranch: 240,
  ukrBranch: 240,
  comment: COMMENT_MAX,
} as const;
type TextKey = keyof typeof TEXT_LIMITS;
const TEXT_KEYS = Object.keys(TEXT_LIMITS) as TextKey[];

const DELIVERY: readonly string[] = ["np", "ukrposhta", "pickup"] satisfies DeliveryMethod[];

/** localStorage або null: на сервері його немає, а в браузері доступ можуть заборонити. */
function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Збережена чернетка — лише поля, що пройшли перевірку типу й довжини. Сховище — не довірене
 * джерело: вміст міг лишитись від старої версії сайту або бути зміненим вручну. Прострочену
 * чернетку (або без дати) стираємо.
 */
export function readCheckoutDraft(): Partial<CheckoutDraft> {
  const out: Partial<CheckoutDraft> = {};
  try {
    const store = storage();
    const raw = store?.getItem(KEY);
    if (!store || !raw) return out;
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object") return out;
    const rec = data as Record<string, unknown>;
    // Дата в майбутньому більш як на добу — переведений годинник або підробка: теж стираємо.
    const age = typeof rec.savedAt === "number" ? Date.now() - rec.savedAt : NaN;
    if (!(age >= -86_400_000 && age <= TTL_MS)) {
      store.removeItem(KEY);
      return out;
    }
    for (const key of TEXT_KEYS) {
      const val = rec[key];
      if (typeof val === "string") out[key] = val.slice(0, TEXT_LIMITS[key]);
    }
    // phoneDigits зводить будь-який запис до цифр «0XXXXXXXXX» — для вже чинного значення
    // нічого не змінює, а зіпсоване не пропустить у поле.
    if (typeof rec.phone === "string") out.phone = phoneDigits(rec.phone);
    if (typeof rec.delivery === "string" && DELIVERY.includes(rec.delivery)) {
      out.delivery = rec.delivery as DeliveryMethod;
    }
    if (typeof rec.glue === "boolean") out.glue = rec.glue;
  } catch {
    // Зіпсований JSON або сховище недоступне — форма просто починає порожньою.
  }
  return out;
}

/** Зберігає чернетку. Порожню (нічого не введено, спосіб доставки типовий) — прибирає. */
export function writeCheckoutDraft(form: CheckoutDraft): void {
  try {
    const store = storage();
    if (!store) return;
    // ⚠️ Поля перелічені поіменно, а не через {...form}: сюди приходить увесь стан форми, а в
    // ньому є поля картки. Розгортання поклало б їх у сховище разом з усім іншим.
    const draft: CheckoutDraft = {
      fullName: form.fullName,
      phone: form.phone,
      email: form.email,
      city: form.city,
      npBranch: form.npBranch,
      ukrBranch: form.ukrBranch,
      delivery: form.delivery,
      comment: form.comment,
      glue: form.glue,
    };
    const empty =
      !draft.phone &&
      !draft.glue &&
      draft.delivery === DEFAULT_DELIVERY &&
      TEXT_KEYS.every((key) => !draft[key].trim());
    if (empty) store.removeItem(KEY);
    else store.setItem(KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    // Сховище переповнене або заборонене — оформлення працює й без чернетки.
  }
}

/** Замовлення оформлено — чернетка більше не потрібна. */
export function clearCheckoutDraft(): void {
  try {
    storage()?.removeItem(KEY);
  } catch {
    // Немає доступу до сховища — прибирати нічого.
  }
}

/** Назви заповнених полів чернетки (без значень) — для аналітики. */
export function draftFilledFields(draft: Partial<CheckoutDraft>): string[] {
  const filled: string[] = (
    ["fullName", "phone", "city", "npBranch", "ukrBranch", "email", "comment"] as const
  ).filter((key) => draft[key]?.trim());
  if (draft.glue) filled.push("glue");
  return filled;
}
