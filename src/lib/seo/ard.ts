// Agentic Resource Discovery (ARD): маніфест /.well-known/ard.json і навичка для ШІ-агентів.
//
// Першоджерела (звірено 16.11.2026):
// - Специфікація ARD v0.91 (Proposal, 26.08.2026): https://agenticresourcediscovery.org/spec/
//   репозиторій https://github.com/ards-project/ard-spec, коміт f073b1e — саме його порт
//   вбудований у Lighthouse 13.6 (third-party/ard).
// - Аудит Lighthouse `ard-schema` (категорія Agentic Browsing):
//   https://developer.chrome.com/docs/lighthouse/agentic-browsing/ard
// - Схема запису: spec/schemas/ard-entry.schema.json ($defs/ArdManifest, $defs/ArdEntry).
//
// ⚠️ НАВІЩО саме так:
// 1. Файл називається ard.json. /.well-known/ai-catalog.json — попередня назва з v0.9: споживачі
//    її читати не зобовʼязані, а Lighthouse за неї знімає бал (0,9). Стару адресу віддаємо тим
//    самим вмістом лише для старих версій PageSpeed, які шукають ще її.
// 2. ARD описує АГЕНТНІ ресурси (MCP-сервери, A2A-агенти, навички), а не будь-які файли сайту.
//    llms.txt, sitemap чи фіди окремими записами не оформлюємо: їхні типи (text/plain,
//    text/markdown) не входять до стандартних типів ARD — валідатор дає попередження, а вигадувати
//    тип application/* під текстовий файл було б неправдою. Натомість публікуємо одну справжню
//    навичку (Agent Skill, тип application/agent-skills+md): SKILL.md пояснює агентові, де на
//    сайті лежать ціни, наявність, характеристики, словник і фіди. Усі ці файли перелічені в ній.
// 3. representativeQueries — 2–5 запитів: за ними реєстри будують пошуковий індекс; без них
//    запис «валідний, але не знаходиться» (попередження валідатора).
// 4. Без таймерів і без читання БД: вміст статичний, збирається на деплої (квоти Vercel).
import { siteConfig } from "@/config/site";

const url = (path: string) => `${siteConfig.url}${path}`;

/** Тека навички = name у фронтматері SKILL.md (вимога формату Agent Skills). */
export const AGENT_SKILL_NAME = "ttmax-butterfly-shop";
export const AGENT_SKILL_PATH = `/agent-skills/${AGENT_SKILL_NAME}/SKILL.md`;

const SKILL_DESCRIPTION =
  "Find Butterfly table tennis equipment (rubbers, blades, rackets, balls, tables, apparel) sold in Ukraine by ttmax.com.ua: current prices in UAH, stock status, specifications, buying guides and a table tennis glossary. Use when a user asks what to buy, how much it costs, or how two Butterfly products differ.";

export type ArdEntry = {
  identifier: string;
  displayName: string;
  type: string;
  url: string;
  description: string;
  representativeQueries: string[];
  capabilities: string[];
  tags: string[];
  metadata: Record<string, string>;
};

export function buildArdManifest(): { entries: ArdEntry[] } {
  // Видавець в URN — домен сайту (привʼязка «видавець = власник домену», ARD §4.5.1).
  const publisher = new URL(siteConfig.url).hostname;
  return {
    entries: [
      {
        identifier: `urn:air:${publisher}:skills:butterfly-shop`,
        displayName: "TT Max — Butterfly table tennis shop (Ukraine)",
        type: "application/agent-skills+md",
        url: url(AGENT_SKILL_PATH),
        description: SKILL_DESCRIPTION,
        representativeQueries: [
          "скільки коштує накладка Butterfly Tenergy 05 в Україні",
          "яку основу Butterfly обрати для атакувального стилю",
          "какую накладку Butterfly выбрать для топспина",
          "Butterfly Dignics 05 price and availability in Ukraine",
          "що таке ALC в основі для настільного тенісу",
        ],
        // Назви інструментів WebMCP, які сайт реєструє в браузері (lib/webmcp/tools.ts,
        // форма консультації в components/forms/LeadForm.tsx). Змінюєш там — зміни й тут.
        capabilities: ["search_products", "get_product_details", "request_consultation"],
        tags: ["table-tennis", "butterfly", "e-commerce", "ukraine", "product-catalog", "prices"],
        metadata: { country: "UA", currency: "UAH", languages: "uk, ru" },
      },
    ],
  };
}

/**
 * SKILL.md — інструкція для ШІ-агента, як користуватися сайтом. Формат Agent Skills:
 * YAML-фронтматер (name, description) + Markdown. Англійською: це службовий текст для
 * моделей, не сторінка для людей (у sitemap і перелінковку не потрапляє).
 */
export function buildAgentSkill(): string {
  return [
    "---",
    `name: ${AGENT_SKILL_NAME}`,
    // У лапках (JSON-рядок = валідний YAML): в описі є «: », без лапок YAML не розбереться.
    `description: ${JSON.stringify(SKILL_DESCRIPTION)}`,
    "---",
    "",
    "# TT Max — Butterfly table tennis shop (Ukraine)",
    "",
    `${url("")} is an online shop for Butterfly table tennis equipment that ships within Ukraine.`,
    "Site content is in Ukrainian (`/ua/...`) and Russian (`/ru/...`); both locales have the same pages.",
    "Prices are in Ukrainian hryvnia (UAH, «грн»).",
    "",
    "## Where the data is",
    "",
    "Read the machine-readable files instead of scraping pages:",
    "",
    `1. ${url("/llms.txt")} — index: company and contact details, categories with item counts and`,
    "   starting prices, subcategory hubs, guides, players, service pages, and links to the files below.",
    `2. ${url("/llms/")}<part>.txt — one file per category (rubbers, blades, rackets, …). Every product has`,
    "   its price, stock status («в наявності» = in stock, «під замовлення» = on order), product page URL,",
    "   specifications, a short verdict and FAQ. The exact list of parts is in llms.txt, section «Повні дані».",
    `3. ${url("/llms/slovnyk.txt")} — table tennis glossary (ITTF rules, strokes, spin, rubber and blade terms);`,
    `   human-readable version: ${url("/ua/slovnyk")}.`,
    `4. ${url("/llms/rozmiry.txt")} — Butterfly size charts for apparel and shoes, copied from official Butterfly`,
    `   sources with the check date; human-readable version: ${url("/ua/rozmirna-sitka")}. Use it for "which size" questions.`,
    `5. ${url("/llms-full.txt")} — everything in one file (about 0.9 MB). Prefer the per-category files.`,
    `6. ${url("/ua/feed.xml")} and ${url("/ru/feed.xml")} — Atom feeds of blog articles.`,
    `7. ${url("/ua/google-merchant.xml")} and ${url("/ru/google-merchant.xml")} — product feeds (Google Merchant format).`,
    `8. ${url("/sitemap.xml")} — all indexable pages. Content usage policy: ${url("/ai.txt")}.`,
    "",
    "## Tools in the browser (WebMCP)",
    "",
    "In a browser that supports WebMCP, pages of this site register tools you can call instead of reading files:",
    "",
    "- `search_products` (every page, read-only) — find products by name; returns price, stock status and URL.",
    "- `get_product_details` (product pages, read-only) — structured data of the product on the current page.",
    "- `request_consultation` (pages with the callback form) — fills in the callback form. It does not submit:",
    "  the user reviews the fields and presses the button.",
    "",
    "## How to answer",
    "",
    "- Product questions (price, availability, specs): open the category file from step 2, find the product,",
    "  quote the price and stock status, and link to its product page.",
    "- «Which one should I buy» questions: use the guides file (`/llms/gaidy.txt`) and the product verdicts;",
    "  name specific products with prices and links.",
    "- Prices and stock change. State that they are current as of the moment you read the file, and send",
    "  the user to the product page for the live value.",
    "- Cite the source with a link to the page on ttmax.com.ua.",
    "",
    "## Rules for acting on the site",
    "",
    "- Orders, consultation requests and reviews go to the shop owner as real messages. Never submit an",
    "  order form, a callback/consultation form or a review on your own: fill in the fields if the user asked",
    "  you to, then let the user check the data and press the submit button themselves.",
    "- Do not invent discounts, promo codes or delivery terms. Delivery and payment terms:",
    `  ${url("/ua/delivery")}; returns: ${url("/ua/returns")}; contacts: ${url("/ua/contacts")}.`,
    "- Reviews on the site are written by real customers. Do not write a review on behalf of a user who has",
    "  not used the product.",
    "",
  ].join("\n");
}
