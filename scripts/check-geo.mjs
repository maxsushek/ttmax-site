// Гейт GEO: розмітка, файли для ШІ, стрічки, карта сайту.
//
// Запуск:
//   npm run check:geo            — по ЖИВОМУ сайту (основний режим)
//   npm run check:geo -- --build — по локальній збірці .next (перед деплоєм)
//
// ⚠️ НАВІЩО. Валідна на вигляд розмітка мовчки розвалюється: посилання на логотип
// починає віддавати 404, у «пріоритетних сторінках» лишається адреса видаленої сторінки,
// в JSON-LD їде рядок замість обʼєкта. Очима це не видно — сторінка виглядає нормально.
// Тому перевіряємо машиною, а не переглядом.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SITE = "https://ttmax.com.ua";
const BUILD_ROOT = ".next/server/app";
const useBuild = process.argv.includes("--build");

const problems = [];
const ok = [];
const fail = (what, why) => problems.push(`${what} — ${why}`);

/** Усі блоки application/ld+json зі сторінки. */
function ldBlocks(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(
    (m) => m[1],
  );
}

/** Розбирає блоки; повертає вузли (розкриваючи @graph). Кидає при невалідному JSON. */
function ldNodes(html, where) {
  const nodes = [];
  for (const raw of ldBlocks(html)) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      fail(where, `JSON-LD не розбирається: ${String(e).slice(0, 80)} …${raw.slice(0, 60)}`);
      continue;
    }
    for (const node of parsed["@graph"] ?? [parsed]) nodes.push(node);
  }
  return nodes;
}

async function head(url) {
  try {
    const r = await fetch(url, { headers: { "user-agent": "ttmax-check-geo" } });
    return { status: r.status, type: r.headers.get("content-type") ?? "", text: await r.text() };
  } catch (e) {
    return { status: 0, type: "", text: "", error: String(e) };
  }
}

/**
 * Маніфест ARD (/.well-known/ard.json) — ті самі правила, що в аудиті Lighthouse `ard-schema`
 * (порт conformance-тесту ARD v0.91): помилка = аудит провалено, попередження = 0,9 бала.
 * https://developer.chrome.com/docs/lighthouse/agentic-browsing/ard
 * Повертає записи, щоб режим живого сайту перевірив ще й адреси з `url`.
 */
const ARD_STANDARD_TYPES = new Set([
  "application/ai-catalog+json",
  "application/agent-card+json",
  "application/a2a-agent-card+json",
  "application/mcp-server-card+json",
  "application/agent-skills+json",
  "application/agent-skills+md",
  "application/agent-skills+zip",
  "application/agent-skills+gzip",
  "application/agent-plugins+zip",
  "application/agent-plugins+gzip",
  "application/ai-registry",
  "application/ai-registry+json",
]);
function checkArd(text, where) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    fail(where, `не JSON: ${String(e).slice(0, 80)}`);
    return [];
  }
  const entries = data?.entries;
  if (!Array.isArray(entries) || entries.length === 0) {
    fail(where, "немає масиву entries (або він порожній)");
    return [];
  }
  for (const [i, e] of entries.entries()) {
    const label = `${where} · ${e?.displayName || e?.identifier || `запис №${i}`}`;
    if (!/^urn:air:[a-zA-Z0-9.-]+(:[a-zA-Z0-9._-]+)+$/.test(e?.identifier ?? ""))
      fail(label, `identifier не у форматі urn:air:<видавець>:<простір>:<назва>: ${e?.identifier}`);
    if (!e?.displayName) fail(label, "немає displayName");
    if (!ARD_STANDARD_TYPES.has(e?.type))
      fail(label, `type не зі стандартних типів ARD (Lighthouse дасть попередження): ${e?.type}`);
    if ("url" in (e ?? {}) === "data" in (e ?? {})) fail(label, "має бути рівно одне з url / data");
    const q = e?.representativeQueries;
    if (!Array.isArray(q) || q.length < 2 || q.length > 5 || q.some((x) => typeof x !== "string"))
      fail(label, "representativeQueries: потрібно 2–5 рядків (інакше запис не знаходиться пошуком)");
  }
  return entries;
}

if (useBuild) {
  // ---- Режим збірки: перевіряємо лише те, що видно в HTML без мережі. ----
  const walk = (dir) => {
    const out = [];
    let entries = [];
    try {
      entries = readdirSync(dir);
    } catch {
      return out;
    }
    for (const e of entries) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) out.push(...walk(p));
      else if (e.endsWith(".html")) out.push(p);
    }
    return out;
  };
  const files = walk(BUILD_ROOT);
  if (files.length === 0) {
    console.error("✗ Немає зібраного HTML у .next/server/app — спершу `npm run build`.");
    process.exit(1);
  }
  let orgSeen = 0;
  for (const f of files) {
    const page = f.replace(BUILD_ROOT, "").replace(/\.html$/, "");
    const nodes = ldNodes(readFileSync(f, "utf8"), page);
    const org = nodes.find((n) => n["@type"] === "Organization");
    if (!org) continue;
    orgSeen += 1;
    if (!org["@id"]) fail(page, "Organization без @id — сторінка оголошує ОКРЕМУ компанію");
  }
  ok.push(`сторінок зі збірки перевірено: ${files.length}, з них із Organization: ${orgSeen}`);

  // Маніфест ARD: статичне тіло маршруту app/well-known/ard.json.
  try {
    const n = checkArd(readFileSync(join(BUILD_ROOT, "well-known/ard.json.body"), "utf8"), "ard.json").length;
    ok.push(`ard.json зі збірки: записів ${n}`);
  } catch {
    fail("ard.json", "немає у збірці (.next/server/app/well-known/ard.json.body)");
  }
} else {
  // ---- Режим живого сайту. ----
  const files = [
    ["/robots.txt", "text/plain"],
    ["/sitemap.xml", "xml"],
    ["/llms.txt", "text/plain"],
    ["/llms-full.txt", "text/plain"],
    ["/ai.txt", "text/plain"],
    ["/.well-known/ai.txt", "text/plain"],
    ["/.well-known/ard.json", "application/json"],
    ["/.well-known/ai-catalog.json", "application/json"],
    ["/ua/feed.xml", "atom"],
    ["/ru/feed.xml", "atom"],
  ];
  const fetched = {};
  for (const [path, expectType] of files) {
    const r = await head(SITE + path);
    fetched[path] = r;
    if (r.status !== 200) fail(path, `HTTP ${r.status}`);
    else if (!r.type.includes(expectType) && expectType !== "atom" && expectType !== "xml")
      fail(path, `content-type ${r.type}`);
    else ok.push(`${path} → 200 (${(r.text.length / 1024).toFixed(1)} КБ)`);
  }

  // Стрічки — справді Atom, а не RSS.
  for (const p of ["/ua/feed.xml", "/ru/feed.xml"]) {
    const t = fetched[p]?.text ?? "";
    if (!t.includes('xmlns="http://www.w3.org/2005/Atom"')) fail(p, "не Atom 1.0");
    if (!t.includes("<updated>")) fail(p, "немає <updated> — сенс Atom саме в другій даті");
  }

  // Кожна «пріоритетна» сторінка з ai.txt існує (саме тут ловиться посилання в нікуди).
  for (const line of (fetched["/ai.txt"]?.text ?? "").split("\n")) {
    const m = line.match(/^Preferred:\s*(\S+)/);
    if (!m) continue;
    const r = await head(m[1]);
    if (r.status !== 200) fail(`ai.txt → ${m[1]}`, `HTTP ${r.status}`);
  }

  // Кожне посилання з llms.txt існує.
  const links = [...(fetched["/llms.txt"]?.text ?? "").matchAll(/\]\((https:\/\/[^)]+)\)/g)].map(
    (m) => m[1],
  );
  for (const u of links) {
    const r = await head(u);
    if (r.status !== 200) fail(`llms.txt → ${u}`, `HTTP ${r.status}`);
  }
  ok.push(`посилань із llms.txt перевірено: ${links.length}`);

  // Маніфест ARD: схема + кожен ресурс із `url` справді відкривається. Стара адреса
  // (ai-catalog.json) мусить віддавати той самий вміст.
  const ardText = fetched["/.well-known/ard.json"]?.text ?? "";
  for (const e of checkArd(ardText, "ard.json")) {
    if (!e.url) continue;
    const r = await head(e.url);
    if (r.status !== 200) fail(`ard.json → ${e.url}`, `HTTP ${r.status}`);
    else ok.push(`ard.json → ${e.url.replace(SITE, "")} → 200`);
  }
  if (ardText && fetched["/.well-known/ai-catalog.json"]?.text !== ardText)
    fail("/.well-known/ai-catalog.json", "вміст відрізняється від ard.json");

  // Розмітка: головна, категорія, картка, стаття.
  const pages = ["/ua", "/ru", "/ua/nakladki", "/ua/butterfly/nakladki/dignics-05", "/ua/blog"];
  let orgId = null;
  for (const p of pages) {
    const r = await head(SITE + p);
    if (r.status !== 200) {
      fail(p, `HTTP ${r.status}`);
      continue;
    }
    const nodes = ldNodes(r.text, p);
    const org = nodes.find((n) => n["@type"] === "Organization");
    if (!org) fail(p, "немає вузла Organization");
    else if (!org["@id"]) fail(p, "Organization без @id");
    else if (orgId && org["@id"] !== orgId) fail(p, `інший @id організації: ${org["@id"]}`);
    else orgId ??= org["@id"];

    // Картинки з розмітки мусять віддавати 200: валідна розмітка з битим лого
    // виглядає здоровою, і це не видно ніяк інакше.
    const imgs = [...r.text.matchAll(/"(?:logo|contentUrl|image)":"(https:\/\/[^"]+)"/g)]
      .map((m) => m[1])
      .slice(0, 5);
    for (const img of imgs) {
      const ir = await head(img);
      if (ir.status !== 200) fail(`${p} → ${img.slice(0, 70)}…`, `картинка HTTP ${ir.status}`);
    }
  }
  if (orgId) ok.push(`єдиний @id організації на всіх сторінках: ${orgId}`);
}

console.log(`  режим: ${useBuild ? "локальна збірка" : "живий сайт"}`);
for (const line of ok) console.log(`  ✓ ${line}`);
if (problems.length === 0) {
  console.log("  ✓ GEO-перевірка пройдена");
  process.exit(0);
}
console.log(`  ✗ проблем: ${problems.length}\n`);
for (const p of problems) console.log(`   ${p}`);
process.exit(1);
