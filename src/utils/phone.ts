// src/utils/phone.ts
// Український мобільний номер: одне джерело правди для форм і бекенда.
//
// ⚠️ НАВІЩО окремий файл (23.11.2026). Перелік кодів операторів жив у чотирьох місцях
// (utils/validators.ts, api/orders, api/leads, lib/reviews/purchase.ts) і в усіх чотирьох
// не знав кодів 075 (Vodafone, з березня 2024) і 077 (Київстар, з лютого 2024). Покупець із
// таким номером не міг оформити ні замовлення, ні «Швидке замовлення»: форма казала
// «Невірний номер», а сервер відповів би 400. Розширювати перелік лише в одному місці не
// можна — клієнт пропустить номер, а сервер відхилить його вже на останньому кроці.
//
// Новий код оператора додавати ТІЛЬКИ тут (і назву оператора — в OPERATORS нижче).
// Не послаблювати до «будь-які 9 цифр»: поле вводу зводить набране до «0XXXXXXXXX», і без
// переліку кодів іноземний номер, набраний цифра за цифрою, пройшов би як український.

/** Коди мобільних операторів без нуля: Київстар 39/67/68/96/97/98/77, Vodafone 50/66/95/99/75, lifecell 63/73/93, інші 91/92/94. */
export const UA_MOBILE_CODES = "39|50|63|66|67|68|73|75|77|91|92|93|94|95|96|97|98|99";

/** Номер без пробілів і дужок: +380XXXXXXXXX, 380XXXXXXXXX або 0XXXXXXXXX. */
export const UA_PHONE = new RegExp(`^(\\+?380|0)(${UA_MOBILE_CODES})\\d{7}$`);

/** Останні 9 цифр: код оператора + номер. */
export const UA_PHONE_NATIONAL = new RegExp(`^(${UA_MOBILE_CODES})\\d{7}$`);

/**
 * ───────────── Поле телефону: «+38» окремо, у полі — «(067) 123-45-67» ─────────────
 *
 * ⚠️ НАВІЩО (24.11.2026). Власник попросив одне поле телефону на «Швидкому замовленні» й на
 * оформленні — як у його проєкті sparkservice: незмінна приставка «+38», маска
 * «(0__) ___-__-__», ряд із десяти крапок, що заповнюються з кожною цифрою, і підказка з
 * назвою оператора. Формат показу номера скрізь — як у телефону магазину: «+38 (096) 672-61-36».
 * Логіку взято з sparkservice (js/main.js: rawDigits, fmt, detect) і підсилено — див. нижче.
 *
 * Стан поля — рядок цифр «0XXXXXXXXX» (до десяти). Усе інше з нього обчислюється:
 * phoneMask — те, що видно в полі; phoneDisplay — повний запис для тексту; phoneE164 —
 * номер для сервера («+380671234567»).
 */

/** Оператори — для підказки «номер розпізнано». name: null — код чинний, але назву не показуємо. */
const OPERATORS: ReadonlyArray<{ name: string | null; codes: readonly string[] }> = [
  { name: "Київстар", codes: ["39", "67", "68", "96", "97", "98", "77"] },
  { name: "Vodafone", codes: ["50", "66", "95", "99", "75"] },
  { name: "lifecell", codes: ["63", "73", "93"] },
  { name: null, codes: ["91", "92", "94"] },
];

/**
 * Цифри номера «0XXXXXXXXX» — хоч би як їх набирали чи вставляли: 067…, 67…, 380 67…,
 * +38 (067)…, 8 067… Порожній рядок — цифр немає зовсім.
 *
 * ⚠️ Відмінності від rawDigits у sparkservice (там зрізається лише «38» на самому початку):
 *  • код країни розпізнається й тоді, коли його набирають цифра за цифрою вже ПІСЛЯ «+38»
 *    (людина бачить приставку й усе одно набирає «380…»): «0» + «38» — це не код оператора
 *    (кодів на 38 немає), тож зайве знімаємо, а не псуємо номер на «(038) 067-…»;
 *  • старий запис «8 067 …» теж зводиться до «067 …»;
 *  • вставлений іноземний номер («+7 701 …») НЕ переробляється на український: без нашого
 *    префікса й із зайвими цифрами він лишається чужим (лише обрізається до десяти цифр) і не
 *    проходить перевірку. Якщо з такого номера стирають, поле очищається (ui/PhoneField):
 *    інакше девʼять цифр, що лишились, отримали б «0» попереду й стали б «українським» номером.
 */
export function phoneDigits(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (!d) return "";
  let ua = false;
  for (;;) {
    const before = d;
    d = d.replace(/^0+/, "");
    if (d.startsWith("380")) d = d.slice(3);
    else if (d.startsWith("38")) d = d.slice(2);
    else if (d.startsWith("80")) d = d.slice(1);
    if (d === before) break;
    ua = true;
  }
  if (!ua && d.length > 9) return d.slice(0, 10);
  return `0${d}`.slice(0, 10);
}

/**
 * Маска для поля: «(067) 123-45-67»; під час набору — «(06», «(067) 12».
 * ⚠️ «) » додаємо лише коли є четверта цифра (у sparkservice — одразу після третьої):
 * інакше Backspace стирає пробіл, маска повертає його назад — і поле не стерти далі.
 */
export function phoneMask(digits: string): string {
  if (!digits) return "";
  let out = `(${digits.slice(0, 3)}`;
  if (digits.length > 3) out += `) ${digits.slice(3, 6)}`;
  if (digits.length > 6) out += `-${digits.slice(6, 8)}`;
  if (digits.length > 8) out += `-${digits.slice(8, 10)}`;
  return out;
}

/** Повний запис для тексту: «+38 (067) 123-45-67» — як телефон магазину на сайті. */
export function phoneDisplay(digits: string): string {
  return digits ? `+38 ${phoneMask(digits)}` : "";
}

/** Номер для сервера: «+380671234567». */
export function phoneE164(digits: string): string {
  return `+38${digits}`;
}

export type PhoneCheck = {
  /** empty — порожньо; partial — набирають; valid — мобільний номер України; invalid — десять цифр, але коду оператора не існує. */
  state: "empty" | "partial" | "valid" | "invalid";
  /** Назва оператора для підказки; null — невідомо або не показуємо. */
  operator: string | null;
};

export function phoneCheck(digits: string): PhoneCheck {
  if (!digits) return { state: "empty", operator: null };
  if (digits.length < 10) return { state: "partial", operator: null };
  if (!UA_PHONE.test(digits)) return { state: "invalid", operator: null };
  const code = digits.slice(1, 3);
  return { state: "valid", operator: OPERATORS.find((o) => o.codes.includes(code))?.name ?? null };
}

/**
 * Тримає курсор на місці в полі з маскою, яке переформатовується на кожне натискання.
 *
 * ⚠️ НАВІЩО. Після форматування React переписує значення поля, і курсор стрибає в кінець.
 * Хто виправляв цифру всередині номера, стирав одну, а нова лягала в КІНЕЦЬ: виходив інший,
 * але формально правильний номер — і замовлення з нього вже не підтвердити, бо підтверджують
 * дзвінком. Рахуємо цифри праворуч від курсора й після перемальовування ставимо його так,
 * щоб їх лишилось стільки ж. Викликати в onChange ДО зміни стану. Набір у кінець не зачіпає.
 */
export function keepPhoneCaret(el: HTMLInputElement): void {
  const pos = el.selectionStart;
  if (pos === null) return;
  const digitsAfter = el.value.slice(pos).replace(/\D/g, "").length;
  if (digitsAfter === 0) return;
  requestAnimationFrame(() => {
    const v = el.value;
    let p = v.length;
    for (let seen = 0; p > 0 && seen < digitsAfter; p--) if (/\d/.test(v[p - 1]!)) seen++;
    // Стаємо перед роздільником, а не після нього: інакше Backspace «залипає» на ньому.
    while (p > 0 && /\D/.test(v[p - 1]!)) p--;
    try {
      el.setSelectionRange(p, p);
    } catch {
      /* поле зникло або не підтримує виділення */
    }
  });
}
