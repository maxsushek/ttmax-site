// Схема «де шукати ознаки оригіналу» для статті про версії основ Butterfly
// → public/blog/versii-pereviryty-{ua,ru}.svg
//
// ⚠️ ЧОМУ СХЕМА, А НЕ ФОТО ЧИ ЗГЕНЕРОВАНА КАРТИНКА. Стаття вчить відрізняти підробку.
// Згенерована ШІ «основа Butterfly» сама була б підробкою: вигаданий друк, неіснуюча
// табличка, не той логотип — і читач звіряв би свою основу з вигадкою. Тому тут
// силует без жодного фірмового графічного елемента, а справжні деталі показані
// реальними фото в картках товарів усередині статті.
//
// ⚠️ ЖОДНИХ ЧИСЕЛ МОДЕЛЕЙ (товщина, вага) — вони різні в кожної моделі й міняються
// між поколіннями. Схема показує, КУДИ дивитись, а числа — у тексті й на картці товару.
//
// Номери точок збігаються з номерами кроків у розділі «Як перевірити» (blog.ts).
// Змінюєш порядок кроків — зміни й тут.
//
// Запуск: node scripts/gen-authenticity-diagram.mjs
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "blog");

// Палітра — та сама, що в gen-spin-speed-chart: схеми блогу мають виглядати однією серією.
const BG = "#0E1117";
const GRID = "#212832";
const DIM = "#39424E";
const MUTED = "#8A93A0";
const TEXT = "#F2F4F7";
const ACCENT = "#E8FF47";
const FONT = "Oswald,'Arial Narrow',Arial,sans-serif";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Точки на силуеті: номер кроку → координата на основі.
 *
 * ⚠️ Номери йдуть ЗВЕРХУ ВНИЗ за висотою точки. Інакше виноски перехрещуються
 * (перша версія так і виглядала: лінза ручки вела до рядка №3 через пів схеми).
 * Кроки в статті впорядковані так само — від лопаті до торця ручки.
 */
const POINTS = {
  1: { x: 300, y: 201 }, // країна виробництва — надрукована на лопаті
  2: { x: 300, y: 296 }, // друк логотипа й назви
  3: { x: 488, y: 336 }, // кромка: шари й товщина
  4: { x: 402, y: 430 }, // серійний номер на лопаті
  5: { x: 300, y: 560 }, // лінза з назвою моделі на ручці
  6: { x: 300, y: 693 }, // торець ручки: табличка, J.T.T.A.A.
};

const LABELS = {
  ua: {
    title: "Де шукати ознаки оригіналу",
    items: [
      ["Країна виробництва", "«Made in …» на лопаті = як на butterfly-global.com"],
      ["Друк на лопаті", "Надрукований на дереві, не наклейка, без перекосу"],
      ["Кромка", "Рівні шари, товщина за паспортом моделі"],
      ["Серійний номер", "Той самий шрифт; для Китаю — як на коробці"],
      ["Лінза на ручці", "Металева, вбудована врівень, без вицвітання"],
      ["Торець ручки", "Рівна табличка, чітке тиснення J.T.T.A.A."],
    ],
    extra: [
      ["Вага", "У межах діапазону моделі"],
      ["Продавець", "Офіційний дистриб'ютор країни"],
    ],
  },
  ru: {
    title: "Где искать признаки оригинала",
    items: [
      ["Страна производства", "«Made in …» на лопасти = как на butterfly-global.com"],
      ["Печать на лопасти", "Напечатана на дереве, не наклейка, без перекоса"],
      ["Кромка", "Ровные слои, толщина по паспорту модели"],
      ["Серийный номер", "Тот же шрифт; для Китая — как на коробке"],
      ["Линза на ручке", "Металлическая, встроена вровень, без выцветания"],
      ["Торец ручки", "Ровная табличка, чёткое тиснение J.T.T.A.A."],
    ],
    extra: [
      ["Вес", "В пределах диапазона модели"],
      ["Продавец", "Официальный дистрибьютор страны"],
    ],
  },
};

function blade() {
  // Силует без фірмової графіки: лопать, шари на кромці, ручка з лінзою й торцем.
  const cx = 300;
  return [
    `<ellipse cx="${cx}" cy="300" rx="190" ry="208" fill="#1A212B" stroke="${DIM}" stroke-width="2"/>`,
    // кромка праворуч — «шари»
    ...[-6, -2, 2, 6].map(
      (d) =>
        `<path d="M${cx + 186 + d * 0.4} ${210} Q ${cx + 198 + d} 300 ${cx + 186 + d * 0.4} 390" fill="none" stroke="${d === 2 ? ACCENT : MUTED}" stroke-opacity="${d === 2 ? 0.55 : 0.35}" stroke-width="1.4"/>`,
    ),
    // «друк» на лопаті — умовні смуги без тексту
    `<rect x="${cx - 70}" y="196" width="140" height="10" rx="5" fill="${DIM}"/>`,
    `<rect x="${cx - 95}" y="288" width="190" height="16" rx="8" fill="${DIM}"/>`,
    `<rect x="${cx - 55}" y="316" width="110" height="9" rx="4.5" fill="${DIM}"/>`,
    // серійний номер — ряд дрібних рисок
    ...[0, 1, 2, 3, 4, 5].map(
      (i) => `<rect x="${372 + i * 11}" y="424" width="7" height="12" rx="1.5" fill="${DIM}"/>`,
    ),
    // ручка
    `<rect x="${cx - 38}" y="490" width="76" height="212" rx="12" fill="#1A212B" stroke="${DIM}" stroke-width="2"/>`,
    `<rect x="${cx - 22}" y="530" width="44" height="60" rx="14" fill="${DIM}"/>`,
    `<rect x="${cx - 38}" y="684" width="76" height="18" rx="6" fill="${DIM}"/>`,
  ].join("\n");
}

function render(locale) {
  const L = LABELS[locale];
  const out = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 780" width="1200" height="780" font-family="${FONT}">`,
    `<rect width="1200" height="780" fill="${BG}"/>`,
    `<text x="60" y="64" fill="${TEXT}" font-size="30" font-weight="700" letter-spacing="1">${esc(L.title.toUpperCase())}</text>`,
    `<line x1="60" y1="84" x2="1140" y2="84" stroke="${GRID}"/>`,
    blade(),
  ];

  const rowY = (i) => 150 + i * 92;
  const labelX = 640;
  L.items.forEach(([title, sub], i) => {
    const n = i + 1;
    const p = POINTS[n];
    const y = rowY(i);
    out.push(
      // виноска від точки на основі до номера
      // горизонтально до спільної «шини» x=560, далі навскіс до номера — без перехрещень,
      // бо і точки, і рядки впорядковані зверху вниз
      `<path d="M${p.x} ${p.y} L560 ${p.y} L${labelX - 22} ${y}" fill="none" stroke="${ACCENT}" stroke-opacity="0.35" stroke-width="1.4"/>`,
      `<circle cx="${p.x}" cy="${p.y}" r="7" fill="${ACCENT}"/>`,
      `<circle cx="${labelX}" cy="${y}" r="20" fill="${ACCENT}"/>`,
      `<text x="${labelX}" y="${y + 7}" fill="${BG}" font-size="20" font-weight="700" text-anchor="middle">${n}</text>`,
      `<text x="${labelX + 36}" y="${y - 4}" fill="${TEXT}" font-size="22" font-weight="700">${esc(title)}</text>`,
      `<text x="${labelX + 36}" y="${y + 22}" fill="${MUTED}" font-size="17">${esc(sub)}</text>`,
    );
  });

  // Кроки 7–8 не мають точки на основі — окремий рядок унизу.
  L.extra.forEach(([title, sub], i) => {
    const n = L.items.length + i + 1;
    const x = 60 + i * 290;
    out.push(
      `<circle cx="${x + 20}" cy="742" r="18" fill="none" stroke="${ACCENT}" stroke-width="2"/>`,
      `<text x="${x + 20}" y="749" fill="${ACCENT}" font-size="18" font-weight="700" text-anchor="middle">${n}</text>`,
      `<text x="${x + 50}" y="738" fill="${TEXT}" font-size="18" font-weight="700">${esc(title)}</text>`,
      `<text x="${x + 50}" y="760" fill="${MUTED}" font-size="15">${esc(sub)}</text>`,
    );
  });

  out.push("</svg>");
  return out.join("\n");
}

for (const locale of ["ua", "ru"]) {
  const name = `versii-pereviryty-${locale}.svg`;
  const svg = render(locale);
  writeFileSync(join(OUT, name), svg);
  console.log(`  ${name.padEnd(30)} ${(svg.length / 1024).toFixed(1)} kb`);
}
