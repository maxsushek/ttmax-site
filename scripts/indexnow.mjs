// IndexNow: повідомляє Bing, Yandex та інших учасників протоколу про нові й змінені URL.
// ChatGPT-пошук і Copilot беруть результати з індексу Bing — нові статті й сторінки гравців
// потрапляють туди за дні, а не за тижні.
//
// ⚠️ НАВІЩО ЛИШЕ ПІСЛЯ ДЕПЛОЮ. Скрипт читає ЖИВИЙ sitemap.xml: надіслати URL до того, як
// сторінка стала доступна, означає, що Bing прийде на 404 і знизить довіру до наших пінгів.
//
// Ключ — публічний за задумом протоколу: Bing перевіряє його файлом https://ttmax.com.ua/<KEY>.txt
// (лежить у public/). Це не секрет.
//
// Що надсилаємо: URL, яких не було в минулому знімку sitemap, і ті, у яких змінився <lastmod>
// (статті, гравці). Товари без lastmod після першого прогону окремо не пінгуються — для разової
// масової відправки є --all. Знімок — .indexnow/state.json (у .gitignore).
//
// Запуск:
//   node scripts/indexnow.mjs            — нові й змінені з минулого запуску
//   node scripts/indexnow.mjs --all      — усі URL із sitemap (перший запуск)
//   node scripts/indexnow.mjs --dry      — лише показати, що буде надіслано
//   node scripts/indexnow.mjs <url> …    — конкретні адреси
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const KEY = "6c8f4bfa3f3268b53583611165b97c6a";
const HOST = "ttmax.com.ua";
const SITE = `https://${HOST}`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const BATCH = 10000; // ліміт протоколу на один запит

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STATE_DIR = join(ROOT, ".indexnow");
const STATE = join(STATE_DIR, "state.json");

const args = process.argv.slice(2);
const all = args.includes("--all");
const dry = args.includes("--dry");
const explicit = args.filter((a) => a.startsWith("http"));

async function sitemap() {
  const res = await fetch(`${SITE}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap.xml: HTTP ${res.status}`);
  const xml = await res.text();
  const map = {};
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = m[1].match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (!loc) continue;
    map[loc] = m[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? "";
  }
  return map;
}

async function keyIsLive() {
  const res = await fetch(`${SITE}/${KEY}.txt`);
  return res.ok && (await res.text()).trim() === KEY;
}

async function submit(urls) {
  for (let i = 0; i < urls.length; i += BATCH) {
    const urlList = urls.slice(i, i + BATCH);
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList }),
    });
    // 200 — прийнято, 202 — прийнято, ключ ще перевіряється. Решта — помилка.
    if (res.status !== 200 && res.status !== 202) {
      throw new Error(`IndexNow: HTTP ${res.status} ${await res.text().catch(() => "")}`.trim());
    }
    console.log(`  надіслано ${urlList.length} URL → HTTP ${res.status}`);
  }
}

if (!(await keyIsLive())) {
  console.error(`✗ Файл ключа ${SITE}/${KEY}.txt недоступний — спершу задеплойте public/${KEY}.txt`);
  process.exit(1);
}

const current = await sitemap();
const prev = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : {};
const urls = explicit.length
  ? explicit
  : Object.keys(current).filter((u) => all || !(u in prev) || (current[u] && current[u] !== prev[u]));

console.log(`  у sitemap: ${Object.keys(current).length}; до відправки: ${urls.length}`);
if (urls.length === 0 || dry) {
  for (const u of urls.slice(0, 20)) console.log("   ", u);
  if (urls.length > 20) console.log(`    … ще ${urls.length - 20}`);
  process.exit(0);
}

await submit(urls);
if (!explicit.length) {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(STATE, JSON.stringify(current));
}
console.log("✓ IndexNow: готово");
