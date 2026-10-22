// PostHog — продуктова аналітика: воронка, записи сеансів, теплові карти, помилки JS.
// Проєкт 315663 у EU Cloud (дані зберігаються в ЄС).
//
// Токен публічний за задумом: він однаково потрапляє в JS кожного відвідувача. З ним можна лише
// НАДСИЛАТИ події, читати дані проєкту — ні. Тому він тут, а не в секретах Vercel; змінна
// оточення лише дає змогу підмінити його без правки коду.
export const POSTHOG_TOKEN =
  process.env.NEXT_PUBLIC_POSTHOG_KEY || "phc_xgXvJqhZgsxCVBLgdCocgBfoBu5F2oQ2JHzCchE7viF5";

/**
 * Куди браузер шле події.
 *
 * Зараз — напряму в EU Cloud. Коли DNS-запис e.ttmax.com.ua (CNAME на керований проксі PostHog)
 * підтвердиться, сюди ставимо https://e.ttmax.com.ua: події з власного піддомену не ріжуть
 * блокувальники реклами, тож статистика повніша.
 *
 * ⚠️ Проксі саме піддоменом, а не rewrites у next.config: для rewrites PostHog вимагає
 * skipTrailingSlashRedirect, а це міняє поведінку слешів на ВСІХ URL сайту (SEO-ризик).
 */
export const POSTHOG_API_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";
export const POSTHOG_UI_HOST = "https://eu.posthog.com";

/** Серверні події (замовлення, заявки, відгуки) — напряму в EU Cloud, проксі їм не потрібен. */
export const POSTHOG_CAPTURE_URL = "https://eu.i.posthog.com/i/v0/e/";

/** Збираємо лише на бойовому домені: прев'ю, localhost і *.vercel.app статистику не засмічують. */
export const POSTHOG_HOSTNAMES: readonly string[] = ["ttmax.com.ua", "www.ttmax.com.ua"];

/** Cookie, у якій posthog-js тримає анонімний id відвідувача і id сеансу. */
export const POSTHOG_COOKIE = `ph_${POSTHOG_TOKEN}_posthog`;

/**
 * Позначка «це власник сайту»: ставиться при відкритті адмінки (той самий домен → той самий
 * localStorage). Події з нею мають властивість internal=true і відсіюються фільтром
 * «внутрішній трафік» у PostHog — власні перевірки сайту не псують статистику.
 */
export const INTERNAL_FLAG = "ttmax:internal";
