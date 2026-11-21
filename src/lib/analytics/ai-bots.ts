// src/lib/analytics/ai-bots.ts
// Лічильник заходів ШІ-ботів: middleware бачить User-Agent кожного запиту сторінки й машинних
// файлів (llms.txt, sitemap.xml…) і для відомих ШІ-ботів шле подію `ai_bot_hit` у PostHog.
//
// ⚠️ НАВІЩО (21.11.2026). Під GEO зроблено багато (llms-файли, розмітка, «Головне», дані профі),
// але не видно, чи ШІ-системи взагалі читають сайт і що саме. Логи Vercel цього не показують
// (Observability Plus немає), браузерний PostHog ботів не бачить — JS вони не виконують.
//
// ⚠️ ТОЧНІСТЬ. Розпізнаємо за User-Agent: його можна підробити, тож це «запити, що назвались
// GPTBot», а не перевірені IP OpenAI. Для тренду (росте / падає, які сторінки читають) цього
// досить. Googlebot свідомо НЕ рахуємо: його бачить Search Console, а обсяг забив би квоту подій.
//
// ⚠️ НАВАНТАЖЕННЯ. Middleware і так виконується на кожній сторінці; подія йде лише для ботів,
// у фоні (event.waitUntil) — відповідь відвідувачу не чекає на PostHog. Лише бойовий деплой.
import { POSTHOG_CAPTURE_URL, POSTHOG_TOKEN } from "@/config/posthog";

/**
 * training — збирає дані для навчання моделей; search — індекс ШІ-пошуку;
 * user — сторінку відкрили, бо про неї щойно спитав користувач (найсильніший сигнал цитування);
 * index — пошуковий індекс, на який спираються ШІ-асистенти (Bing → Copilot, ChatGPT search).
 */
export type AiBotPurpose = "training" | "search" | "user" | "index";
export type AiBot = { name: string; company: string; purpose: AiBotPurpose };

// Порядок важливий лише там, де один підрядок входить в інший (перевіряємо по черзі).
const BOTS: { re: RegExp; bot: AiBot }[] = [
  { re: /ChatGPT-User/i, bot: { name: "ChatGPT-User", company: "OpenAI", purpose: "user" } },
  { re: /OAI-SearchBot/i, bot: { name: "OAI-SearchBot", company: "OpenAI", purpose: "search" } },
  { re: /GPTBot/i, bot: { name: "GPTBot", company: "OpenAI", purpose: "training" } },
  { re: /Claude-User/i, bot: { name: "Claude-User", company: "Anthropic", purpose: "user" } },
  { re: /Claude-SearchBot/i, bot: { name: "Claude-SearchBot", company: "Anthropic", purpose: "search" } },
  { re: /ClaudeBot|anthropic-ai/i, bot: { name: "ClaudeBot", company: "Anthropic", purpose: "training" } },
  { re: /Perplexity-User/i, bot: { name: "Perplexity-User", company: "Perplexity", purpose: "user" } },
  { re: /PerplexityBot/i, bot: { name: "PerplexityBot", company: "Perplexity", purpose: "search" } },
  { re: /MistralAI-User/i, bot: { name: "MistralAI-User", company: "Mistral", purpose: "user" } },
  { re: /DuckAssistBot/i, bot: { name: "DuckAssistBot", company: "DuckDuckGo", purpose: "user" } },
  { re: /meta-externalfetcher/i, bot: { name: "Meta-ExternalFetcher", company: "Meta", purpose: "user" } },
  { re: /meta-externalagent/i, bot: { name: "Meta-ExternalAgent", company: "Meta", purpose: "training" } },
  { re: /Applebot/i, bot: { name: "Applebot", company: "Apple", purpose: "search" } },
  { re: /Amazonbot/i, bot: { name: "Amazonbot", company: "Amazon", purpose: "search" } },
  { re: /YouBot/i, bot: { name: "YouBot", company: "You.com", purpose: "search" } },
  { re: /bingbot/i, bot: { name: "Bingbot", company: "Microsoft", purpose: "index" } },
  { re: /Bytespider/i, bot: { name: "Bytespider", company: "ByteDance", purpose: "training" } },
  { re: /CCBot/i, bot: { name: "CCBot", company: "Common Crawl", purpose: "training" } },
  { re: /cohere-ai|cohere-training-data-crawler/i, bot: { name: "Cohere", company: "Cohere", purpose: "training" } },
  { re: /AI2Bot/i, bot: { name: "AI2Bot", company: "Allen AI", purpose: "training" } },
  { re: /Diffbot/i, bot: { name: "Diffbot", company: "Diffbot", purpose: "training" } },
];

export function detectAiBot(userAgent: string | null): AiBot | null {
  if (!userAgent) return null;
  for (const b of BOTS) if (b.re.test(userAgent)) return b.bot;
  return null;
}

/**
 * Машинні файли, які читають ШІ-системи. Middleware за замовчуванням пропускає шляхи з
 * розширенням, тому їх додано в matcher окремо — і для них middleware лише рахує бота й
 * віддає запит далі БЕЗ редиректів (інакше /llms.txt завертало б на /ua/llms.txt).
 */
export function isMachineFile(pathname: string): boolean {
  return (
    pathname === "/llms.txt" ||
    pathname === "/llms-full.txt" ||
    pathname.startsWith("/llms/") ||
    pathname === "/ai.txt" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/.well-known/") ||
    pathname.startsWith("/agent-skills/") ||
    /^\/(ua|ru)\/(feed|google-merchant)\.xml$/.test(pathname)
  );
}

/** Тип сторінки — для зведень у PostHog («що читають боти»). */
export function pageType(pathname: string): string {
  if (pathname === "/llms.txt" || pathname === "/llms-full.txt" || pathname.startsWith("/llms/")) return "llms";
  if (pathname === "/robots.txt") return "robots";
  if (pathname === "/sitemap.xml") return "sitemap";
  if (pathname === "/ai.txt" || pathname.startsWith("/.well-known/") || pathname.startsWith("/agent-skills/")) return "agent";
  if (/\/(feed|google-merchant)\.xml$/.test(pathname)) return "feed";
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length <= 1) return "home";
  const [, first, second, third] = parts;
  if (first === "blog") return second ? "blog_post" : "blog";
  if (first === "igroki") return second === "inventar" ? "pro_stats" : second ? "player" : "players";
  if (first === "slovnyk") return "glossary";
  if (first === "rozmirna-sitka") return "size_chart";
  if (["delivery", "payment", "returns", "contacts", "about", "vidguky", "privacy", "terms"].includes(first!)) return "info";
  if (first === "butterfly" && third) return "product";
  if (first === "butterfly") return "brand";
  return second ? "hub" : "category";
}

/** Подія в PostHog. Профіль «людини» не створюється; гео — з заголовка Vercel, без IP. */
export async function captureAiBotHit(opts: {
  bot: AiBot;
  url: URL;
  userAgent: string;
  country: string | null;
}): Promise<void> {
  const { bot, url, userAgent, country } = opts;
  const locale = /^\/(ua|ru)(\/|$)/.exec(url.pathname)?.[1] ?? null;
  const body = {
    api_key: POSTHOG_TOKEN,
    event: "ai_bot_hit",
    distinct_id: `bot:${bot.name}`,
    timestamp: new Date().toISOString(),
    properties: {
      bot: bot.name,
      bot_company: bot.company,
      bot_purpose: bot.purpose,
      path: url.pathname,
      page_type: pageType(url.pathname),
      locale,
      bot_country: country,
      user_agent: userAgent.slice(0, 250),
      $current_url: `${url.origin}${url.pathname}`,
      $process_person_profile: false,
      $geoip_disable: true,
      $lib: "ttmax-middleware",
    },
  };
  try {
    await fetch(POSTHOG_CAPTURE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    /* аналітика не має впливати на відповідь */
  }
}
