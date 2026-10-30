// Схема «Apolonia ZLC: твердість накладок і де їх ставлять» для статті apolonia-zlc-oglyad
// → public/blog/apolonia-tverdist-{ua,ru}.svg
//
// Твердість губки — НЕ константи: читається з src/data/catalog/products.ts (specs.hardnessDeg,
// дані Butterfly), тож схема не розійдеться з каталогом. Зони «форхенд / бекхенд» — висновок статті
// з відгуків (Revspin, BladeRubber, tabletennis-reference): на форхенд — 36–44° (частіше 40–44°), на бекхенд —
// 32–40°. Зони перекриваються на 36–40°. Позначки гравців — сетапи на Apolonia ZLC: Аполонія (butterfly.co.jp, 11.04.2025:
// Dignics 05 + Dignics 05), Шмідбергер (butterfly-global.com, 09.07.2021: Tenergy 05 + Tenergy 64),
// Мойланд (tabletennis-reference: Dignics 09C + Dignics 09C). Міняєш тут — міняй і в blog.ts.
//
// Запуск: node scripts/gen-apolonia-diagram.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "blog");

// Палітра — спільна для схем блогу (як у gen-care-diagram.mjs).
const BG = "#0E1117";
const CARD = "#161B22";
const GRID = "#212832";
const MUTED = "#8A93A0";
const TEXT = "#F2F4F7";
const ACCENT = "#E8FF47";
const FONT = "Oswald,'Arial Narrow',Arial,sans-serif";

/** [id у products.ts, назва, хто з гравців грає на Apolonia ZLC] */
const RUBBERS = [
  ["tenergy-05-fx", "Tenergy 05 FX", ""],
  ["rozena", "Rozena", ""],
  ["tenergy-05", "Tenergy 05", "schmidberger"],
  ["tenergy-64", "Tenergy 64", "schmidberger"],
  ["glayzer", "Glayzer", ""],
  ["dignics-05", "Dignics 05", "apolonia"],
  ["dignics-80", "Dignics 80", ""],
  ["tenergy-05-hard", "Tenergy 05 Hard", ""],
  ["dignics-09c", "Dignics 09C", "moyland"],
  ["zyre-03", "Zyre 03", ""],
];

const products = readFileSync(join(ROOT, "src", "data", "catalog", "products.ts"), "utf8");
function hardness(id) {
  const i = products.indexOf(`id: "${id}",`);
  const m = i >= 0 && products.slice(i, i + 2500).match(/hardnessDeg: (\d+)/);
  if (!m) throw new Error(`немає hardnessDeg для ${id}`);
  return Number(m[1]);
}
const rows = RUBBERS.map(([id, name, who]) => ({ name, who, deg: hardness(id) })).sort(
  (a, b) => a.deg - b.deg || a.name.localeCompare(b.name),
);

const T = {
  ua: {
    title: "APOLONIA ZLC: ТВЕРДІСТЬ НАКЛАДОК І ДЕ ЇХ СТАВЛЯТЬ",
    axis: "твердість губки, °",
    bh: "БЕКХЕНД у відгуках",
    fh: "ФОРХЕНД у відгуках",
    who: { apolonia: "Аполонія", schmidberger: "Шмідбергер", moyland: "Мойланд" },
    legend: "— грає на Apolonia ZLC",
    source: "Твердість — дані Butterfly; гравці — butterfly.co.jp, butterfly-global.com, tabletennis-reference",
  },
  ru: {
    title: "APOLONIA ZLC: ЖЁСТКОСТЬ НАКЛАДОК И КУДА ИХ СТАВЯТ",
    axis: "жёсткость губки, °",
    bh: "БЭКХЕНД в отзывах",
    fh: "ФОРХЕНД в отзывах",
    who: { apolonia: "Аполония", schmidberger: "Шмидбергер", moyland: "Мойланд" },
    legend: "— играет на Apolonia ZLC",
    source: "Жёсткость — данные Butterfly; игроки — butterfly.co.jp, butterfly-global.com, tabletennis-reference",
  },
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const W = 1000;
const ROW = 50;
const TOP = 150;
const H = TOP + rows.length * ROW + 150;
const X0 = 330; // 30°
const X1 = 930; // 46°
const MIN = 30;
const MAX = 46;
const x = (deg) => X0 + ((deg - MIN) / (MAX - MIN)) * (X1 - X0);

function render(lang) {
  const t = T[lang];
  const plotTop = TOP - 20;
  const plotBottom = TOP + rows.length * ROW;
  const o = [];
  o.push(`<rect width="${W}" height="${H}" fill="${BG}"/>`);
  o.push(`<rect x="24" y="24" width="${W - 48}" height="${H - 48}" rx="22" fill="${CARD}"/>`);
  o.push(`<text x="60" y="84" font-family="${FONT}" font-size="30" font-weight="700" fill="${TEXT}" letter-spacing="0.5">${esc(t.title)}</text>`);

  // зони: бекхенд 32–40°, форхенд 40–44°
  // підписи зон — біля зовнішніх країв, бо зони перекриваються
  const zone = (a, b, op, label, anchor) => {
    o.push(`<rect x="${x(a)}" y="${plotTop}" width="${x(b) - x(a)}" height="${plotBottom - plotTop}" fill="${ACCENT}" fill-opacity="${op}"/>`);
    const lx = anchor === "start" ? x(a) + 4 : x(b) - 4;
    o.push(`<text x="${lx}" y="${plotTop - 10}" text-anchor="${anchor}" font-family="${FONT}" font-size="17" font-weight="700" fill="${ACCENT}" letter-spacing="1">${esc(label)}</text>`);
  };
  zone(32, 40, 0.06, t.bh, "start");
  zone(36, 44, 0.08, t.fh, "end");

  // сітка
  for (let d = MIN; d <= MAX; d += 2) {
    o.push(`<line x1="${x(d)}" y1="${plotTop}" x2="${x(d)}" y2="${plotBottom}" stroke="${GRID}" stroke-width="1.5"/>`);
    o.push(`<text x="${x(d)}" y="${plotBottom + 30}" text-anchor="middle" font-family="${FONT}" font-size="19" fill="${MUTED}">${d}</text>`);
  }
  o.push(`<text x="${(X0 + X1) / 2}" y="${plotBottom + 62}" text-anchor="middle" font-family="${FONT}" font-size="18" fill="${MUTED}">${esc(t.axis)}</text>`);

  rows.forEach((r, i) => {
    const y = TOP + i * ROW + ROW / 2;
    const cx = x(r.deg);
    o.push(`<text x="${X0 - 24}" y="${y + 7}" text-anchor="end" font-family="${FONT}" font-size="22" fill="${TEXT}">${esc(r.name)}</text>`);
    o.push(`<line x1="${X0}" y1="${y}" x2="${cx}" y2="${y}" stroke="${MUTED}" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="3 6"/>`);
    if (r.who) {
      o.push(`<circle cx="${cx}" cy="${y}" r="15" fill="none" stroke="${ACCENT}" stroke-width="2.5"/>`);
      o.push(`<circle cx="${cx}" cy="${y}" r="8" fill="${ACCENT}"/>`);
      const right = cx + 26 + 110 < W - 40;
      o.push(`<text x="${right ? cx + 26 : cx - 26}" y="${y + 6}" text-anchor="${right ? "start" : "end"}" font-family="${FONT}" font-size="17" fill="${ACCENT}">${esc(t.who[r.who])}</text>`);
    } else {
      o.push(`<circle cx="${cx}" cy="${y}" r="8" fill="${TEXT}" fill-opacity="0.85"/>`);
    }
    o.push(`<text x="${cx}" y="${y - (r.who ? 21 : 14)}" text-anchor="middle" font-family="${FONT}" font-size="14" fill="${MUTED}">${r.deg}°</text>`);
  });

  // легенда і джерело
  const ly = H - 62;
  o.push(`<circle cx="70" cy="${ly - 6}" r="12" fill="none" stroke="${ACCENT}" stroke-width="2.5"/><circle cx="70" cy="${ly - 6}" r="6" fill="${ACCENT}"/>`);
  o.push(`<text x="92" y="${ly}" font-family="${FONT}" font-size="18" fill="${TEXT}">${esc(t.legend)}</text>`);
  o.push(`<text x="60" y="${H - 34}" font-family="${FONT}" font-size="15" fill="${MUTED}">${esc(t.source)}</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">\n${o.join("\n")}\n</svg>\n`;
}

for (const lang of ["ua", "ru"]) {
  const svg = render(lang);
  writeFileSync(join(OUT, `apolonia-tverdist-${lang}.svg`), svg);
  console.log(`  apolonia-tverdist-${lang}.svg  ${(svg.length / 1024).toFixed(1)} kb`);
}
console.log("  " + rows.map((r) => `${r.name} ${r.deg}°`).join(", "));
