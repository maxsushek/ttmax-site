// Інвентар гравців Butterfly з офіційних сторінок Butterfly Japan → src/data/proSetupsData.ts.
//
//   node scripts/gen-pro-setups.mjs --fetch   — завантажити всі сторінки гравців (≈180 запитів,
//                                              по 4 одночасно) у .work/prosetups/raw, розібрати й
//                                              оновити scripts/pro-setups/setups.json, потім TS;
//   node scripts/gen-pro-setups.mjs           — лише перегенерувати TS із setups.json.
//
// Джерело: https://www.butterfly.co.jp/players/ (robots.txt — Allow: /). Блок «使用用具» на
// сторінці гравця: дата «…現在» (станом на) і до трьох позицій у сталому порядку
// основа → форхенд → бекхенд (сторони Butterfly не підписує; той самий порядок узято за основу
// в профілях гравців — див. src/data/playerProfiles.ts). Якщо накладка Butterfly лише одна,
// сторону не знаємо — друга накладка в гравця іншого бренду або не вказана.
//
// Скрипт ПАДАЄ, якщо на сторінках зʼявився артикул, якого немає в scripts/pro-setups/map.json,
// або slug зі словника зник із каталогу: вигадувати відповідність «за назвою» не можна.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "scripts/pro-setups");
const RAW = join(ROOT, ".work/prosetups/raw");
const BASE = "https://www.butterfly.co.jp";
const SECTIONS = ["", "int_men/", "int_women/", "jpn_men/", "jpn_women/"];

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ensp;|&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
const text = (s) => decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

async function get(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(40_000), headers: { "user-agent": "Mozilla/5.0 (ttmax.com.ua; equipment stats)" } });
      if (r.ok) return await r.text();
      if (r.status === 404) return null;
    } catch {
      /* повтор */
    }
  }
  throw new Error(`не вдалося завантажити ${url}`);
}

async function fetchAll() {
  mkdirSync(RAW, { recursive: true });
  const pages = new Set();
  for (const s of SECTIONS) {
    const html = await get(`${BASE}/players/${s}`);
    // Списки розділів зберігаємо: з них беремо, хто в якому розділі (чоловіки/жінки, Японія/світ).
    writeFileSync(join(RAW, `_${s.replace("/", "") || "index"}.html`), html);
    for (const m of html.matchAll(/href="\/players\/detail\/([^"]+\.html)"/g)) pages.add(m[1]);
  }
  const list = [...pages].sort();
  let i = 0;
  const worker = async () => {
    while (i < list.length) {
      const p = list[i++];
      const html = await get(`${BASE}/players/detail/${p}`);
      if (html) writeFileSync(join(RAW, p), html);
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  writeFileSync(join(RAW, "_pages.json"), JSON.stringify(list));
  console.log(`  сторінок гравців: ${list.length}`);
  return list;
}

function parsePage(page, html) {
  const head = html.indexOf('class="playersDetail');
  const i = html.indexOf("playersDetail_product");
  if (i < 0) return null; // гравець без блоку інвентарю (здебільшого юніори)
  const j = html.indexOf("/.playersDetail_product", i);
  const blk = html.slice(i, j);
  const date = /(\d{4})年(\d{1,2})月(\d{1,2})日現在/.exec(blk);
  const items = [];
  for (const part of blk.split('class="l-grid_col').slice(1)) {
    const cap = /imgSet_caption">([\s\S]*?)<\/div>/.exec(part);
    const name = cap ? text(cap[1]) : "";
    if (!name) continue;
    const code = /\/products\/detail\/(\d+)\.html/.exec(part);
    items.push({ code: code ? code[1] : null, name });
  }
  const info = text(html.slice(head, i).replace(/<[^>]+>/g, " | "));
  const nameM = /\| ([^|]*（([A-Z]{3})）) \| ([^|]+) \|/.exec(info);
  const styleM = /戦型 \| \| ([^|]+)/.exec(info);
  const foot = /※([^<]+)</.exec(html.slice(j, j + 800));
  return {
    page,
    nameJp: nameM ? nameM[1].replace(/（[A-Z]{3}）$/, "").trim() : null,
    nameLatin: nameM ? nameM[3].trim() : null,
    country: nameM ? nameM[2] : null,
    style: styleM ? styleM[1].trim() : null,
    asOf: date ? `${date[1]}-${date[2].padStart(2, "0")}-${date[3].padStart(2, "0")}` : null,
    items,
    footnote: foot ? decode(foot[1]).trim() : null,
  };
}

const args = process.argv.slice(2);
const today = new Date().toISOString().slice(0, 10);

if (args.includes("--fetch") || args.includes("--parse")) {
  const pages = args.includes("--fetch")
    ? await fetchAll()
    : JSON.parse(readFileSync(join(RAW, "_pages.json"), "utf8"));
  // Розділ сайту Butterfly: int_men / int_women / jpn_men / jpn_women.
  const section = new Map();
  for (const s of ["int_men", "int_women", "jpn_men", "jpn_women"]) {
    const f = join(RAW, `_${s}.html`);
    if (!existsSync(f)) continue;
    for (const m of readFileSync(f, "utf8").matchAll(/href="\/players\/detail\/([^"]+\.html)"/g)) if (!section.has(m[1])) section.set(m[1], s);
  }
  const players = [];
  let without = 0;
  for (const p of pages) {
    const f = join(RAW, p);
    if (!existsSync(f)) continue;
    const r = parsePage(p, readFileSync(f, "utf8"));
    if (!r || r.items.length === 0) {
      without++;
      continue;
    }
    players.push({ ...r, section: section.get(p) ?? null });
  }
  writeFileSync(
    join(DIR, "setups.json"),
    JSON.stringify({ checked: today, source: `${BASE}/players/`, pagesTotal: pages.length, withoutEquipment: without, players }, null, 2) + "\n",
  );
  console.log(`  з інвентарем: ${players.length}, без інвентарю: ${without} → scripts/pro-setups/setups.json`);
}

// ─────────────────────────── генерація TS ───────────────────────────
const S = JSON.parse(readFileSync(join(DIR, "setups.json"), "utf8"));
const M = JSON.parse(readFileSync(join(DIR, "map.json"), "utf8"));
const catalogText = ["bases.ts", "products.ts"].map((f) => readFileSync(join(ROOT, "src/data/catalog", f), "utf8")).join("\n");
const slugExists = (slug) => catalogText.includes(`"slug": "${slug}"`) || catalogText.includes(`slug: "${slug}"`);
const profiles = new Map();
for (const f of readFileSync(join(ROOT, "src/data/playerProfilesData.ts"), "utf8").matchAll(/"slug": "([a-z-]+)",[\s\S]*?"source": "https:\/\/www\.butterfly\.co\.jp\/players\/detail\/([^"]+)"/g)) {
  if (!profiles.has(f[2])) profiles.set(f[2], f[1]);
}

const errors = [];
const unknown = new Set();
function resolve(item, footnote, isBlade) {
  if (item.code && M.products[item.code]) {
    const m = M.products[item.code];
    const fn = footnote && isBlade ? M.footnotes[footnote] : null;
    return { product: m.slug, name: m.en, custom: null, note: fn && fn.slug ? { ua: fn.ua, ru: fn.ru } : null };
  }
  if (!item.code && M.unlinked[item.name]) {
    const m = M.unlinked[item.name];
    return { product: m.slug, name: m.en, custom: null, note: m.label ?? null };
  }
  if (!item.code && M.custom[item.name]) {
    const fn = footnote ? M.footnotes[footnote] : null;
    if (footnote && fn === undefined) unknown.add(`виноска «${footnote}»`);
    return {
      product: fn?.slug ?? null,
      name: null,
      custom: { label: M.custom[item.name], spec: fn ? { ua: fn.ua, ru: fn.ru } : null, surface: fn?.surface ?? null },
      note: null,
    };
  }
  unknown.add(`${item.code ?? "без артикула"} «${item.name}»`);
  return null;
}

const out = [];
const skipped = [];
for (const p of S.players) {
  // Без дати «станом на» — не інвентар гравця (напр. рекламний персонаж «Glayzerman»).
  if (!p.asOf) {
    skipped.push(p.page);
    continue;
  }
  const [b, r1, r2] = p.items;
  const blade = resolve(b, p.footnote, true);
  const fh = r1 ? resolve(r1, null, false) : null;
  const bh = r2 ? resolve(r2, null, false) : null;
  if (!blade) continue;
  const style = p.style ? (M.styles[p.style] ?? null) : null;
  if (p.style && !style) unknown.add(`стиль «${p.style}»`);
  out.push({
    page: p.page.replace(/\.html$/, ""),
    name: p.nameLatin ?? p.nameJp,
    country: p.country,
    // Розділ сайту Butterfly: стать і «Японія / решта світу».
    women: p.section ? p.section.endsWith("women") : null,
    japan: p.section ? p.section.startsWith("jpn") : null,
    profile: profiles.get(p.page) ?? null,
    style,
    asOf: p.asOf,
    blade,
    // Дві накладки — форхенд і бекхенд за порядком на сторінці; одна — сторона невідома.
    fh: r2 ? fh : null,
    bh: r2 ? bh : null,
    single: r2 ? null : fh,
  });
}
for (const s of out) for (const x of [s.blade, s.fh, s.bh, s.single]) if (x?.product && !slugExists(x.product)) errors.push(`${s.page}: slug ${x.product} немає в каталозі`);
if (unknown.size) errors.push(`Невідомі позиції — додайте в scripts/pro-setups/map.json:\n  ${[...unknown].join("\n  ")}`);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
out.sort((a, b) => a.name.localeCompare(b.name));

const ts = `// АВТОГЕНЕРОВАНО scripts/gen-pro-setups.mjs — не правити руками (оновлення: node scripts/gen-pro-setups.mjs --fetch).
import type { ProSetupsData } from "@/data/proSetups";

export const PRO_SETUPS_DATA: ProSetupsData = ${JSON.stringify({ checked: S.checked, source: S.source, setups: out }, null, 2)};
`;
writeFileSync(join(ROOT, "src/data/proSetupsData.ts"), ts);
console.log(`  гравців: ${out.length} (із профілями на сайті: ${out.filter((s) => s.profile).length}) → src/data/proSetupsData.ts`);
if (skipped.length) console.log(`  пропущено без дати: ${skipped.join(", ")}`);
