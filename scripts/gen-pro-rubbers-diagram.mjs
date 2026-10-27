// Схема «накладки профі Butterfly: форхенд і бекхенд» для статті inventar-profi-butterfly
// → public/blog/profi-nakladky-{ua,ru}.svg
//
// Дані — блок «使用用具» (інвентар) на сторінках гравців butterfly.co.jp/players/detail/<slug>.html,
// звірено 27.10.2026; дата «станом на» — як на сторінці. Порядок на сторінці: основа → форхенд → бекхенд
// (підтверджено «Pro-Line» ракеткою Лінь Юньжу в shop.butterflyonline.com: Zyre 03 FH + Dignics 05 BH).
// Фань Чженьдун і Лінь Шидун: Butterfly вказує лише одну накладку — у підрахунок FH/BH не йдуть.
// Ті самі дані — у таблицях статті в blog.ts: міняєш тут — міняй і там.
//
// Запуск: node scripts/gen-pro-rubbers-diagram.mjs
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "blog");

// [гравець, форхенд, бекхенд] — чинні гравці Advisory Staff Butterfly з обома накладками на сторінці.
export const PLAYERS = [
  ["harimoto-tomokazu", "Zyre 03", "Zyre 03"],
  ["harimoto-miwa", "Dignics 09C", "Dignics 05"],
  ["matsushima-sora", "Dignics 09C", "Zyre 03"],
  ["togami-shunsuke", "Dignics 09C", "Zyre 03"],
  ["shinozuka-hiroto", "Dignics 09C", "Zyre 03"],
  ["lin-yunju", "Zyre 03", "Dignics 05"],
  ["cheng-i-ching", "Zyre 03", "Zyre 03"],
  ["zhu-yuling", "Tenergy 05 Hard", "Dignics 09C"],
  ["lim-jonghoon", "Tenergy 05 Hard", "Dignics 09C"],
  ["wong-chun-ting", "Dignics 09C", "Tenergy 05 Hard"],
  ["ovtcharov-dimitrij", "Dignics 09C", "Zyre 03"],
  ["franziska-patrick", "Zyre 03", "Dignics 09C"],
  ["qiu-dang", "Dignics 09C", "Dignics 09C"],
  ["kallberg-anton", "Dignics 09C", "Dignics 09C"],
  ["freitas-marcos", "Dignics 09C", "Dignics 05"],
  ["apolonia-tiago", "Dignics 05", "Dignics 05"],
  ["gacina-andrej", "Zyre 03", "Zyre 03"],
  ["polcanova-sofia", "Dignics 05", "Dignics 05"],
  ["jha-kanak", "Zyre 03", "Zyre 03"],
  ["diaz-adriana", "Dignics 05", "Dignics 05"],
  ["assar-omar", "Dignics 09C", "Dignics 05"],
];

// Офіційна жорсткість губки (butterfly.co.jp, картки товарів; збігається з expert.ts).
const RUBBERS = [
  ["Dignics 09C", 44],
  ["Zyre 03", 44],
  ["Dignics 05", 40],
  ["Tenergy 05 Hard", 43],
];

const BG = "#0E1117";
const CARD = "#161B22";
const GRID = "#212832";
const MUTED = "#8A93A0";
const TEXT = "#F2F4F7";
const ACCENT = "#E8FF47";
const RUBBER = "#D9532B";
const FONT = "Oswald,'Arial Narrow',Arial,sans-serif";

const T = {
  ua: {
    title: "ЧИМ КЛЕЮТЬ ПРОФІ BUTTERFLY",
    sub: (n) => `Гравці Advisory Staff, у яких Butterfly вказує обидві накладки: ${n}`,
    fh: "Форхенд",
    bh: "Бекхенд",
    hard: "жорсткість",
    source: "Дані: сторінки гравців butterfly.co.jp, звірено 27.10.2026",
  },
  ru: {
    title: "ЧЕМ КЛЕЯТ ПРОФИ BUTTERFLY",
    sub: (n) => `Игроки Advisory Staff, у которых Butterfly указывает обе накладки: ${n}`,
    fh: "Форхенд",
    bh: "Бэкхенд",
    hard: "жёсткость",
    source: "Данные: страницы игроков butterfly.co.jp, сверено 27.10.2026",
  },
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const W = 900; // вузьке полотно: на телефоні підписи лишаються читабельними
const ROW = 112;
const TOP = 186;
const H = TOP + RUBBERS.length * ROW + 70;

const count = (side, name) => PLAYERS.filter((p) => p[side] === name).length;

function svg(lang) {
  const t = T[lang];
  const b = [];
  b.push(`<rect width="${W}" height="${H}" fill="${BG}"/>`);
  b.push(`<text x="60" y="64" fill="${TEXT}" font-size="36" font-weight="700" letter-spacing="1">${esc(t.title)}</text>`);
  b.push(`<text x="60" y="100" fill="${MUTED}" font-size="19">${esc(t.sub(PLAYERS.length))}</text>`);
  // Легенда
  b.push(`<rect x="60" y="128" width="22" height="22" rx="3" fill="${ACCENT}"/>`);
  b.push(`<text x="92" y="147" fill="${TEXT}" font-size="21">${esc(t.fh)}</text>`);
  b.push(`<rect x="230" y="128" width="22" height="22" rx="3" fill="${RUBBER}"/>`);
  b.push(`<text x="262" y="147" fill="${TEXT}" font-size="21">${esc(t.bh)}</text>`);

  const max = PLAYERS.length;
  const x0 = 360;
  const wMax = W - 60 - x0 - 50;
  RUBBERS.forEach(([name, hard], i) => {
    const y = TOP + i * ROW;
    b.push(`<rect x="60" y="${y}" width="${W - 120}" height="${ROW - 14}" rx="12" fill="${CARD}" stroke="${GRID}"/>`);
    b.push(`<text x="84" y="${y + 40}" fill="${TEXT}" font-size="26" font-weight="700">${esc(name)}</text>`);
    b.push(`<text x="84" y="${y + 72}" fill="${MUTED}" font-size="19">${esc(t.hard)} ${hard}</text>`);
    [
      [1, ACCENT, y + 16],
      [2, RUBBER, y + 54],
    ].forEach(([side, color, by]) => {
      const n = count(side, name);
      const w = Math.max(4, (n / max) * wMax);
      b.push(`<rect x="${x0}" y="${by}" width="${w.toFixed(1)}" height="30" rx="4" fill="${color}"/>`);
      b.push(`<text x="${(x0 + w + 12).toFixed(1)}" y="${by + 23}" fill="${TEXT}" font-size="23" font-weight="700">${n}</text>`);
    });
  });

  b.push(`<text x="60" y="${H - 28}" fill="${MUTED}" font-size="15">${esc(t.source)}</text>`);
  b.push(`<text x="${W - 60}" y="${H - 28}" fill="#39424E" font-size="15" text-anchor="end">ttmax.com.ua</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT}">\n${b.join("\n")}\n</svg>\n`;
}

for (const [name] of RUBBERS) {
  console.log(`  ${name}: FH ${count(1, name)} · BH ${count(2, name)}`);
}
for (const lang of ["ua", "ru"]) {
  const out = svg(lang);
  writeFileSync(join(OUT, `profi-nakladky-${lang}.svg`), out);
  console.log(`  profi-nakladky-${lang}.svg ${(out.length / 1024).toFixed(1)} kb`);
}
