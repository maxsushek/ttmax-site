// src/lib/reviews/spam.ts
// Антиспам для форми відгуків. Три рівні:
//  1) «тихо відкинути» — пастка-поле й надто швидке заповнення: боту відповідаємо «дякуємо»,
//     у базу нічого не пишемо, у Telegram нічого не шлемо (інакше бот вчиться обходити);
//  2) «відхилити з поясненням» — посилання в тексті: людині кажемо, що так не можна;
//  3) «пропустити з позначкою» — підозрілі слова, латиниця, повтори: відгук іде на
//     модерацію як звичайний, але в Telegram видно ⚠️ і причину.
// Усе одно все проходить ручну модерацію — фільтр лише знімає шум.

export type SpamVerdict =
  | { kind: "drop"; reason: string }
  | { kind: "reject"; reason: "links" }
  | { kind: "ok"; flags: string[] };

/** Мінімальний час від відкриття форми до відправки. Людина за 3 с не напише відгук. */
const MIN_FILL_MS = 3000;

const LINK_RE =
  /(https?:\/\/|www\.|t\.me\/|\b[a-z0-9-]{2,}\.(com|net|org|ru|ua|io|xyz|info|top|site|online|shop|biz|me|link|click|store|pro|cc|tk)\b)/i;

const STOP_WORDS = [
  "casino", "казино", "букмекер", "ставки на спорт", "viagra", "віагр", "виагр", "crypto", "крипт",
  "bitcoin", "біткоїн", "биткоин", "заробіт", "заработ", "porn", "порно", "sex", "кредит", "займ",
  "loan", "seo-", "просуванн", "продвижени", "раскрутк", "telegram-канал", "whatsapp", "onlyfans",
];

export function checkSpam(input: {
  honeypot?: string | null;
  elapsedMs?: number | null;
  name: string;
  city?: string | null;
  body: string;
}): SpamVerdict {
  if (input.honeypot && input.honeypot.trim() !== "") return { kind: "drop", reason: "honeypot" };
  if (typeof input.elapsedMs === "number" && input.elapsedMs >= 0 && input.elapsedMs < MIN_FILL_MS) {
    return { kind: "drop", reason: "too-fast" };
  }

  const all = `${input.name} ${input.city ?? ""} ${input.body}`;
  if (LINK_RE.test(all)) return { kind: "reject", reason: "links" };

  const flags: string[] = [];
  const low = all.toLowerCase();
  const hit = STOP_WORDS.find((w) => low.includes(w));
  if (hit) flags.push(`слово «${hit}»`);

  const letters = input.body.replace(/[^\p{L}]/gu, "");
  const cyr = input.body.replace(/[^Ѐ-ӿ]/g, "").length;
  if (letters.length >= 20 && cyr / letters.length < 0.3) flags.push("майже без кирилиці");
  if (/(.)\1{7,}/u.test(input.body)) flags.push("повтор символів");
  if (letters.length < input.body.replace(/\s/g, "").length * 0.5) flags.push("мало літер");
  if (/@[a-z0-9_]{4,}/i.test(all)) flags.push("@нікнейм");
  if (/\+?\d[\d\s()-]{8,}\d/.test(input.body)) flags.push("номер у тексті");

  return { kind: "ok", flags };
}
