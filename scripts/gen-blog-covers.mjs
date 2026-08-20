// Обкладинки статей блогу → public/blog/*-cover.svg
//
// ⚠️ ЧОМУ SVG, А НЕ CANVA. Обкладинка — це ФОН під заголовок: лого й текст малює
// ArticleCover.tsx поверх, із затемненням зліва направо. Тому композиція мусить бути
// порожня ліворуч і насичена праворуч, інакше заголовок ляже на деталі. У растрі,
// намальованому вручну, цю умову легко порушити при першій же правці, а перевіряти
// нікому. Генератор тримає однакове «хромо» (фон, сітка, затемнення) для всіх статей.
//
// ⚠️ ЖОДНИХ ЧИСЕЛ І ПІДПИСІВ усередині. Це декор, а не інфографіка: зашита в картинку
// цифра розійдеться з каталогом і залишиться непоміченою. Для даних є окремі схеми
// (див. gen-spin-speed-chart.md) — вони генеруються з products.ts.
//
// Кожен малюнок повторює логіку СВОЄЇ статті:
//   tenergy-dignics — три пари з ОДНАКОВИМ зсувом (головна теза статті);
//   novachok        — дві траєкторії з однієї точки: контрольована й та, що вилітає;
//   tovshchyna      — чотири розрізи різної товщини під стелею правил ITTF;
//   lypki-tenzorni  — два способи втримати мʼяч: прилипання і продавлювання.
//
// Запуск: node scripts/gen-blog-covers.mjs
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "blog");

const W = 1400;
const H = 1050;
const ACCENT = "#E8FF47";
const DOT_RING = "#5A6879";
const DOT_CORE = "#9AA6B6";

/** Спільна «рама»: фон, сітка, затемнення ліворуч. Однакова в усіх обкладинках. */
function chrome() {
  const defs = `<defs>
<radialGradient id="bg" cx="20%" cy="10%" r="115%"><stop offset="0%" stop-color="#1B2735"/><stop offset="45%" stop-color="#0F131A"/><stop offset="100%" stop-color="#07090C"/></radialGradient>
<radialGradient id="halo"><stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.42"/><stop offset="55%" stop-color="${ACCENT}" stop-opacity="0.10"/><stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/></radialGradient>
<linearGradient id="fade" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#07090C" stop-opacity="0.92"/><stop offset="30%" stop-color="#07090C" stop-opacity="0.55"/><stop offset="58%" stop-color="#07090C" stop-opacity="0.10"/><stop offset="100%" stop-color="#07090C" stop-opacity="0"/></linearGradient>
</defs>`;

  const grid = [];
  for (let x = 588; x <= 1218; x += 105) {
    grid.push(`<line x1="${x}" y1="147" x2="${x}" y2="924" stroke="#FFFFFF" stroke-opacity="0.05"/>`);
  }
  for (let y = 209; y <= 831; y += 155.5) {
    const yy = Math.round(y);
    grid.push(`<line x1="504" y1="${yy}" x2="1302" y2="${yy}" stroke="#FFFFFF" stroke-opacity="0.05"/>`);
  }
  return { defs, grid: grid.join("\n"), fade: `<rect width="${W}" height="${H}" fill="url(#fade)"/>` };
}

/**
 * ⚠️ БЕЗПЕЧНА ЗОНА: x 780–1330, y 200–850.
 *
 * Ліворуч від ~760 лягає заголовок (ArticleCover малює його поверх), тому там має бути
 * порожньо. По вертикалі картка обрізає приблизно по 75 px зверху й знизу: у неї
 * співвідношення ~1.56:1, а в SVG 1.33:1, і object-cover ріже саме висоту.
 * Перша версія цих обкладинок цього не врахувала — дуга «новачка» вийшла під заголовком,
 * а лінія столу опинилась на самому краю.
 */
const SAFE = { x0: 780, x1: 1330, y0: 200, y1: 850 };

/** Кулька-«модель»: тьмяне кільце + світле ядро. Той самий елемент, що в обкладинці Zyre. */
const dot = (cx, cy, r, op = 0.42) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${DOT_RING}" fill-opacity="${op}"/>` +
  `<circle cx="${cx}" cy="${cy}" r="${Math.round(r * 0.4)}" fill="${DOT_CORE}" fill-opacity="0.75"/>`;

/** Акцентна кулька — те, на що дивиться стаття. */
const dotAccent = (cx, cy, r) =>
  `<circle cx="${cx}" cy="${cy}" r="${r + 14}" fill="none" stroke="${ACCENT}" stroke-opacity="0.28" stroke-width="1.6"/>` +
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${ACCENT}"/>`;

function wrap(body) {
  const c = chrome();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
${c.defs}
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${c.grid}
${c.fade}
${body}
</svg>
`;
}

/* ─── 1. Tenergy → Dignics: три пари, зсув однаковий ─── */
function tenergyDignics() {
  const rows = [340, 525, 710];
  const xFrom = 830;
  const xTo = 1150; // ⚠️ зсув однаковий у всіх рядках — у цьому вся теза статті
  const b = [`<circle cx="${xTo}" cy="${rows[1]}" r="250" fill="url(#halo)"/>`];
  for (const y of rows) {
    b.push(
      `<line x1="${xFrom + 46}" y1="${y}" x2="${xTo - 52}" y2="${y}" stroke="${ACCENT}" stroke-opacity="0.22" stroke-width="1.6" stroke-dasharray="7 9"/>`,
      `<path d="M${xTo - 66} ${y - 9} L${xTo - 52} ${y} L${xTo - 66} ${y + 9}" fill="none" stroke="${ACCENT}" stroke-opacity="0.35" stroke-width="1.8"/>`,
      dot(xFrom, y, 32, 0.55),
      dotAccent(xTo, y, 28),
    );
  }
  return wrap(b.join("\n"));
}

/* ─── 2. Новачок: одна точка старту, дві траєкторії ─── */
function novachok() {
  const table = 790; // лінія столу — усередині безпечної зони, не на самому краю
  const edge = 1235; // правий край столу: повільна дуга падає ДО нього, швидка — за ним
  const x0 = 800;
  const y0 = 655;
  return wrap(
    [
      `<circle cx="1040" cy="470" r="230" fill="url(#halo)"/>`,
      // стіл і сітка — помітніші, ніж у першій версії: інакше не читалось, куди летить мʼяч
      `<line x1="760" y1="${table}" x2="${edge}" y2="${table}" stroke="#FFFFFF" stroke-opacity="0.26" stroke-width="3"/>`,
      `<line x1="1000" y1="${table}" x2="1000" y2="${table - 58}" stroke="#FFFFFF" stroke-opacity="0.26" stroke-width="3"/>`,
      // швидка пласка — проходить над столом і йде за його межу
      `<path d="M${x0} ${y0} Q 1010 ${y0 - 105} ${SAFE.x1 + 20} ${y0 + 45}" fill="none" stroke="${DOT_CORE}" stroke-opacity="0.45" stroke-width="2.6" stroke-dasharray="10 10"/>`,
      dot(SAFE.x1 + 20, y0 + 45, 18, 0.55),
      // контрольована дуга — лягає на стіл, не долітаючи до краю
      `<path d="M${x0} ${y0} Q 1005 ${y0 - 360} 1170 ${table - 16}" fill="none" stroke="${ACCENT}" stroke-opacity="0.6" stroke-width="3"/>`,
      dotAccent(1170, table - 16, 20),
      dot(x0, y0, 24, 0.55),
    ].join("\n"),
  );
}

/* ─── 3. Товщина: чотири розрізи під стелею правил ─── */
function tovshchyna() {
  const base = 800;
  const ceil = 500; // «стеля» 4 мм за правилами ITTF — сумарна товщина покриття
  const top = 52; // топшит однаковий, росте лише губка
  const stacks = [
    { x: 775, sponge: 120 },
    { x: 915, sponge: 158 },
    { x: 1055, sponge: 196 },
    { x: 1195, sponge: 248 - top }, // останній упирається в стелю — це і є MAX
  ];
  const w = 96;
  const b = [`<circle cx="1243" cy="${base - 150}" r="215" fill="url(#halo)"/>`];
  b.push(
    `<line x1="740" y1="${ceil}" x2="${SAFE.x1}" y2="${ceil}" stroke="${ACCENT}" stroke-opacity="0.3" stroke-width="1.8" stroke-dasharray="9 11"/>`,
    `<line x1="740" y1="${base}" x2="${SAFE.x1}" y2="${base}" stroke="#FFFFFF" stroke-opacity="0.14" stroke-width="2"/>`,
  );
  stacks.forEach((s, i) => {
    const last = i === stacks.length - 1;
    const spongeY = base - s.sponge;
    const topY = spongeY - top;
    b.push(
      `<rect x="${s.x}" y="${spongeY}" width="${w}" height="${s.sponge}" rx="4" fill="${DOT_RING}" fill-opacity="${last ? 0.5 : 0.36}"/>`,
      `<rect x="${s.x}" y="${topY}" width="${w}" height="${top}" rx="4" fill="${last ? ACCENT : DOT_CORE}" fill-opacity="${last ? 0.85 : 0.5}"/>`,
    );
  });
  return wrap(b.join("\n"));
}

/* ─── 4. Липкі проти тензорних: два способи втримати мʼяч ─── */
function lypkiTenzorni() {
  const y = 600;
  const r = 44;
  const aX = 890; // панелі рознесені: у першій версії вони злипались в одну пляму
  const bX = 1200;
  const gap = 17; // просвіт під кулькою, у якому видно «нитки» прилипання
  return wrap(
    [
      // ⚠️ ореол ЗБОКУ від обох панелей. Коли він стояв за правою кулькою, акцентна
      // куля на акцентному світлі зливалась у пляму, і лінія прогину — головна деталь
      // правої панелі — була не видна взагалі.
      `<circle cx="1180" cy="360" r="200" fill="url(#halo)"/>`,
      // ⚠️ МʼЯЧ В ОБОХ ПАНЕЛЯХ ОДНАКОВИЙ — у цьому вся думка малюнка: тіло те саме,
      // різниться лише спосіб його втримати. Тому акцентом підсвічено не кульку,
      // а механізм: нитки прилипання ліворуч і прогин поверхні праворуч.
      // ЛІВОРУЧ: прилипання — поверхня пласка, мʼяч тримається зчепленням
      `<line x1="${aX - 118}" y1="${y}" x2="${aX + 118}" y2="${y}" stroke="${DOT_CORE}" stroke-opacity="0.55" stroke-width="3.5"/>`,
      ...[-24, -8, 8, 24].map(
        (dx) =>
          `<line x1="${aX + dx}" y1="${y - gap}" x2="${aX + dx}" y2="${y}" stroke="${ACCENT}" stroke-opacity="0.75" stroke-width="2.6"/>`,
      ),
      dot(aX, y - gap - r, r, 0.6),
      // ПРАВОРУЧ: продавлювання — поверхня прогинається, мʼяч тоне в лунці
      `<path d="M${bX - 128} ${y} Q ${bX - 74} ${y} ${bX - 52} ${y + 22} Q ${bX} ${y + 74} ${bX + 52} ${y + 22} Q ${bX + 74} ${y} ${bX + 128} ${y}" fill="none" stroke="${ACCENT}" stroke-opacity="0.85" stroke-width="4"/>`,
      dot(bX, y + 16, r, 0.6),
    ].join("\n"),
  );
}

const FILES = {
  "tenergy-dignics-cover.svg": tenergyDignics(),
  "novachok-cover.svg": novachok(),
  "tovshchyna-cover.svg": tovshchyna(),
  "lypki-tenzorni-cover.svg": lypkiTenzorni(),
};

for (const [name, svg] of Object.entries(FILES)) {
  writeFileSync(join(OUT, name), svg);
  console.log(`  ${name.padEnd(30)} ${(svg.length / 1024).toFixed(1)} kb`);
}
