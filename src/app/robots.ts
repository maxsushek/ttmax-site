import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * robots.txt по ГРУПАХ БОТІВ.
 *
 * ⚠️ ГОЛОВНА ПАСТКА: іменована група ПОВНІСТЮ скасовує для цього бота групу `*`.
 * Тобто варто додати «User-agent: GPTBot», і наші `Disallow: /api/, /admin/` для нього
 * зникають — адмінка відкривається. Тому заборони продубльовані в КОЖНІЙ групі,
 * а не задані один раз у `*`.
 *
 * ⚠️ НЕ додавати сюди "/_next/": цим шляхом ідуть CSS/JS, без них Googlebot не
 * відрендерить сторінку («Page resources couldn't be loaded» в URL Inspection).
 *
 * Імена ботів — лише з офіційної документації вендорів. Непідтверджені не вносимо:
 * рядок із вигаданим іменем нічого не блокує, але створює ілюзію контролю.
 */
const DISALLOW = ["/api/", "/admin/"];

/** Класичний пошук. */
const SEARCH = ["Googlebot", "Googlebot-Image", "Bingbot", "DuckDuckBot", "YandexBot", "Applebot"];

/**
 * ШІ-пошук і відповіді з посиланням на джерело. Саме ці боти приносять нам покази
 * в ChatGPT, Perplexity, Copilot і AI Overviews — відкриті повністю.
 */
const AI_SEARCH = [
  "OAI-SearchBot", // ChatGPT Search
  "ChatGPT-User", // перехід за запитом користувача
  "PerplexityBot",
  "Perplexity-User",
  "Claude-SearchBot",
  "Claude-User",
  "Amazonbot", // Alexa/Rufus
  "meta-externalfetcher",
];

/**
 * Навчання моделей. Дозволено СВІДОМО: магазин виграє від того, що асистенти знають
 * асортимент і ціни й називають TTMAX у відповідях. Якщо власник передумає — достатньо
 * поміняти allow на disallow саме в цій групі, решта не постраждає.
 */
const AI_TRAINING = ["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "CCBot", "meta-externalagent"];

export default function robots(): MetadataRoute.Robots {
  // До офіційного запуску повністю закриваємо сайт від пошукових систем.
  if (!siteConfig.launched) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      sitemap: `${siteConfig.url}/sitemap.xml`,
      host: siteConfig.url,
    };
  }

  const group = (userAgent: string[] | string) => ({
    userAgent,
    allow: "/",
    disallow: DISALLOW,
  });

  return {
    rules: [group("*"), group(SEARCH), group(AI_SEARCH), group(AI_TRAINING)],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
