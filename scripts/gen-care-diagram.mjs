// Схема «догляд за накладками й коли міняти» для статті doglyad-za-nakladkamy
// → public/blog/doglyad-skhema-{ua,ru}.svg
//
// Кроки — ТАК, як їх описує Butterfly (butterfly-global.com/en/products/care/):
// pimples_in.html — очищувач → губка → плівка, коли поверхня висохне;
// pimples_out.html — Cure Water → легко щіткою → готово, коли висохне;
// replacement.html — ознаки, що накладку час міняти. Ті самі формулювання — у статті
// й FAQ: міняєш тут — міняй і в blog.ts.
//
// Запуск: node scripts/gen-care-diagram.mjs
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
const RUBBER = "#D9532B";
const FOAM = "#F4F1EA";
const WARN = "#FF8A5B";
const FONT = "Oswald,'Arial Narrow',Arial,sans-serif";

const T = {
  ua: {
    title: "ДОГЛЯД ЗА НАКЛАДКАМИ ЗА BUTTERFLY",
    rowIn: "Гладкі накладки (шипи всередину)",
    rowOut: "Шипи назовні й довгі шипи",
    stepsIn: [
      ["Нанесіть очищувач", "Spin Refresh або Cure Water"],
      ["Протріть губкою", "губка для накладок"],
      ["Плівка, коли висохне", "захищає поверхню до гри"],
    ],
    stepsOut: [
      ["Розпиліть Cure Water", "рівно по всій поверхні"],
      ["Пройдіться щіткою", "легко, бруд між шипами"],
      ["Дайте висохнути", "і догляд завершено"],
    ],
    replace: "КОЛИ МІНЯТИ",
    replIn: ["Гладкі:", "поверхня втратила зчеплення;", "блиск зник, поверхня білясто-тьмяна"],
    replOut: ["Шипи:", "шипи почали ламатися;", "колір тьмяніє, менше відскоку й обертання"],
    source: "За сторінками догляду й заміни накладок butterfly-global.com",
  },
  ru: {
    title: "УХОД ЗА НАКЛАДКАМИ ПО BUTTERFLY",
    rowIn: "Гладкие накладки (шипы внутрь)",
    rowOut: "Шипы наружу и длинные шипы",
    stepsIn: [
      ["Нанесите очиститель", "Spin Refresh или Cure Water"],
      ["Протрите губкой", "губка для накладок"],
      ["Плёнка, когда высохнет", "защищает поверхность до игры"],
    ],
    stepsOut: [
      ["Распылите Cure Water", "ровно по всей поверхности"],
      ["Пройдитесь щёткой", "легко, грязь между шипами"],
      ["Дайте высохнуть", "и уход завершён"],
    ],
    replace: "КОГДА МЕНЯТЬ",
    replIn: ["Гладкие:", "поверхность потеряла сцепление;", "блеск пропал, поверхность белёсо-тусклая"],
    replOut: ["Шипы:", "шипы начали ломаться;", "цвет тускнеет, меньше отскока и вращения"],
    source: "По страницам ухода и замены накладок butterfly-global.com",
  },
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const W = 1200;
const H = 780;

/** Піктограми кроків: 0 піна, 1 губка, 2 плівка, 3 спрей, 4 щітка, 5 сухо. */
function icon(kind, x, y) {
  switch (kind) {
    case 0: // накладка + піна
      return `<ellipse cx="${x}" cy="${y}" rx="30" ry="34" fill="${RUBBER}"/>` +
        `<circle cx="${x - 6}" cy="${y - 4}" r="9" fill="${FOAM}"/><circle cx="${x + 7}" cy="${y + 2}" r="7" fill="${FOAM}"/><circle cx="${x}" cy="${y + 10}" r="6" fill="${FOAM}" opacity="0.9"/>`;
    case 1: // губка на накладці
      return `<ellipse cx="${x}" cy="${y}" rx="30" ry="34" fill="${RUBBER}"/>` +
        `<rect x="${x - 22}" y="${y - 14}" width="44" height="16" rx="4" fill="#2B3138"/><rect x="${x - 22}" y="${y + 2}" width="44" height="10" rx="3" fill="${FOAM}"/>`;
    case 2: // плівка з загнутим кутом
      return `<ellipse cx="${x}" cy="${y}" rx="30" ry="34" fill="${RUBBER}"/>` +
        `<ellipse cx="${x}" cy="${y}" rx="32" ry="36" fill="${TEXT}" opacity="0.16" stroke="${TEXT}" stroke-opacity="0.6" stroke-width="2"/>` +
        `<path d="M${x + 14} ${y - 30} L${x + 30} ${y - 16} L${x + 12} ${y - 12} Z" fill="${TEXT}" opacity="0.55"/>`;
    case 3: // спрей
      return `<ellipse cx="${x + 14}" cy="${y + 4}" rx="26" ry="30" fill="${RUBBER}"/>` +
        Array.from({ length: 12 }, (_, i) => `<circle cx="${x + 1 + (i % 4) * 9}" cy="${y - 5 + Math.floor(i / 4) * 9}" r="2.6" fill="#1A1F26"/>`).join("") +
        `<rect x="${x - 40}" y="${y - 22}" width="18" height="40" rx="4" fill="${ACCENT}"/><rect x="${x - 36}" y="${y - 30}" width="10" height="9" rx="2" fill="${ACCENT}"/>` +
        `<circle cx="${x - 16}" cy="${y - 26}" r="2.5" fill="${FOAM}"/><circle cx="${x - 8}" cy="${y - 22}" r="2.5" fill="${FOAM}"/><circle cx="${x - 12}" cy="${y - 32}" r="2" fill="${FOAM}"/>`;
    case 4: // щітка над шипами
      return `<ellipse cx="${x}" cy="${y + 6}" rx="30" ry="30" fill="${RUBBER}"/>` +
        Array.from({ length: 12 }, (_, i) => `<circle cx="${x - 14 + (i % 4) * 9}" cy="${y - 2 + Math.floor(i / 4) * 9}" r="2.6" fill="#1A1F26"/>`).join("") +
        `<rect x="${x - 26}" y="${y - 34}" width="52" height="12" rx="4" fill="${ACCENT}"/>` +
        Array.from({ length: 8 }, (_, i) => `<line x1="${x - 21 + i * 6}" y1="${y - 22}" x2="${x - 21 + i * 6}" y2="${y - 12}" stroke="${FOAM}" stroke-width="2"/>`).join("");
    default: // сухо — галочка
      return `<ellipse cx="${x}" cy="${y}" rx="30" ry="34" fill="${RUBBER}"/>` +
        `<circle cx="${x + 22}" cy="${y - 22}" r="15" fill="${ACCENT}"/><path d="M${x + 15} ${y - 22} L${x + 20} ${y - 16} L${x + 30} ${y - 28}" stroke="${BG}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
}

function row(b, label, steps, y, kinds) {
  b.push(`<text x="60" y="${y}" fill="${ACCENT}" font-size="17" font-weight="700" letter-spacing="0.5">${esc(label)}</text>`);
  const cw = 340;
  const ch = 150;
  steps.forEach(([head, sub], i) => {
    const x = 60 + i * (cw + 30);
    const cy = y + 16;
    b.push(`<rect x="${x}" y="${cy}" width="${cw}" height="${ch}" rx="14" fill="${CARD}" stroke="${GRID}"/>`);
    b.push(`<circle cx="${x + 30}" cy="${cy + 30}" r="16" fill="${ACCENT}"/>`);
    b.push(`<text x="${x + 30}" y="${cy + 36}" fill="${BG}" font-size="18" font-weight="700" text-anchor="middle">${i + 1}</text>`);
    b.push(icon(kinds[i], x + 78, cy + 92));
    b.push(`<text x="${x + 128}" y="${cy + 84}" fill="${TEXT}" font-size="18" font-weight="700">${esc(head)}</text>`);
    b.push(`<text x="${x + 128}" y="${cy + 110}" fill="${MUTED}" font-size="15">${esc(sub)}</text>`);
    if (i < steps.length - 1) {
      const ax = x + cw + 6;
      b.push(`<path d="M${ax} ${cy + ch / 2} l14 0 m-6 -6 l6 6 l-6 6" stroke="${MUTED}" stroke-width="2" fill="none"/>`);
    }
  });
}

function svg(lang) {
  const t = T[lang];
  const b = [];
  b.push(`<rect width="${W}" height="${H}" fill="${BG}"/>`);
  b.push(`<text x="60" y="64" fill="${TEXT}" font-size="30" font-weight="700" letter-spacing="1">${esc(t.title)}</text>`);
  b.push(`<line x1="60" y1="84" x2="1140" y2="84" stroke="${GRID}"/>`);

  row(b, t.rowIn, t.stepsIn, 124, [0, 1, 2]);
  row(b, t.rowOut, t.stepsOut, 336, [3, 4, 5]);

  // Коли міняти
  const ry = 528;
  b.push(`<rect x="60" y="${ry}" width="1080" height="170" rx="14" fill="none" stroke="${WARN}" stroke-opacity="0.7" stroke-width="2"/>`);
  b.push(`<text x="88" y="${ry + 40}" fill="${WARN}" font-size="20" font-weight="700" letter-spacing="1">${esc(t.replace)}</text>`);
  [t.replIn, t.replOut].forEach(([head, l1, l2], i) => {
    const x = 88 + i * 530;
    b.push(`<text x="${x}" y="${ry + 82}" fill="${TEXT}" font-size="19" font-weight="700">${esc(head)}</text>`);
    for (const [k, line] of [l1, l2].entries()) {
      const yy = ry + 112 + k * 28;
      b.push(`<circle cx="${x + 5}" cy="${yy - 5}" r="4" fill="${WARN}"/>`);
      b.push(`<text x="${x + 18}" y="${yy}" fill="${TEXT}" font-size="16" opacity="0.9">${esc(line)}</text>`);
    }
  });

  b.push(`<text x="60" y="${H - 28}" fill="${MUTED}" font-size="13">${esc(t.source)}</text>`);
  b.push(`<text x="1140" y="${H - 28}" fill="#39424E" font-size="13" text-anchor="end">ttmax.com.ua</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT}">\n${b.join("\n")}\n</svg>\n`;
}

for (const lang of ["ua", "ru"]) {
  const out = svg(lang);
  writeFileSync(join(OUT, `doglyad-skhema-${lang}.svg`), out);
  console.log(`  doglyad-skhema-${lang}.svg ${(out.length / 1024).toFixed(1)} kb`);
}
