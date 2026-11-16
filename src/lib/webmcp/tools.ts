// WebMCP: інструменти «лише читання» для ШІ-агентів у браузері (пошук товару, дані картки).
//
// Першоджерела (звірено 16.11.2026):
// - Imperative API: https://developer.chrome.com/docs/ai/webmcp/imperative-api (оновл. 16.10.2026)
// - Безпека інструментів: https://developer.chrome.com/docs/ai/webmcp/secure-tools
// - Специфікація (W3C Community Group Draft): https://webmachinelearning.github.io/webmcp
// - Аудити Lighthouse 13.6 (категорія Agentic Browsing): webmcp-registered-tools,
//   webmcp-schema-validity — читають інструменти через CDP-домен WebMCP.
// Статус: origin trial у Chrome 149+ (Edge 150+). Без токена origin trial або прапорця
// chrome://flags/#enable-webmcp-testing `document.modelContext` не існує, і цей код нічого не робить.
//
// ⚠️ ПРАВИЛА (не послаблювати без рішення власника):
// 1. Тут лише інструменти, що ЧИТАЮТЬ (readOnlyHint: true). Замовлення, заявка й відгук ідуть
//    власникові в Telegram — інструмента, який їх відправляє, бути не повинно.
// 2. Жодних нових серверних маршрутів: пошук читає ті самі статичні /llms/*.txt, що й ШІ-боти
//    (віддаються з CDN, без функцій Vercel і без запитів до Supabase).
// 3. Запити агента не логуються і не йдуть в аналітику: у них може бути що завгодно з розмови
//    користувача.
// 4. Бюджет Chrome: назва ≤ 30 символів, опис ≤ 500, опис параметра ≤ 150, відповідь ≤ 1,5 тис.

export type ModelContextTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
    consequentialHint?: boolean;
  };
  execute: (input: Record<string, unknown>, opts?: { signal?: AbortSignal }) => Promise<string>;
};

type ModelContext = {
  registerTool: (tool: ModelContextTool, opts?: { signal?: AbortSignal }) => Promise<void> | void;
};

/**
 * `document.modelContext` — актуальна точка входу; `navigator.modelContext` — рання назва
 * (Lighthouse досі перевіряє обидві). Немає жодної — WebMCP у цьому браузері вимкнено.
 */
export function getModelContext(): ModelContext | null {
  if (typeof document === "undefined") return null;
  const d = document as Document & { modelContext?: ModelContext };
  const n = navigator as Navigator & { modelContext?: ModelContext };
  const ctx = d.modelContext ?? n.modelContext;
  return ctx && typeof ctx.registerTool === "function" ? ctx : null;
}

const MAX_OUTPUT = 1500;
const MAX_RESULTS = 6;

type CatalogItem = {
  name: string;
  price: string;
  inStock: boolean;
  /** Сторінка товару або розділ (у товарів без власної сторінки) — для локалі `ua`. */
  url: string;
  urlRu: string;
  specs: string;
  /** Назва + характеристики в нормалізованому вигляді — по ньому шукаємо. */
  hay: string;
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-z0-9а-яіїєґ]+/g, " ")
    .trim();

/** Частини llms без товарів (гайди, статті, гравці, словник) — не качаємо їх заради пошуку. */
const NON_PRODUCT_PARTS = new Set(["gaidy", "dovidnyk", "gravtsi", "slovnyk"]);

/**
 * Розбір /llms/<категорія>.txt. Формат задає productLines() у lib/seo/llms.ts:
 *   ### Назва
 *   - Ціна: 2890 грн, в наявності
 *   - Сторінка: https://…/ua/… (рос. https://…/ru/…)   або   - Розділ: https://…/ua/…
 *   - Характеристики: …
 * ⚠️ Якщо формат там зміниться — блок без рядка «Ціна» просто не потрапить у пошук
 * (тихо, без помилки), тож після правок productLines() перевірити цей розбір.
 */
export function parseCatalog(text: string): CatalogItem[] {
  const items: CatalogItem[] = [];
  for (const block of text.split(/^### /m).slice(1)) {
    const lines = block.split("\n");
    const name = (lines[0] ?? "").trim();
    const price = /^- Ціна: (.+?)(?:, (в наявності|під замовлення))?$/m.exec(block);
    if (!name || !price) continue;
    const page = /^- Сторінка: (\S+) \(рос\. (\S+)\)/m.exec(block);
    const section = /^- Розділ: (\S+)/m.exec(block);
    const url = page?.[1] ?? section?.[1];
    if (!url) continue;
    const specs = /^- Характеристики: (.+)$/m.exec(block)?.[1] ?? "";
    items.push({
      name,
      price: price[1] ?? "",
      inStock: price[2] === "в наявності",
      url,
      urlRu: page?.[2] ?? url.replace("/ua/", "/ru/"),
      specs,
      hay: norm(`${name} ${specs}`),
    });
  }
  return items;
}

/** Каталог качаємо один раз на сторінку і лише коли агент справді викликав пошук. */
let catalogPromise: Promise<CatalogItem[]> | null = null;

function loadCatalog(): Promise<CatalogItem[]> {
  catalogPromise ??= (async () => {
    const index = await fetch("/llms.txt").then((r) => (r.ok ? r.text() : ""));
    const slugs = [
      ...new Set([...index.matchAll(/\/llms\/([a-z0-9-]+)\.txt/g)].map((m) => m[1] ?? "")),
    ].filter((s) => s && !NON_PRODUCT_PARTS.has(s));
    const texts = await Promise.all(
      slugs.map((s) =>
        fetch(`/llms/${s}.txt`)
          .then((r) => (r.ok ? r.text() : ""))
          .catch(() => ""),
      ),
    );
    return texts.flatMap(parseCatalog);
  })().catch((e) => {
    catalogPromise = null; // наступний виклик спробує ще раз
    throw e;
  });
  return catalogPromise;
}

export function searchCatalog(
  items: CatalogItem[],
  query: string,
  inStockOnly: boolean,
): CatalogItem[] {
  const tokens = norm(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return [];
  const pool = inStockOnly ? items.filter((i) => i.inStock) : items;
  const scored = pool
    .map((item) => {
      const nameHay = norm(item.name);
      let score = 0;
      for (const t of tokens) {
        if (nameHay.includes(t)) score += 2;
        else if (item.hay.includes(t)) score += 1;
        else return null; // кожне слово запиту має десь зустрітися
      }
      return { item, score };
    })
    .filter((x): x is { item: CatalogItem; score: number } => x !== null);
  // За однакового збігу коротша назва — точніше влучання («Tenergy 05» раніше за ракетку з нею).
  scored.sort((a, b) => b.score - a.score || a.item.name.length - b.item.name.length);
  return scored.slice(0, MAX_RESULTS).map((x) => x.item);
}

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);

export function searchProductsTool(locale: "ua" | "ru"): ModelContextTool {
  return {
    name: "search_products",
    description:
      "Search the ttmax.com.ua catalog of Butterfly table tennis equipment sold in Ukraine " +
      "(rubbers, blades, rackets, balls, tables, apparel, accessories). Returns up to 6 matching " +
      "products with price in UAH, stock status and product page URL. Read-only: it does not " +
      "add anything to the cart and does not place orders.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            'Product or model name, e.g. "Tenergy 05", "Viscaria", "Dignics 09C". Latin model names work best.',
        },
        in_stock_only: {
          type: "boolean",
          description: "If true, return only products that are in stock now.",
        },
      },
      required: ["query"],
    },
    annotations: { readOnlyHint: true, untrustedContentHint: false, consequentialHint: false },
    execute: async (input) => {
      const query = typeof input.query === "string" ? input.query.slice(0, 120) : "";
      if (!query.trim()) return "Error: `query` is required (a product or model name).";
      let items: CatalogItem[];
      try {
        items = await loadCatalog();
      } catch {
        return "Error: the catalog could not be loaded. Try again or open /llms.txt on this site.";
      }
      const found = searchCatalog(items, query, input.in_stock_only === true);
      if (found.length === 0) {
        return `No products match "${query}". Try a shorter model name, or browse ${location.origin}/${locale}.`;
      }
      const rows = found.map((p, i) => {
        const stock = p.inStock ? "in stock" : "on order";
        const specs = p.specs ? `\n   ${clip(p.specs, 110)}` : "";
        // У файлі ціна — «3115 грн» або «ціна за запитом» (money() у lib/seo/llms.ts).
        const uah = /^(\d+) грн$/.exec(p.price);
        const price = uah ? `${uah[1]} UAH` : "price on request";
        return `${i + 1}. ${p.name} — ${price}, ${stock}\n   ${locale === "ru" ? p.urlRu : p.url}${specs}`;
      });
      return clip(
        `Products on ttmax.com.ua matching "${query}" (prices change — confirm on the product page):\n${rows.join("\n")}`,
        MAX_OUTPUT,
      );
    },
  };
}

type Ld = Record<string, unknown>;

const isObj = (v: unknown): v is Ld => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Вузол Product зі сторінки, що описує САМЕ цю сторінку (url вузла = поточна адреса).
 * На хабах і в категоріях Product-вузлів багато (список товарів) — вони не рахуються.
 */
export function currentProductLd(): Ld | null {
  const here = location.pathname.replace(/\/$/, "");
  for (const el of document.querySelectorAll('script[type="application/ld+json"]')) {
    let data: unknown;
    try {
      data = JSON.parse(el.textContent ?? "");
    } catch {
      continue;
    }
    const nodes = Array.isArray(data)
      ? data
      : isObj(data) && Array.isArray(data["@graph"])
        ? data["@graph"]
        : [data];
    for (const n of nodes) {
      if (!isObj(n) || n["@type"] !== "Product" || typeof n.url !== "string") continue;
      try {
        if (new URL(n.url).pathname.replace(/\/$/, "") === here) return n;
      } catch {
        /* некоректний url у вузлі — пропускаємо */
      }
    }
  }
  return null;
}

export function productDetailsTool(): ModelContextTool {
  return {
    name: "get_product_details",
    description:
      "Get structured data for the product shown on the current ttmax.com.ua page: name, brand, " +
      "SKU, price in UAH, stock status, rating and description. Read-only. Available only on " +
      "product pages.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true, untrustedContentHint: false, consequentialHint: false },
    execute: async () => {
      const p = currentProductLd();
      if (!p) return "Error: this page is not a product page.";
      const offers = isObj(p.offers) ? p.offers : {};
      const price =
        typeof offers.price === "number" || typeof offers.price === "string"
          ? `${offers.price}`
          : offers.lowPrice !== undefined
            ? `${offers.lowPrice}–${offers.highPrice} (depends on the variant)`
            : "on request";
      const stock = `${offers.availability ?? ""}`.endsWith("InStock") ? "in stock" : "on order";
      const rating = isObj(p.aggregateRating)
        ? `${p.aggregateRating.ratingValue}/5 (${p.aggregateRating.reviewCount} customer reviews)`
        : null;
      const lines = [
        `Name: ${p.name}${p.alternateName ? ` (${p.alternateName})` : ""}`,
        isObj(p.brand) ? `Brand: ${p.brand.name}` : null,
        p.sku ? `SKU: ${p.sku}` : null,
        `Price: ${price} ${offers.priceCurrency ?? "UAH"}`,
        `Availability: ${stock}`,
        rating ? `Rating: ${rating}` : null,
        `URL: ${p.url}`,
        typeof p.description === "string" ? `Description: ${clip(p.description, 700)}` : null,
      ];
      return clip(lines.filter(Boolean).join("\n"), MAX_OUTPUT);
    },
  };
}
