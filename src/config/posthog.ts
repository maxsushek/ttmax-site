// PostHog — продуктова аналітика: воронка, записи сеансів, теплові карти, помилки JS.
// Проєкт 315663 у EU Cloud (дані зберігаються в ЄС).
//
// Токен публічний за задумом: він однаково потрапляє в JS кожного відвідувача. З ним можна лише
// НАДСИЛАТИ події, читати дані проєкту — ні. Тому він тут, а не в секретах Vercel; змінна
// оточення лише дає змогу підмінити його без правки коду.
export const POSTHOG_TOKEN =
  process.env.NEXT_PUBLIC_POSTHOG_KEY || "phc_xgXvJqhZgsxCVBLgdCocgBfoBu5F2oQ2JHzCchE7viF5";

/**
 * Куди браузер шле події й звідки довантажує скрипти (запис сеансів тощо) — власний піддомен.
 *
 * e.ttmax.com.ua — керований проксі PostHog (CNAME у «Хостинг Україна» → *.cf-prod-eu-proxy.
 * europehog.com, проксі id 01a1630c-f5b9-0000-415e-bee5e5cd92fd). Події з власного домену
 * блокувальники реклами ріжуть значно рідше, тож статистика повніша. Якщо проксі колись
 * зламається — тимчасово повернути https://eu.i.posthog.com (у CSP дозволені обидва).
 *
 * ⚠️ Проксі саме піддоменом, а не rewrites у next.config: для rewrites PostHog вимагає
 * skipTrailingSlashRedirect, а це міняє поведінку слешів на ВСІХ URL сайту (SEO-ризик).
 */
export const POSTHOG_API_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://e.ttmax.com.ua";
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
