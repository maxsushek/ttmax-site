// Схема «правильна подача» для статті podacha-v-nastilnomu-tenisi
// → public/blog/podacha-skhema-{ua,ru}.svg
//
// Вигляд збоку в одному масштабі по обох осях: стіл 2,74 м завдовжки й 0,76 м заввишки,
// сітка 15,25 см, підкидання від 16 см. Масштаб чесний, щоб 16 см виглядали саме як 16 см
// поруч зі столом, — читач одразу бачить, що це трохи вище за сітку, а не «на пів метра».
// Праворуч — вставка зверху для парної гри: з правої половини в праву по діагоналі.
//
// ⚠️ ЧИСЛА — ПРАВИЛА ITTF (Laws of Table Tennis, 2.1 і 2.6). Змінюються вони рідко, але
// якщо зміняться — правити тут і в blog.ts (розділ pravyla, FAQ) разом.
//
// Запуск: node scripts/gen-serve-diagram.mjs
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

const LAW = { tableL: 2.74, tableH: 0.76, net: 0.1525, toss: 0.16, tableW: 1.525 };

const T = {
  ua: {
    title: "ПРАВИЛЬНА ПОДАЧА ЗА ПРАВИЛАМИ ITTF",
    palm: ["відкрита нерухома", "долоня"],
    toss: ["підкидання майже вертикально,", "без обертання, від 16 см"],
    strike: ["удар — коли мʼяч", "уже падає"],
    zone: ["мʼяч вище рівня столу", "й за задньою лінією"],
    b1: "1-й відскок — своя половина",
    b2: "2-й — половина суперника",
    net: "сітка 15,25 см",
    scale: "Вигляд збоку, один масштаб по обох осях",
    dbl: "ПАРНА ГРА",
    dblNote: ["з правої половини подавача", "в праву половину приймаючого"],
    server: "подавач",
    receiver: "приймаючий",
  },
  ru: {
    title: "ПРАВИЛЬНАЯ ПОДАЧА ПО ПРАВИЛАМ ITTF",
    palm: ["открытая неподвижная", "ладонь"],
    toss: ["подброс почти вертикально,", "без вращения, от 16 см"],
    strike: ["удар — когда мяч", "уже падает"],
    zone: ["мяч выше уровня стола", "и за задней линией"],
    b1: "1-й отскок — своя половина",
    b2: "2-й — половина соперника",
    net: "сетка 15,25 см",
    scale: "Вид сбоку, один масштаб по обеим осям",
    dbl: "ПАРНАЯ ИГРА",
    dblNote: ["из правой половины подающего", "в правую половину принимающего"],
    server: "подающий",
    receiver: "принимающий",
  },
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const W = 1200;
const H = 640;

function svg(lang) {
  const t = T[lang];
  const b = [];
  b.push(`<rect width="${W}" height="${H}" fill="${BG}"/>`);
  b.push(`<text x="60" y="64" fill="${TEXT}" font-size="30" font-weight="700" letter-spacing="1">${esc(t.title)}</text>`);
  b.push(`<line x1="60" y1="84" x2="1140" y2="84" stroke="${GRID}"/>`);

  // ── Вигляд збоку ──
  const k = 215; // px на метр, однаково по X і Y
  const floor = 560;
  const x0 = 330; // задня лінія подавача
  const x1 = x0 + LAW.tableL * k; // задня лінія суперника
  const top = floor - LAW.tableH * k;
  const netX = (x0 + x1) / 2;
  const netTop = top - LAW.net * k;

  b.push(`<line x1="60" y1="${floor}" x2="${x1 + 60}" y2="${floor}" stroke="${DIM}" stroke-width="2"/>`);
  // зона «вище столу й за задньою лінією»
  b.push(`<rect x="70" y="150" width="${x0 - 70}" height="${top - 150}" fill="${ACCENT}" fill-opacity="0.06" stroke="${ACCENT}" stroke-opacity="0.35" stroke-dasharray="6 6"/>`);
  b.push(`<text x="82" y="172" fill="${ACCENT}" font-size="13" opacity="0.9">${esc(t.zone[0])}</text>`);
  b.push(`<text x="82" y="189" fill="${ACCENT}" font-size="13" opacity="0.9">${esc(t.zone[1])}</text>`);
  // стіл
  b.push(`<rect x="${x0}" y="${top}" width="${x1 - x0}" height="8" fill="${TABLE_TOP}" stroke="${TEXT}" stroke-opacity="0.7"/>`);
  for (const lx of [x0 + 30, x1 - 30]) {
    b.push(`<line x1="${lx}" y1="${top + 8}" x2="${lx}" y2="${floor}" stroke="${DIM}" stroke-width="5"/>`);
  }
  b.push(`<line x1="${netX}" y1="${top}" x2="${netX}" y2="${netTop}" stroke="${TEXT}" stroke-width="3"/>`);
  b.push(`<text x="${netX}" y="${top + 60}" fill="${MUTED}" font-size="13" text-anchor="middle">${esc(t.net)}</text>`);

  // долоня й підкидання
  const palmX = 200;
  const palmY = top - 0.2 * k; // долоня трохи вище рівня столу
  b.push(`<path d="M${palmX - 30} ${palmY + 6} Q ${palmX} ${palmY + 16} ${palmX + 30} ${palmY + 6}" fill="none" stroke="${TEXT}" stroke-width="4" stroke-linecap="round"/>`);
  const ballR = 7;
  const tossTop = palmY - LAW.toss * k - 26; // підкидання трохи вище мінімуму
  b.push(`<line x1="${palmX}" y1="${palmY - ballR}" x2="${palmX}" y2="${tossTop + ballR}" stroke="${ACCENT}" stroke-width="2" stroke-dasharray="4 5"/>`);
  b.push(`<circle cx="${palmX}" cy="${palmY - ballR}" r="${ballR}" fill="${TEXT}" fill-opacity="0.35"/>`);
  b.push(`<circle cx="${palmX}" cy="${tossTop}" r="${ballR}" fill="${TEXT}"/>`);
  // мірка 16 см
  const m16 = palmY - LAW.toss * k;
  b.push(`<line x1="${palmX - 44}" y1="${palmY}" x2="${palmX - 44}" y2="${m16}" stroke="${ACCENT}" stroke-width="2"/>`);
  b.push(`<line x1="${palmX - 50}" y1="${palmY}" x2="${palmX - 38}" y2="${palmY}" stroke="${ACCENT}" stroke-width="2"/>`);
  b.push(`<line x1="${palmX - 50}" y1="${m16}" x2="${palmX - 38}" y2="${m16}" stroke="${ACCENT}" stroke-width="2"/>`);
  b.push(`<text x="${palmX - 50}" y="${m16 - 8}" fill="${ACCENT}" font-size="14" font-weight="700" text-anchor="end">16 см</text>`);
  b.push(`<text x="${palmX - 30}" y="${palmY + 30}" fill="${MUTED}" font-size="13">${esc(t.palm[0])}</text>`);
  b.push(`<text x="${palmX - 30}" y="${palmY + 45}" fill="${MUTED}" font-size="13">${esc(t.palm[1])}</text>`);
  b.push(`<text x="${palmX + 20}" y="${tossTop - 26}" fill="${TEXT}" font-size="14">${esc(t.toss[0])}</text>`);
  b.push(`<text x="${palmX + 20}" y="${tossTop - 9}" fill="${TEXT}" font-size="14">${esc(t.toss[1])}</text>`);

  // удар і траєкторія: своя половина → над сіткою → половина суперника
  const hitX = palmX + 24;
  const hitY = palmY - 0.06 * k;
  const b1x = x0 + 0.55 * k;
  const b2x = x1 - 0.5 * k;
  b.push(`<circle cx="${hitX}" cy="${hitY}" r="${ballR}" fill="${ACCENT}"/>`);
  b.push(`<text x="${hitX + 14}" y="${hitY - 22}" fill="${ACCENT}" font-size="13">${esc(t.strike[0])}</text>`);
  b.push(`<text x="${hitX + 14}" y="${hitY - 7}" fill="${ACCENT}" font-size="13">${esc(t.strike[1])}</text>`);
  b.push(
    `<path d="M${hitX} ${hitY} Q ${(hitX + b1x) / 2} ${top - 40} ${b1x} ${top} Q ${netX} ${netTop - 70} ${b2x} ${top} Q ${b2x + 40} ${top - 40} ${b2x + 70} ${top - 20}" fill="none" stroke="${ACCENT}" stroke-width="2.5"/>`,
  );
  for (const [bx, label] of [[b1x, t.b1], [b2x, t.b2]]) {
    b.push(`<circle cx="${bx}" cy="${top}" r="5" fill="${ACCENT}"/>`);
    b.push(`<text x="${bx}" y="${top + 34}" fill="${TEXT}" font-size="14" text-anchor="middle">${esc(label)}</text>`);
  }
  b.push(`<text x="${x0}" y="${floor + 34}" fill="${MUTED}" font-size="13">${esc(t.scale)}</text>`);

  // ── Вставка: парна гра, вигляд зверху ──
  const k2 = 85;
  const ix = 905;
  const iy = 150;
  const iw = LAW.tableL * k2; // довжина — по горизонталі
  const ih = LAW.tableW * k2;
  b.push(`<text x="${ix}" y="${iy - 26}" fill="${TEXT}" font-size="18" font-weight="700">${esc(t.dbl)}</text>`);
  b.push(`<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="${TABLE_TOP}" fill-opacity="0.55" stroke="${TEXT}" stroke-opacity="0.75"/>`);
  b.push(`<line x1="${ix}" y1="${iy + ih / 2}" x2="${ix + iw}" y2="${iy + ih / 2}" stroke="${TEXT}" stroke-opacity="0.6" stroke-width="1.5"/>`);
  b.push(`<line x1="${ix + iw / 2}" y1="${iy - 10}" x2="${ix + iw / 2}" y2="${iy + ih + 10}" stroke="${TEXT}" stroke-width="3"/>`);
  // Права половина подавача — НИЖНЯ (подавач ліворуч дивиться на стіл, права рука — знизу на плані);
  // права половина приймаючого — ВЕРХНЯ.
  b.push(`<rect x="${ix}" y="${iy + ih / 2}" width="${iw / 2}" height="${ih / 2}" fill="${ACCENT}" fill-opacity="0.18"/>`);
  b.push(`<rect x="${ix + iw / 2}" y="${iy}" width="${iw / 2}" height="${ih / 2}" fill="${ACCENT}" fill-opacity="0.18"/>`);
  const ax0 = ix + iw * 0.2;
  const ay0 = iy + ih * 0.75;
  const ax1 = ix + iw * 0.8;
  const ay1 = iy + ih * 0.25;
  b.push(`<line x1="${ax0}" y1="${ay0}" x2="${ax1 - 8}" y2="${ay1 + 4}" stroke="${ACCENT}" stroke-width="2.5"/>`);
  b.push(`<path d="M${ax1 - 20} ${ay1 + 1} L${ax1} ${ay1} L${ax1 - 13} ${ay1 + 15}" fill="none" stroke="${ACCENT}" stroke-width="2.5"/>`);
  b.push(`<text x="${ix - 6}" y="${iy + ih + 22}" fill="${MUTED}" font-size="13">${esc(t.server)}</text>`);
  b.push(`<text x="${ix + iw + 6}" y="${iy - 8}" fill="${MUTED}" font-size="13" text-anchor="end">${esc(t.receiver)}</text>`);
  b.push(`<text x="${ix}" y="${iy + ih + 52}" fill="${TEXT}" font-size="14">${esc(t.dblNote[0])}</text>`);
  b.push(`<text x="${ix}" y="${iy + ih + 70}" fill="${TEXT}" font-size="14">${esc(t.dblNote[1])}</text>`);

  b.push(`<text x="1140" y="${H - 24}" fill="${DIM}" font-size="13" text-anchor="end">ttmax.com.ua</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT}">\n${b.join("\n")}\n</svg>\n`;
}

for (const lang of ["ua", "ru"]) {
  const out = svg(lang);
  writeFileSync(join(OUT, `podacha-skhema-${lang}.svg`), out);
  console.log(`  podacha-skhema-${lang}.svg ${(out.length / 1024).toFixed(1)} kb`);
}
