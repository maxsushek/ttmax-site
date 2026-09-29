// PNG-превʼю статей для соцмереж → public/blog/og/{slug}-{ua|ru}.png (1200×630)
//
// ⚠️ НАВІЩО. Обкладинки блогу — SVG (див. gen-blog-covers.mjs), і в og:image вони йшли
// як є. Telegram, Facebook, Viber, WhatsApp і LinkedIn SVG у превʼю НЕ показують: посилання
// на статтю розліталось без картинки, хоча на сайті обкладинка на місці. Помітив власник,
// коли поділився статтею в Telegram.
//
// Тому для кожної статті з SVG-обкладинкою робимо растр 1200×630 — стандартний розмір
// превʼю. Заголовок впечатано в картинку: SVG-обкладинка — це ФОН під текст, без нього
// ліва половина кадру порожня.
//
// ⚠️ ГЕНЕРУВАТИ ЛОКАЛЬНО Й КОМІТИТИ PNG. На білд-машині Vercel немає системних шрифтів,
// і кирилиця перетворилась би на квадратики. Шрифт — DIN Condensed (macOS), найближчий
// до Tektur у заголовках сайту з тих, що вміє рендерити librsvg.
//
// Нова стаття з SVG-обкладинкою → запусти цей скрипт і закоміть PNG. Сторінка статті
// бере превʼю з public/blog/og/ автоматично (lib/seo/blog-og.ts).
//
// Запуск: node scripts/gen-og-covers.mjs
import { readFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "blog", "og");
mkdirSync(OUT, { recursive: true });

const W = 1200;
const H = 630;
const ACCENT = "#E8FF47";
const TEXT = "#F2F4F7";
const MUTED = "#8A93A0";
const BG = "#07090C";

/**
 * Статті з blog.ts: slug, h1 обома мовами, coverSrc.
 * ⚠️ Розбір регуляркою, бо blog.ts — TypeScript. Формат блоків сталий (slug → h1 → …);
 * якщо зміниться — скрипт впаде на перевірці нижче, а не мовчки пропустить статтю.
 */
function readPosts() {
  const src = readFileSync(join(ROOT, "src", "data", "blog.ts"), "utf8");
  const posts = [];
  // Між slug і h1 бувають коментарі (напр. «ТАРГЕТ: …» у tenergy-chy-dignics) — тому [\s\S]*?.
  const re = /\n {4}slug: "([a-z0-9-]+)",[\s\S]*?\n {4}h1: \{\n {6}ua: "((?:[^"\\]|\\.)*)",\n {6}ru: "((?:[^"\\]|\\.)*)",/g;
  for (const m of src.matchAll(re)) {
    const tail = src.slice(m.index, m.index + 6000);
    const cover = tail.match(/\n {4}coverSrc: "([^"]+)"/)?.[1];
    const hero = /\n {4}heroPublicId: "/.test(tail.split(/\n {2}"[a-z0-9-]+": \{/)[0] ?? "");
    posts.push({ slug: m[1], h1: { ua: m[2], ru: m[3] }, cover, hero });
  }
  if (posts.length === 0) throw new Error("Не знайшов жодної статті — змінився формат blog.ts?");
  return posts;
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Перенос за словами під ширину колонки. Ширину рядка рахуємо приблизно: у DIN Condensed
 * великі літери ≈ 0.47 кегля. Підбираємо найбільший кегль, за якого заголовок влазить
 * у висоту колонки, — довгі російські заголовки отримують менший шрифт, а не обрізаються.
 */
function layoutTitle(title) {
  const words = title.toUpperCase().split(/\s+/);
  for (const size of [76, 68, 60, 54, 48]) {
    const maxChars = Math.floor(600 / (size * 0.47));
    const lines = [];
    let cur = "";
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (next.length > maxChars && cur) {
        lines.push(cur);
        cur = w;
      } else cur = next;
    }
    if (cur) lines.push(cur);
    const lineH = Math.round(size * 1.02);
    if (lines.length * lineH <= 400) return { size, lineH, lines };
  }
  throw new Error(`Заголовок не влазить навіть у найменшому кеглі: ${title}`);
}

function overlay(title, locale) {
  const { size, lineH, lines } = layoutTitle(title);
  const blockH = lines.length * lineH;
  const top = Math.round(128 + (400 - blockH) / 2) + size * 0.8;
  const label = locale === "ua" ? "БЛОГ · TTMAX" : "БЛОГ · TTMAX";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs><linearGradient id="f" x1="0" x2="1"><stop offset="0" stop-color="${BG}" stop-opacity="0.9"/><stop offset="0.55" stop-color="${BG}" stop-opacity="0.35"/><stop offset="1" stop-color="${BG}" stop-opacity="0"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#f)"/>
<rect x="60" y="54" width="176" height="40" rx="20" fill="none" stroke="${ACCENT}" stroke-opacity="0.6" stroke-width="2"/>
<text x="148" y="81" fill="${ACCENT}" font-family="DIN Condensed" font-weight="700" font-size="22" letter-spacing="2" text-anchor="middle">${esc(label)}</text>
${lines
  .map(
    (l, i) =>
      `<text x="60" y="${Math.round(top + i * lineH)}" fill="${TEXT}" font-family="DIN Condensed" font-weight="700" font-size="${size}">${esc(l)}</text>`,
  )
  .join("\n")}
<rect x="60" y="572" width="40" height="3" fill="${ACCENT}"/>
<text x="114" y="582" fill="${MUTED}" font-family="Arial Narrow" font-size="22">ttmax.com.ua</text>
</svg>`;
}

async function render(post, locale) {
  // Обкладинка 1400×1050 → ширина 1200, висота 900; кадр 630 беремо з середини.
  // Безпечна зона обкладинки (y 200–850) після масштабу й обрізки лягає в 36–594 — малюнок цілий.
  const coverSvg = readFileSync(join(ROOT, "public", post.cover.replace(/^\//, "")));
  const base = await sharp(coverSvg, { density: 110 })
    .resize(W, 900, { fit: "fill" })
    .extract({ left: 0, top: 135, width: W, height: H })
    .png()
    .toBuffer();
  const file = join(OUT, `${post.slug}-${locale}.png`);
  await sharp(base)
    .composite([{ input: Buffer.from(overlay(post.h1[locale], locale)) }])
    .png({ compressionLevel: 9 })
    .toFile(file);
  return file;
}

const posts = readPosts().filter((p) => p.cover?.endsWith(".svg") && !p.hero);
for (const p of posts) {
  for (const locale of ["ua", "ru"]) {
    const f = await render(p, locale);
    console.log(`  ${f.replace(ROOT + "/", "")}`);
  }
}
console.log(`  статей із SVG-обкладинкою: ${posts.length}`);
