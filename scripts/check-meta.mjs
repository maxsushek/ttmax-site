// Перевірка довжин <title> і meta description.
//
// Запуск:
//   npm run check:meta            — обхід ЖИВОГО сайту по sitemap (основний режим)
//   npm run check:meta -- --build — локальна збірка .next (швидка перевірка перед деплоєм)
//
// ⚠️ ЧОМУ ОСНОВНИЙ РЕЖИМ — ЖИВИЙ САЙТ, А НЕ ЗБІРКА.
//
// Метадані категорій приходять із CMS (Supabase content_blocks) і ПЕРЕБИВАЮТЬ файл
// categories.ts (page.tsx:108-110). Локальна збірка Supabase не бачить, тому рендерить
// запасні значення з файлу — інші за довжиною. Прогін по .next показував «проблеми» в
// /obuv, /setki, /chehly, /odyag, яких на проді НЕМАЄ: там CMS-описи вкладаються в норму.
// Плюс токени {{count}}/{{price_from}} розкриваються лише в рантаймі, тож довжина рядка
// в базі не дорівнює довжині в сніпеті.
//
// Режим --build лишений як груба перевірка того, що збирається з коду (статті, картки,
// службові сторінки); CMS-категорії в ньому свідомо пропускаються.
//
// ⚠️ Відбір сторінок — по ШЛЯХУ, а не по тегу robots: у локальній збірці без Supabase
// noindex стоїть геть на всьому (товари вважаються без фото), і перевірка мовчки була б
// зеленою на нулі сторінок.
//
// ПОРОГИ. description 110–160, title ≤ 60. Коротший опис Google часто ігнорує й склеює
// сніпет сам, із випадкового місця сторінки; довший — ріже на півслові.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const DESC_MIN = 110;
const DESC_MAX = 160;
const TITLE_MAX = 60;
const SITE = "https://ttmax.com.ua";
const BUILD_ROOT = ".next/server/app";

/** Довгий title пробачаємо там, де довжину задає назва моделі. */
const TITLE_EXEMPT = /\/butterfly\/(osnovaniya|nakladki|stoly|chehly|odyag|obuv)\//;

/**
 * Пропускаємо ТІЛЬКИ в режимі --build — у живому режимі ці сторінки перевіряються
 * нормально, бо в sitemap потрапляє лише те, що справді в індексі.
 */
const BUILD_ONLY_SKIP = [
  // метадані живуть у CMS, локальна збірка їх не бачить
  /^\/(ua|ru)\/(nakladki|myachi|chehly|setki|obuv|odyag|aksessuary)$/,
  // сторінки серій індексуються умовно (seriesIndexable): у Roundell 2 моделі — noindex
  /^\/(ua|ru)\/(nakladki|osnovaniya)\/[a-z0-9-]+$/,
  /^\/_not-found$/,
];

/** Поза індексом за задумом (productIndexable + бренд-категорії). */
const SKIP = [
  /\/butterfly\/(odyag|obuv|chehly|myachi|aksessuary|klej|setki|rakety)\//,
  /^\/(ua|ru)\/butterfly\/[a-z-]+$/,
];

const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»")
    .replace(/&mdash;/g, "—")
    .replace(/&nbsp;/g, " ");

const pick = (html) => ({
  title: decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? ""),
  desc: decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? ""),
});

function walk(dir) {
  const out = [];
  let entries;
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
}

async function fromLive() {
  const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const out = [];
  const CONC = 8;
  for (let i = 0; i < urls.length; i += CONC) {
    out.push(
      ...(await Promise.all(
        urls.slice(i, i + CONC).map(async (u) => {
          try {
            const r = await fetch(u, { headers: { "user-agent": "ttmax-check-meta" } });
            return { page: u.replace(SITE, ""), ...pick(await r.text()) };
          } catch {
            return { page: u.replace(SITE, ""), title: "", desc: "" };
          }
        }),
      )),
    );
  }
  return out;
}

function fromBuild() {
  const files = walk(BUILD_ROOT);
  if (!files.length) {
    console.error("✗ Немає зібраного HTML у .next/server/app — спершу `npm run build`.");
    process.exit(1);
  }
  return files.map((f) => ({
    page: f.replace(BUILD_ROOT, "").replace(/\.html$/, ""),
    ...pick(readFileSync(f, "utf8")),
  }));
}

const useBuild = process.argv.includes("--build");
const pages = useBuild ? fromBuild() : await fromLive();

const problems = [];
let checked = 0;
let skippedCms = 0;

for (const { page, title, desc } of pages) {
  if (SKIP.some((re) => re.test(page))) continue;
  if (useBuild && BUILD_ONLY_SKIP.some((re) => re.test(page))) {
    skippedCms += 1;
    continue;
  }
  checked += 1;

  if (!desc) problems.push([page, "немає description"]);
  else if (desc.length < DESC_MIN) problems.push([page, `description ${desc.length} < ${DESC_MIN}`]);
  else if (desc.length > DESC_MAX) problems.push([page, `description ${desc.length} > ${DESC_MAX}`]);

  if (!title) problems.push([page, "немає title"]);
  else if (title.length > TITLE_MAX && !TITLE_EXEMPT.test(page))
    problems.push([page, `title ${title.length} > ${TITLE_MAX}`]);
}

console.log(`  режим: ${useBuild ? "локальна збірка" : "живий сайт"} · перевірено: ${checked}`);
if (skippedCms) console.log(`  пропущено (перевіряються лише на живому сайті): ${skippedCms}`);

if (!problems.length) {
  console.log("  ✓ довжини title і description у нормі");
  process.exit(0);
}
console.log(`  ✗ проблем: ${problems.length}\n`);
for (const [page, why] of problems.sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`   ${why.padEnd(26)} ${page}`);
}
process.exit(1);
