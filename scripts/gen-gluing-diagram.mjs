// Схема «як наклеїти накладку» для статті yak-nakleity-nakladku
// → public/blog/nakleity-skhema-{ua,ru}.svg
//
// Шість кроків поклейки водним клеєм Free Chack — ТАК, як їх описує Butterfly
// (butterfly-global.com/en/products/care/free_chack.html і replacement.html):
// клей спершу на губку, «з монету 20–25 мм», щонайменше 10 хвилин до прозорості,
// накладку прикладають від ручки вгору. Ці числа — у тексті статті й FAQ теж:
// міняєш тут — міняй і в blog.ts.
//
// Запуск: node scripts/gen-gluing-diagram.mjs
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "blog");

// Палітра — спільна для схем блогу.
const BG = "#0E1117";
const CARD = "#161B22";
const GRID = "#212832";
const MUTED = "#8A93A0";
const TEXT = "#F2F4F7";
const ACCENT = "#E8FF47";
const RUBBER = "#D9532B"; // губка накладки
const WOOD = "#B88A57"; // основа
const FONT = "Oswald,'Arial Narrow',Arial,sans-serif";

const T = {
  ua: {
    title: "ЯК НАКЛЕЇТИ НАКЛАДКУ: 6 КРОКІВ BUTTERFLY",
    source: "За інструкцією Butterfly до водного клею Free Chack",
    steps: [
      ["Очистіть основу", "старий клей — шматочком", "старої накладки"],
      ["Клей на губку накладки", "першою: вона сохне довше;", "з монету 20–25 мм"],
      ["Клей на основу", "тонкий рівний шар", "на чисту деревину"],
      ["Чекайте ≥ 10 хв", "доки клей із молочно-білого", "стане прозорим"],
      ["Від ручки вгору", "притисніть щільно, без бульбашок;", "ручку не тисніть"],
      ["Обріжте й обклейте", "гострими ножицями по краю,", "торець — стрічкою"],
    ],
  },
  ru: {
    title: "КАК НАКЛЕИТЬ НАКЛАДКУ: 6 ШАГОВ BUTTERFLY",
    source: "По инструкции Butterfly к водному клею Free Chack",
    steps: [
      ["Очистите основание", "старый клей — кусочком", "старой накладки"],
      ["Клей на губку накладки", "первой: она сохнет дольше;", "с монету 20–25 мм"],
      ["Клей на основание", "тонкий ровный слой", "на чистую древесину"],
      ["Ждите ≥ 10 мин", "пока клей из молочно-белого", "станет прозрачным"],
      ["От ручки вверх", "прижмите плотно, без пузырей;", "ручку не давите"],
      ["Обрежьте и оклейте", "острыми ножницами по краю,", "торец — лентой"],
    ],
  },
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const W = 1200;
const H = 730;

/** Невелика піктограма кроку: лопать основи / накладка / таймер / стрілка тощо. */
function icon(i, x, y) {
  const blade = (fill, stroke = "none") =>
    `<ellipse cx="${x}" cy="${y}" rx="34" ry="40" fill="${fill}" stroke="${stroke}" stroke-width="2"/>` +
    `<rect x="${x - 8}" y="${y + 36}" width="16" height="30" rx="4" fill="${WOOD}" opacity="0.85"/>`;
  switch (i) {
    case 0: // основа + шкребок
      return blade(WOOD) + `<path d="M${x - 20} ${y - 14} L${x + 18} ${y + 14}" stroke="${BG}" stroke-width="5" stroke-linecap="round" opacity="0.6"/><rect x="${x + 20}" y="${y - 30}" width="22" height="14" rx="3" fill="${RUBBER}" transform="rotate(25 ${x + 31} ${y - 23})"/>`;
    case 1: // губка накладки + монета клею
      return `<ellipse cx="${x}" cy="${y + 12}" rx="38" ry="42" fill="${RUBBER}"/><circle cx="${x}" cy="${y + 12}" r="14" fill="#F4F1EA" opacity="0.92"/>`;
    case 2: // основа + шар клею
      return blade(WOOD) + `<ellipse cx="${x}" cy="${y}" rx="26" ry="31" fill="#F4F1EA" opacity="0.55"/>`;
    case 3: // таймер
      return `<circle cx="${x}" cy="${y + 12}" r="38" fill="none" stroke="${ACCENT}" stroke-width="4"/><path d="M${x} ${y + 12} L${x} ${y - 14} M${x} ${y + 12} L${x + 18} ${y + 22}" stroke="${ACCENT}" stroke-width="4" stroke-linecap="round"/><rect x="${x - 8}" y="${y - 34}" width="16" height="8" rx="2" fill="${ACCENT}"/>`;
    case 4: // стрілка від ручки вгору
      return blade(RUBBER) + `<path d="M${x} ${y + 30} L${x} ${y - 26} M${x - 12} ${y - 12} L${x} ${y - 28} L${x + 12} ${y - 12}" stroke="${ACCENT}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    default: // торцева стрічка по контуру
      return blade(RUBBER, ACCENT) + `<ellipse cx="${x}" cy="${y}" rx="38" ry="44" fill="none" stroke="${ACCENT}" stroke-width="4" stroke-dasharray="10 6"/>`;
  }
}

function svg(lang) {
  const t = T[lang];
  const b = [];
  b.push(`<rect width="${W}" height="${H}" fill="${BG}"/>`);
  b.push(`<text x="60" y="64" fill="${TEXT}" font-size="30" font-weight="700" letter-spacing="1">${esc(t.title)}</text>`);
  b.push(`<line x1="60" y1="84" x2="1140" y2="84" stroke="${GRID}"/>`);

  const cw = 340;
  const ch = 268;
  const gx = 30;
  const gy = 26;
  const x0 = 60;
  const y0 = 112;
  t.steps.forEach(([head, l1, l2], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = x0 + col * (cw + gx);
    const y = y0 + row * (ch + gy);
    b.push(`<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="14" fill="${CARD}" stroke="${GRID}"/>`);
    b.push(`<circle cx="${x + 34}" cy="${y + 34}" r="18" fill="${ACCENT}"/>`);
    b.push(`<text x="${x + 34}" y="${y + 41}" fill="${BG}" font-size="20" font-weight="700" text-anchor="middle">${i + 1}</text>`);
    b.push(icon(i, x + cw / 2, y + 92));
    b.push(`<text x="${x + cw / 2}" y="${y + 196}" fill="${TEXT}" font-size="21" font-weight="700" text-anchor="middle">${esc(head)}</text>`);
    b.push(`<text x="${x + cw / 2}" y="${y + 224}" fill="${MUTED}" font-size="15" text-anchor="middle">${esc(l1)}</text>`);
    b.push(`<text x="${x + cw / 2}" y="${y + 245}" fill="${MUTED}" font-size="15" text-anchor="middle">${esc(l2)}</text>`);
  });

  b.push(`<text x="60" y="${H - 24}" fill="${MUTED}" font-size="13">${esc(t.source)}</text>`);
  b.push(`<text x="1140" y="${H - 24}" fill="#39424E" font-size="13" text-anchor="end">ttmax.com.ua</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT}">\n${b.join("\n")}\n</svg>\n`;
}

for (const lang of ["ua", "ru"]) {
  const out = svg(lang);
  writeFileSync(join(OUT, `nakleity-skhema-${lang}.svg`), out);
  console.log(`  nakleity-skhema-${lang}.svg ${(out.length / 1024).toFixed(1)} kb`);
}
