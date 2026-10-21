// Схема «розміри тенісного столу» для статті rozmiry-tenisnogo-stolu
// → public/blog/rozmiry-skhema-{ua,ru}.svg
//
// Вигляд зверху В МАСШТАБІ (стіл, лінії, сітка зі стійками) + вигляд збоку (висота 76 см,
// сітка 15,25 см). Масштаб чесний: стійки сітки справді виступають за край на 15,25 см,
// і це видно, а не намальовано «на око».
//
// ⚠️ ЧИСЛА — ПРАВИЛА ITTF (Laws of Table Tennis 2026, 2.1 «Стіл» і 2.2 «Сітка»). Похідні
// (половина столу, відстань між стійками) рахуються тут із цих чисел, а не вписуються руками.
// Те саме — у таблиці статті (blog.ts, розділ korotko) і FAQ: міняєш тут — міняй і там.
//
// Запуск: node scripts/gen-table-size-diagram.mjs
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "blog");

// Палітра — спільна для схем блогу.
const BG = "#0E1117";
const GRID = "#212832";
const DIM = "#39424E";
const MUTED = "#8A93A0";
const TEXT = "#F2F4F7";
const ACCENT = "#E8FF47";
const TABLE_TOP = "#1F4F8F";
const FONT = "Oswald,'Arial Narrow',Arial,sans-serif";

/** ITTF, см. */
const LAW = { l: 274, w: 152.5, h: 76, line: 2, centre: 0.3, net: 15.25, post: 15.25 };
const HALF = LAW.l / 2; // 137
const NET_SPAN = LAW.w + 2 * LAW.post; // 183

/** 152.5 → «152,5». */
const cm = (v) => String(Math.round(v * 100) / 100).replace(".", ",");

const T = {
  ua: {
    title: "РОЗМІРИ ТЕНІСНОГО СТОЛУ ЗА ITTF",
    top: "Вигляд зверху, в масштабі",
    side: "Вигляд збоку",
    length: `довжина ${cm(LAW.l)} см`,
    width: `ширина ${cm(LAW.w)} см`,
    half: `половина ${cm(HALF)} см`,
    lines: `бокові й торцеві лінії ${LAW.line} см`,
    centre: "центральна лінія 3 мм (для парної гри)",
    posts: `стійки сітки: ${cm(LAW.post)} см за край`,
    span: `між стійками ${cm(NET_SPAN)} см`,
    height: `висота ${LAW.h} см`,
    net: `сітка ${cm(LAW.net)} см`,
    floor: "підлога",
    bounce: "відскок ≈ 23 см з висоти 30 см",
    surface: "поверхня темна й матова",
  },
  ru: {
    title: "РАЗМЕРЫ ТЕННИСНОГО СТОЛА ПО ITTF",
    top: "Вид сверху, в масштабе",
    side: "Вид сбоку",
    length: `длина ${cm(LAW.l)} см`,
    width: `ширина ${cm(LAW.w)} см`,
    half: `половина ${cm(HALF)} см`,
    lines: `боковые и торцевые линии ${LAW.line} см`,
    centre: "центральная линия 3 мм (для парной игры)",
    posts: `стойки сетки: ${cm(LAW.post)} см за край`,
    span: `между стойками ${cm(NET_SPAN)} см`,
    height: `высота ${LAW.h} см`,
    net: `сетка ${cm(LAW.net)} см`,
    floor: "пол",
    bounce: "отскок ≈ 23 см с высоты 30 см",
    surface: "поверхность тёмная и матовая",
  },
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const W = 1200;
const H = 740;

/** Розмірна лінія з засічками й підписом. */
function dimLine(x1, y1, x2, y2, label, { dx = 0, dy = -10, anchor = "middle", color = ACCENT } = {}) {
  const tick = 7;
  const vertical = x1 === x2;
  const t1 = vertical
    ? `<line x1="${x1 - tick}" y1="${y1}" x2="${x1 + tick}" y2="${y1}" stroke="${color}" stroke-width="2"/>`
    : `<line x1="${x1}" y1="${y1 - tick}" x2="${x1}" y2="${y1 + tick}" stroke="${color}" stroke-width="2"/>`;
  const t2 = vertical
    ? `<line x1="${x2 - tick}" y1="${y2}" x2="${x2 + tick}" y2="${y2}" stroke="${color}" stroke-width="2"/>`
    : `<line x1="${x2}" y1="${y2 - tick}" x2="${x2}" y2="${y2 + tick}" stroke="${color}" stroke-width="2"/>`;
  const tx = (x1 + x2) / 2 + dx;
  const ty = (y1 + y2) / 2 + dy;
  return [
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2"/>`,
    t1,
    t2,
    `<text x="${tx}" y="${ty}" fill="${color}" font-size="15" font-weight="700" text-anchor="${anchor}">${esc(label)}</text>`,
  ].join("");
}

function svg(lang) {
  const t = T[lang];
  const b = [];
  b.push(`<rect width="${W}" height="${H}" fill="${BG}"/>`);
  b.push(`<text x="60" y="64" fill="${TEXT}" font-size="30" font-weight="700" letter-spacing="1">${esc(t.title)}</text>`);
  b.push(`<line x1="60" y1="84" x2="1140" y2="84" stroke="${GRID}"/>`);

  // ── Вигляд зверху ──
  const k = 2.1; // px на см
  const tx = 120;
  const ty = 180;
  const tw = LAW.l * k;
  const th = LAW.w * k;
  b.push(`<text x="${tx}" y="${ty - 62}" fill="${MUTED}" font-size="14">${esc(t.top)}</text>`);
  // стільниця
  b.push(`<rect x="${tx}" y="${ty}" width="${tw}" height="${th}" fill="${TABLE_TOP}" stroke="${TEXT}" stroke-opacity="0.85" stroke-width="2"/>`);
  // білі лінії по краю (2 см у масштабі ≈ 5 px)
  const lw = LAW.line * k;
  b.push(`<rect x="${tx + lw / 2}" y="${ty + lw / 2}" width="${tw - lw}" height="${th - lw}" fill="none" stroke="#FFFFFF" stroke-width="${lw}"/>`);
  // центральна лінія (3 мм — тонка)
  b.push(`<line x1="${tx}" y1="${ty + th / 2}" x2="${tx + tw}" y2="${ty + th / 2}" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width="1.2"/>`);
  // сітка зі стійками (за край на 15,25 см)
  const nx = tx + tw / 2;
  const post = LAW.post * k;
  b.push(`<line x1="${nx}" y1="${ty - post}" x2="${nx}" y2="${ty + th + post}" stroke="${TEXT}" stroke-width="4"/>`);
  for (const py of [ty - post, ty + th + post]) b.push(`<circle cx="${nx}" cy="${py}" r="5" fill="${TEXT}"/>`);

  // розміри
  b.push(dimLine(tx, ty + th + 64, tx + tw, ty + th + 64, t.length, { dy: 26 }));
  b.push(dimLine(tx - 34, ty, tx - 34, ty + th, "", {}));
  b.push(`<text x="${tx - 46}" y="${ty + th / 2}" fill="${ACCENT}" font-size="15" font-weight="700" text-anchor="middle" transform="rotate(-90 ${tx - 46} ${ty + th / 2})">${esc(t.width)}</text>`);
  b.push(dimLine(tx, ty - 34, nx, ty - 34, t.half, { color: MUTED }));
  // між стійками — справа від сітки
  b.push(dimLine(nx + 26, ty - post, nx + 26, ty + th + post, "", { color: MUTED }));
  b.push(`<text x="${nx + 38}" y="${ty - post + 14}" fill="${MUTED}" font-size="13">${esc(t.span)}</text>`);

  // ── Вигляд збоку ──
  const sx = 860;
  const sk = 2.2;
  const floor = 480;
  const sw = 230; // умовна довжина (обрізано), висоту даємо в масштабі
  const top = floor - LAW.h * sk;
  b.push(`<text x="${sx}" y="${top - 70}" fill="${MUTED}" font-size="14">${esc(t.side)}</text>`);
  b.push(`<line x1="${sx - 10}" y1="${floor}" x2="${sx + sw + 10}" y2="${floor}" stroke="${DIM}" stroke-width="2"/>`);
  b.push(`<text x="${sx + sw + 10}" y="${floor + 20}" fill="${MUTED}" font-size="12" text-anchor="end">${esc(t.floor)}</text>`);
  b.push(`<rect x="${sx}" y="${top}" width="${sw}" height="7" fill="${TABLE_TOP}" stroke="${TEXT}" stroke-opacity="0.7"/>`);
  for (const lx of [sx + 20, sx + sw - 20]) b.push(`<line x1="${lx}" y1="${top + 7}" x2="${lx}" y2="${floor}" stroke="${DIM}" stroke-width="5"/>`);
  const snx = sx + sw / 2;
  const netTop = top - LAW.net * sk;
  b.push(`<line x1="${snx}" y1="${top}" x2="${snx}" y2="${netTop}" stroke="${TEXT}" stroke-width="3"/>`);
  b.push(dimLine(sx - 22, top, sx - 22, floor, "", {}));
  b.push(`<text x="${sx - 34}" y="${(top + floor) / 2}" fill="${ACCENT}" font-size="15" font-weight="700" text-anchor="middle" transform="rotate(-90 ${sx - 34} ${(top + floor) / 2})">${esc(t.height)}</text>`);
  b.push(dimLine(snx + 18, netTop, snx + 18, top, "", { color: ACCENT }));
  b.push(`<text x="${snx + 28}" y="${(netTop + top) / 2 + 5}" fill="${ACCENT}" font-size="14" font-weight="700">${esc(t.net)}</text>`);

  // ── Легенда ──
  const ly = 625;
  const notes = [t.lines, t.centre, t.posts, t.bounce, t.surface];
  notes.forEach((n, i) => {
    const col = i < 3 ? 0 : 1;
    const row = i < 3 ? i : i - 3;
    const x = 120 + col * 480;
    const y = ly + row * 30;
    b.push(`<circle cx="${x}" cy="${y - 5}" r="4" fill="${ACCENT}"/>`);
    b.push(`<text x="${x + 14}" y="${y}" fill="${TEXT}" font-size="15" opacity="0.9">${esc(n)}</text>`);
  });

  b.push(`<text x="1140" y="${H - 24}" fill="${DIM}" font-size="13" text-anchor="end">ttmax.com.ua</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT}">\n${b.join("\n")}\n</svg>\n`;
}

for (const lang of ["ua", "ru"]) {
  const out = svg(lang);
  writeFileSync(join(OUT, `rozmiry-skhema-${lang}.svg`), out);
  console.log(`  rozmiry-skhema-${lang}.svg ${(out.length / 1024).toFixed(1)} kb`);
}
