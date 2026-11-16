// Схема «коли бити й як тримати ракетку» для статті udary-v-nastilnomu-tenisi
// → public/blog/udary-faza-i-kut-{ua,ru}.svg
//
// Шість панелей (вигляд збоку, гравець праворуч, бʼє ліворуч у бік суперника): траєкторія
// відскоку від столу, точка контакту на ній (фаза відскоку), положення ракетки в контакті
// (відкрита / вертикальна / закрита) і напрямок руху ракетки.
//
// ⚠️ ЯКІСНА СХЕМА, НЕ КРЕСЛЕННЯ: кути нахилу ракетки, довжини стрілок і висота відскоку тут
// умовні (підібрані для наочності) — жодне з цих чисел не є рекомендацією, у статті їх немає.
// Фази контакту й характер руху — з джерел (звірено 2026-11-16):
//  • накат: вершина відскоку, ракетка трохи закрита, рух уперед і трохи вгору — Table Tennis
//    England, P. Stimpson «Developing Forehand Strokes» (27.04.2011); All About Table Tennis «4 Basic Strokes»;
//  • топспін проти блоку: на вершині або трохи до неї, щітка по верху мʼяча, ракетка не нижче мʼяча — TTE (там само);
//  • топспін проти нижнього: на вершині або трохи після, ракетка закрита менше, щітка по задній
//    частині мʼяча вгору — TTE (там само);
//  • блок: до вершини, ракетка закрита, короткий рух — TTE (там само); «ракетку нижче» — Butterfly,
//    L. Hodges «That One Good Block» (02.09.2025);
//  • підрізка: вершина відскоку, короткий рух від ліктя, удар по нижній задній частині мʼяча —
//    All About Table Tennis «4 Basic Strokes»;
//  • чоп: дати мʼячу впасти до рівня столу або нижче, контакт по задній частині мʼяча, рух
//    переважно вниз — TableTennisCoaching.com «Backhand Chopping in an Emergency» (02.11.2020).
// Якщо текст статті (розділ faza-i-kut) зміниться — правити тут разом.
//
// Запуск: node scripts/gen-udary-diagram.mjs [вихідна_тека]   (без аргументу → public/blog)
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), "..", "public", "blog");
mkdirSync(OUT, { recursive: true });

// Палітра — спільна для схем блогу (як у gen-serve-diagram.mjs / gen-care-diagram.mjs).
const BG = "#0E1117";
const GRID = "#212832";
const DIM = "#39424E";
const MUTED = "#8A93A0";
const TEXT = "#F2F4F7";
const ACCENT = "#E8FF47";
const TABLE_TOP = "#1F4F8F";
const FONT = "Oswald,'Arial Narrow',Arial,sans-serif";

// phase: частка шляху від відскоку (0) до «рівня столу» на спаданні (1); 0,5 — вершина.
// tilt: нахил ракетки від вертикалі, ° (+ закрита — верх до суперника, − відкрита). Умовно.
// dir: напрямок руху ракетки (x ліворуч = до суперника, y вниз). Умовно.
// len: довжина стрілки руху (короткий рух на блоці й підрізці).
const STROKES = [
  { key: "nakat", phase: 0.5, tilt: 22, dir: [-1, -0.35], len: 1 },
  { key: "topTop", phase: 0.44, tilt: 42, dir: [-1, -0.6], len: 1.1 },
  { key: "topBack", phase: 0.58, tilt: 6, dir: [-0.45, -1], len: 1.15 },
  { key: "block", phase: 0.36, tilt: 35, dir: [-1, -0.18], len: 0.55 },
  { key: "push", phase: 0.5, tilt: -45, dir: [-1, 0.05], len: 0.6 },
  { key: "chop", phase: 1.08, tilt: -20, dir: [-0.5, 0.86], len: 1.1 },
];

const T = {
  ua: {
    title: "КОЛИ БИТИ Й ЯК ТРИМАТИ РАКЕТКУ",
    sub: "Вигляд збоку: суперник ліворуч, ви праворуч. Кути й довжини стрілок — умовні.",
    legendBall: "контакт",
    legendPath: "відскок мʼяча",
    legendMove: "рух ракетки",
    s: {
      nakat: ["НАКАТ", "Фаза: вершина відскоку", "Ракетка: трохи закрита", "Рух: уперед і трохи вгору"],
      topTop: ["ТОПСПІН ПРОТИ ВЕРХНЬОГО", "Фаза: вершина або трохи до", "Ракетка: закрита", "Рух: уперед-угору по верху мʼяча"],
      topBack: ["ТОПСПІН ПРОТИ НИЖНЬОГО", "Фаза: вершина або трохи після", "Ракетка: закрита менше", "Рух: переважно вгору"],
      block: ["БЛОК", "Фаза: до вершини, на підйомі", "Ракетка: закрита, нижче", "Рух: короткий, уперед"],
      push: ["ПІДРІЗКА", "Фаза: вершина відскоку", "Ракетка: відкрита", "Рух: від ліктя вперед під мʼяч"],
      chop: ["ЧОП (ЗАХИСНА ПІДРІЗКА)", "Фаза: рівень столу й нижче", "Ракетка: відкрита помірно", "Рух: зверху вниз і вперед"],
    },
  },
  ru: {
    title: "КОГДА БИТЬ И КАК ДЕРЖАТЬ РАКЕТКУ",
    sub: "Вид сбоку: соперник слева, вы справа. Углы и длины стрелок — условные.",
    legendBall: "контакт",
    legendPath: "отскок мяча",
    legendMove: "движение ракетки",
    s: {
      nakat: ["НАКАТ", "Фаза: вершина отскока", "Ракетка: слегка закрыта", "Движение: вперёд и чуть вверх"],
      topTop: ["ТОПСПИН ПРОТИВ ВЕРХНЕГО", "Фаза: вершина или чуть раньше", "Ракетка: закрыта", "Движение: вперёд-вверх по мячу"],
      topBack: ["ТОПСПИН ПРОТИВ НИЖНЕГО", "Фаза: вершина или чуть позже", "Ракетка: закрыта меньше", "Движение: в основном вверх"],
      block: ["БЛОК", "Фаза: до вершины, на подъёме", "Ракетка: закрыта, ниже", "Движение: короткое, вперёд"],
      push: ["ПОДРЕЗКА", "Фаза: вершина отскока", "Ракетка: открыта", "Движение: от локтя вперёд под мяч"],
      chop: ["ЧОП (ЗАЩИТНАЯ ПОДРЕЗКА)", "Фаза: уровень стола и ниже", "Ракетка: умеренно открыта", "Движение: сверху вниз и вперёд"],
    },
  },
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const f = (n) => Math.round(n * 10) / 10;

const W = 1000;
const COLS = 2;
const PW = 480; // ширина панелі
const PH = 400; // висота панелі
const TOP = 150; // відступ під заголовок і легенду
const H = TOP + PH * 3 + 50;

function panel(px, py, s, lines) {
  const b = [];
  b.push(`<rect x="${px}" y="${py}" width="${PW - 20}" height="${PH - 20}" rx="10" fill="none" stroke="${GRID}"/>`);
  b.push(`<text x="${px + 20}" y="${py + 40}" fill="${TEXT}" font-size="25" font-weight="700" letter-spacing="0.5">${esc(lines[0])}</text>`);

  // стіл: від px+20 до кінцевої лінії px+200 (ліва частина — половина гравця, суперник за кадром ліворуч)
  const tableY = py + 215;
  const endX = px + 215;
  b.push(`<rect x="${px + 20}" y="${tableY}" width="${endX - px - 20}" height="7" fill="${TABLE_TOP}" stroke="${TEXT}" stroke-opacity="0.6"/>`);
  b.push(`<line x1="${endX - 18}" y1="${tableY + 7}" x2="${endX - 18}" y2="${py + 265}" stroke="${DIM}" stroke-width="4"/>`);

  // відскок: мʼяч прилітає зліва, відскакує в Bx, вершина в Px, на рівень столу повертається в 2Px−Bx
  const Bx = px + 95;
  const Px = px + 230;
  const Hh = 105;
  const yAt = (x) => tableY - Hh * (1 - ((x - Px) / (Px - Bx)) ** 2);
  const xAt = (phase) => Bx + phase * 2 * (Px - Bx);
  const pts = [];
  for (let x = Bx; x <= xAt(1.18); x += 6) pts.push(`${f(x)} ${f(yAt(x))}`);
  b.push(`<path d="M${px + 30} ${tableY - 70} Q ${px + 70} ${tableY - 20} ${Bx} ${tableY}" fill="none" stroke="${MUTED}" stroke-width="2" stroke-dasharray="5 6"/>`);
  b.push(`<path d="M${pts.join(" L")}" fill="none" stroke="${MUTED}" stroke-width="2" stroke-dasharray="5 6"/>`);
  b.push(`<circle cx="${Bx}" cy="${tableY}" r="3.5" fill="${MUTED}"/>`);

  // контакт
  const cx = xAt(s.phase);
  const cy = yAt(cx);
  // рух ракетки: стрілка через точку контакту
  const [dx, dy] = s.dir;
  const n = Math.hypot(dx, dy);
  const ux = dx / n;
  const uy = dy / n;
  const L = 80 * s.len;
  const rx = cx + 19; // центр ракетки — за мʼячем, з боку гравця
  const sx = rx - ux * L * 0.75;
  const sy = cy - uy * L * 0.75;
  const ex = rx + ux * L * 0.75;
  const ey = cy + uy * L * 0.75;
  const arrow = [];
  arrow.push(`<line x1="${f(sx)}" y1="${f(sy)}" x2="${f(ex)}" y2="${f(ey)}" stroke="${ACCENT}" stroke-width="3" stroke-opacity="0.9"/>`);
  const ah = 13;
  const ang = Math.atan2(uy, ux);
  const a1x = ex - ah * Math.cos(ang - 0.45);
  const a1y = ey - ah * Math.sin(ang - 0.45);
  const a2x = ex - ah * Math.cos(ang + 0.45);
  const a2y = ey - ah * Math.sin(ang + 0.45);
  arrow.push(`<path d="M${f(a1x)} ${f(a1y)} L${f(ex)} ${f(ey)} L${f(a2x)} ${f(a2y)}" fill="none" stroke="${ACCENT}" stroke-width="3" stroke-linejoin="round"/>`);

  // ракетка: відрізок за мʼячем (з боку гравця), нахил tilt від вертикалі
  const t = (s.tilt * Math.PI) / 180;
  const half = 30;
  const topX = rx - half * Math.sin(t);
  const topY = cy - half * Math.cos(t);
  const botX = rx + half * Math.sin(t);
  const botY = cy + half * Math.cos(t);
  b.push(`<line x1="${f(topX)}" y1="${f(topY)}" x2="${f(botX)}" y2="${f(botY)}" stroke="${TEXT}" stroke-width="9" stroke-linecap="round"/>`);
  // ручка — продовження вниз від нижнього краю ракетки
  const hx = botX + 16 * Math.sin(t);
  const hy = botY + 16 * Math.cos(t);
  b.push(`<line x1="${f(botX)}" y1="${f(botY)}" x2="${f(hx)}" y2="${f(hy)}" stroke="${MUTED}" stroke-width="6" stroke-linecap="round"/>`);
  b.push(...arrow); // стрілка руху — поверх ракетки, мʼяч — поверх усього
  b.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="9" fill="${ACCENT}"/>`);

  // підписи
  let ly = py + 300;
  for (const line of lines.slice(1)) {
    const [k, ...rest] = line.split(": ");
    b.push(`<text x="${px + 20}" y="${ly}" font-size="20"><tspan fill="${MUTED}">${esc(k)}:</tspan><tspan fill="${TEXT}" dx="7">${esc(rest.join(": "))}</tspan></text>`);
    ly += 28;
  }
  return b.join("\n");
}

function svg(lang) {
  const t = T[lang];
  const b = [];
  b.push(`<rect width="${W}" height="${H}" fill="${BG}"/>`);
  b.push(`<text x="40" y="58" fill="${TEXT}" font-size="34" font-weight="700" letter-spacing="1">${esc(t.title)}</text>`);
  b.push(`<text x="40" y="92" fill="${MUTED}" font-size="19">${esc(t.sub)}</text>`);
  // легенда
  const ly = 124;
  b.push(`<circle cx="50" cy="${ly - 6}" r="8" fill="${ACCENT}"/>`);
  b.push(`<text x="66" y="${ly}" fill="${TEXT}" font-size="18">${esc(t.legendBall)}</text>`);
  b.push(`<line x1="170" y1="${ly - 6}" x2="214" y2="${ly - 6}" stroke="${MUTED}" stroke-width="2" stroke-dasharray="5 6"/>`);
  b.push(`<text x="224" y="${ly}" fill="${TEXT}" font-size="18">${esc(t.legendPath)}</text>`);
  b.push(`<line x1="380" y1="${ly - 6}" x2="420" y2="${ly - 6}" stroke="${ACCENT}" stroke-width="3"/>`);
  b.push(`<path d="M410 ${ly - 13} L420 ${ly - 6} L410 ${ly + 1}" fill="none" stroke="${ACCENT}" stroke-width="3"/>`);
  b.push(`<text x="432" y="${ly}" fill="${TEXT}" font-size="18">${esc(t.legendMove)}</text>`);

  STROKES.forEach((s, i) => {
    const px = 30 + (i % COLS) * PW;
    const py = TOP + Math.floor(i / COLS) * PH;
    b.push(panel(px, py, s, t.s[s.key]));
  });

  b.push(`<text x="${W - 40}" y="${H - 20}" fill="${DIM}" font-size="15" text-anchor="end">ttmax.com.ua</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT}">\n${b.join("\n")}\n</svg>\n`;
}

for (const lang of ["ua", "ru"]) {
  const out = svg(lang);
  writeFileSync(join(OUT, `udary-faza-i-kut-${lang}.svg`), out);
  console.log(`  udary-faza-i-kut-${lang}.svg ${(out.length / 1024).toFixed(1)} kb`);
}
