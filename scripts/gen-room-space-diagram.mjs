// Схема «скільки місця навколо столу» для статті mistse-dlya-tenisnogo-stolu
// → public/blog/mistse-skhema-{ua,ru}.svg
//
// План кімнати ЗВЕРХУ В МАСШТАБІ: три зони навколо столу й сам стіл. Масштаб чесний
// (одна клітинка сітки = 0,5 м), тож читач бачить реальне співвідношення запасу й столу,
// а не «художнє» — у цьому й сенс схеми.
//
// ⚠️ ЧИСЛА ЖИВУТЬ ТУТ І В ТАБЛИЦІ СТАТТІ (blog.ts, розділ korotko). Змінюєш зону тут —
// зміни й таблицю, FAQ і TableSpaceQuiz. Запас за торцем/збоку не задається руками, а
// рахується з розміру зони: (зона − стіл) / 2 — так підписи не розійдуться з геометрією.
//
// Зона «8 × 4 м» — мінімум Table Tennis England для відпочинку, тренувань і коучингу
// (Playing Grades and Space Requirements, Grade 1). Дві менші — побутові орієнтири магазину.
//
// Запуск: node scripts/gen-room-space-diagram.mjs
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "blog");

// Палітра — та сама, що в gen-spin-speed-chart і gen-authenticity-diagram.
const BG = "#0E1117";
const GRID = "#212832";
const DIM = "#39424E";
const MUTED = "#8A93A0";
const TEXT = "#F2F4F7";
const ACCENT = "#E8FF47";
const FONT = "Oswald,'Arial Narrow',Arial,sans-serif";

const TABLE = { l: 2.74, w: 1.525 };
const ZONES = [
  { key: "train", l: 8, w: 4, stroke: MUTED, dash: "10 8", op: 0.7 },
  { key: "comfort", l: 5.5, w: 3, stroke: ACCENT, dash: "", op: 1 },
  { key: "min", l: 4.5, w: 2.5, stroke: MUTED, dash: "4 6", op: 0.9 },
];

const T = {
  ua: {
    title: "СКІЛЬКИ МІСЦЯ НАВКОЛО СТОЛУ",
    scale: "Вигляд зверху, в масштабі: одна клітинка = 0,5 м",
    table: "стіл 2,74 × 1,525 м",
    zones: {
      train: ["8 × 4 м", "тренування й відпочинок", "мінімум Table Tennis England"],
      comfort: ["5,5 × 3 м", "комфортно вдома", ""],
      min: ["4,5 × 2,5 м", "мінімум: гра біля столу", ""],
    },
    end: "за торцем",
    side: "збоку",
    tableNote: ["2,74 × 1,525 м", "стіл за стандартом ITTF", "висота 76 см"],
  },
  ru: {
    title: "СКОЛЬКО МЕСТА ВОКРУГ СТОЛА",
    scale: "Вид сверху, в масштабе: одна клетка = 0,5 м",
    table: "стол 2,74 × 1,525 м",
    zones: {
      train: ["8 × 4 м", "тренировки и отдых", "минимум Table Tennis England"],
      comfort: ["5,5 × 3 м", "комфортно дома", ""],
      min: ["4,5 × 2,5 м", "минимум: игра у стола", ""],
    },
    end: "за торцом",
    side: "сбоку",
    tableNote: ["2,74 × 1,525 м", "стол по стандарту ITTF", "высота 76 см"],
  },
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** 1,38 → «1,4» (як у тексті статті: округлення до 0,1 м, кома). */
const m = (v) => (Math.round(v * 10) / 10).toFixed(1).replace(".", ",");

const W = 1200;
const H = 640;
const K = 95; // px на метр
const CX = 440;
const CY = 340;

function svg(lang) {
  const t = T[lang];
  const b = [];
  b.push(`<rect width="${W}" height="${H}" fill="${BG}"/>`);
  b.push(`<text x="60" y="64" fill="${TEXT}" font-size="30" font-weight="700" letter-spacing="1">${esc(t.title)}</text>`);
  b.push(`<line x1="60" y1="84" x2="1140" y2="84" stroke="${GRID}"/>`);

  // Сітка 0,5 м у межах найбільшої зони.
  const big = ZONES[0];
  const bx0 = CX - (big.l * K) / 2;
  const by0 = CY - (big.w * K) / 2;
  for (let i = 0; i <= big.l / 0.5; i++) {
    const x = bx0 + i * 0.5 * K;
    b.push(`<line x1="${x}" y1="${by0}" x2="${x}" y2="${by0 + big.w * K}" stroke="${GRID}" stroke-width="1"/>`);
  }
  for (let j = 0; j <= big.w / 0.5; j++) {
    const y = by0 + j * 0.5 * K;
    b.push(`<line x1="${bx0}" y1="${y}" x2="${bx0 + big.l * K}" y2="${y}" stroke="${GRID}" stroke-width="1"/>`);
  }

  // Зони — від більшої до меншої; підпис у лівому верхньому куті кожної.
  for (const z of ZONES) {
    const w = z.l * K;
    const h = z.w * K;
    const x = CX - w / 2;
    const y = CY - h / 2;
    b.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${z.stroke}" stroke-opacity="${z.op}" stroke-width="${z.key === "comfort" ? 3 : 2}"${z.dash ? ` stroke-dasharray="${z.dash}"` : ""}/>`,
    );
    b.push(
      `<text x="${x + 10}" y="${y + 19}" fill="${z.key === "comfort" ? ACCENT : MUTED}" font-size="15" font-weight="700">${esc(t.zones[z.key][0])}</text>`,
    );
  }

  // Стіл із сіткою й центральною лінією.
  const tw = TABLE.l * K;
  const th = TABLE.w * K;
  const tx = CX - tw / 2;
  const ty = CY - th / 2;
  b.push(`<rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="3" fill="#1F4F8F" fill-opacity="0.55" stroke="${TEXT}" stroke-opacity="0.75" stroke-width="2"/>`);
  b.push(`<line x1="${tx}" y1="${CY}" x2="${tx + tw}" y2="${CY}" stroke="${TEXT}" stroke-opacity="0.45" stroke-width="1.2"/>`);
  b.push(`<line x1="${CX}" y1="${ty - 14}" x2="${CX}" y2="${ty + th + 14}" stroke="${TEXT}" stroke-opacity="0.9" stroke-width="3"/>`);
  b.push(`<text x="${CX}" y="${ty + th / 2 + 34}" fill="${TEXT}" font-size="14" text-anchor="middle" opacity="0.85">${esc(t.table)}</text>`);

  // Стрілки запасу для комфортної зони: торець і бік.
  const comfort = ZONES[1];
  const endGap = (comfort.l - TABLE.l) / 2;
  const sideGap = (comfort.w - TABLE.w) / 2;
  const ex0 = tx + tw;
  const ex1 = CX + (comfort.l * K) / 2;
  const ey = CY - 26;
  b.push(arrow(ex0 + 4, ey, ex1 - 4, ey));
  b.push(`<text x="${(ex0 + ex1) / 2}" y="${ey - 10}" fill="${ACCENT}" font-size="15" font-weight="700" text-anchor="middle">≈ ${m(endGap)} м</text>`);
  const sy0 = ty + th;
  const sy1 = CY + (comfort.w * K) / 2;
  const sx = CX + 70;
  b.push(arrow(sx, sy0 + 4, sx, sy1 - 4));
  b.push(`<text x="${sx + 12}" y="${(sy0 + sy1) / 2 + 5}" fill="${ACCENT}" font-size="15" font-weight="700">≈ ${m(sideGap)} м</text>`);

  b.push(`<text x="${bx0}" y="${by0 + big.w * K + 34}" fill="${MUTED}" font-size="14">${esc(t.scale)}</text>`);

  // Легенда праворуч: розмір зони + запас за торцем / збоку (порахований із геометрії).
  let ly = 150;
  const lx = 870;
  for (const z of ZONES) {
    const [size, label, note] = t.zones[z.key];
    const col = z.key === "comfort" ? ACCENT : MUTED;
    b.push(`<line x1="${lx}" y1="${ly - 6}" x2="${lx + 34}" y2="${ly - 6}" stroke="${z.stroke}" stroke-opacity="${z.op}" stroke-width="${z.key === "comfort" ? 3 : 2}"${z.dash ? ` stroke-dasharray="${z.dash}"` : ""}/>`);
    b.push(`<text x="${lx + 46}" y="${ly}" fill="${col === ACCENT ? ACCENT : TEXT}" font-size="20" font-weight="700">${esc(size)}</text>`);
    b.push(`<text x="${lx + 46}" y="${ly + 22}" fill="${MUTED}" font-size="14">${esc(label)}</text>`);
    let extra = 0;
    if (note) {
      b.push(`<text x="${lx + 46}" y="${ly + 40}" fill="${MUTED}" font-size="12" opacity="0.8">${esc(note)}</text>`);
      extra = 18;
    }
    b.push(
      `<text x="${lx + 46}" y="${ly + 42 + extra}" fill="${TEXT}" font-size="14" opacity="0.85">≈ ${m((z.l - TABLE.l) / 2)} м ${esc(t.end)} · ≈ ${m((z.w - TABLE.w) / 2)} м ${esc(t.side)}</text>`,
    );
    ly += 96 + extra;
  }
  b.push(`<rect x="${lx}" y="${ly - 20}" width="34" height="20" rx="2" fill="#1F4F8F" fill-opacity="0.55" stroke="${TEXT}" stroke-opacity="0.75"/>`);
  b.push(`<text x="${lx + 46}" y="${ly}" fill="${TEXT}" font-size="20" font-weight="700">${esc(t.tableNote[0])}</text>`);
  b.push(`<text x="${lx + 46}" y="${ly + 22}" fill="${MUTED}" font-size="14">${esc(t.tableNote[1])}</text>`);
  b.push(`<text x="${lx + 46}" y="${ly + 42}" fill="${TEXT}" font-size="14" opacity="0.85">${esc(t.tableNote[2])}</text>`);

  b.push(`<text x="1140" y="${H - 24}" fill="${DIM}" font-size="13" text-anchor="end">ttmax.com.ua</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT}">\n${b.join("\n")}\n</svg>\n`;
}

/** Двостороння стрілка. */
function arrow(x1, y1, x2, y2) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const head = (x, y, a) => {
    const s = 9;
    const p1 = [x - s * Math.cos(a - 0.45), y - s * Math.sin(a - 0.45)];
    const p2 = [x - s * Math.cos(a + 0.45), y - s * Math.sin(a + 0.45)];
    return `<path d="M${p1[0].toFixed(1)} ${p1[1].toFixed(1)} L${x} ${y} L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}" fill="none" stroke="${ACCENT}" stroke-width="2"/>`;
  };
  return [
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ACCENT}" stroke-width="2"/>`,
    head(x2, y2, ang),
    head(x1, y1, ang + Math.PI),
  ].join("");
}

for (const lang of ["ua", "ru"]) {
  const out = svg(lang);
  writeFileSync(join(OUT, `mistse-skhema-${lang}.svg`), out);
  console.log(`  mistse-skhema-${lang}.svg ${(out.length / 1024).toFixed(1)} kb`);
}
