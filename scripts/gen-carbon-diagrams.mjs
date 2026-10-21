// Схеми для статті alc-chy-zlc («Карбонові основи: ALC чи ZLC, inner чи outer»)
// → public/blog/karbon-shary-{ua,ru}.svg     — будова: волокно під поверхнею (outer) і біля ядра (inner)
// → public/blog/karbon-matrytsia-{ua,ru}.svg — карта основ: реакція × вібрація
//
// ⚠️ ЧИСЛА — ОФІЦІЙНІ «Reaction property / Vibration property» з карток butterfly-global.com
// (дані Butterfly R&D, станом на 2026). Ті самі числа лежать у src/data/catalog/bases.ts (base.reaction /
// base.vibration) і в таблицях статті — міняєш тут, міняй і там. Порівнювати їх можна лише між
// основами Butterfly: це шкала виробника, а не універсальна одиниця.
//
// Запуск: node scripts/gen-carbon-diagrams.mjs
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "blog");

const BG = "#0E1117";
const CARD = "#161B22";
const GRID = "#212832";
const DIM = "#39424E";
const MUTED = "#8A93A0";
const TEXT = "#F2F4F7";
const ACCENT = "#E8FF47";
const WOOD_A = "#C9A06A"; // поверхневий шпон
const WOOD_B = "#A87F4F"; // другий шар
const WOOD_C = "#E2C99B"; // ядро
const FONT = "Oswald,'Arial Narrow',Arial,sans-serif";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const num = (v) => v.toFixed(1).replace(".", ",");

/* ───────────── 1. Будова: outer vs inner ───────────── */

const L1 = {
  ua: {
    title: "ДЕ ЛЕЖИТЬ ВОЛОКНО: OUTER ЧИ INNER",
    outer: "OUTER — під поверхневим шпоном",
    inner: "INNER — біля ядра (Innerforce)",
    a: "поверхневий шпон",
    b: "другий шар",
    c: "ядро",
    f: "волокно",
    outerNote: ["швидший удар, відчуття волокна", "приклад: Viscaria (ALC) — 11,8 / 10,3"],
    innerNote: ["довше утримання мʼяча, мʼякше", "приклад: Innerforce Layer ALC — 10,7 / 9,4"],
    legend: "реакція / вібрація — офіційні числа Butterfly",
    source: "Будова й опис — за Butterfly (Outerfiber™ / Innerfiber™); товщина шарів умовна",
  },
  ru: {
    title: "ГДЕ ЛЕЖИТ ВОЛОКНО: OUTER ИЛИ INNER",
    outer: "OUTER — под поверхностным шпоном",
    inner: "INNER — у ядра (Innerforce)",
    a: "поверхностный шпон",
    b: "второй слой",
    c: "ядро",
    f: "волокно",
    outerNote: ["более быстрый удар, ощущение волокна", "пример: Viscaria (ALC) — 11,8 / 10,3"],
    innerNote: ["дольше удержание мяча, мягче", "пример: Innerforce Layer ALC — 10,7 / 9,4"],
    legend: "реакция / вибрация — официальные числа Butterfly",
    source: "Строение и описание — по Butterfly (Outerfiber™ / Innerfiber™); толщина слоёв условная",
  },
};

function layers(lang) {
  const t = L1[lang];
  const W = 1200;
  const H = 560;
  const b = [];
  b.push(`<rect width="${W}" height="${H}" fill="${BG}"/>`);
  b.push(`<text x="60" y="64" fill="${TEXT}" font-size="30" font-weight="700" letter-spacing="1">${esc(t.title)}</text>`);
  b.push(`<line x1="60" y1="84" x2="1140" y2="84" stroke="${GRID}"/>`);

  // Шари зверху вниз: A, B, C, B, A (+ волокно в різних місцях). Висоти умовні.
  const outerStack = [["a", 30], ["f", 10], ["b", 34], ["c", 90], ["b", 34], ["f", 10], ["a", 30]];
  const innerStack = [["a", 30], ["b", 34], ["f", 10], ["c", 90], ["f", 10], ["b", 34], ["a", 30]];
  const color = { a: WOOD_A, b: WOOD_B, c: WOOD_C, f: "#1A1D22" };

  const draw = (stack, x, y, head, notes) => {
    const w = 420;
    b.push(`<text x="${x}" y="${y - 22}" fill="${ACCENT}" font-size="20" font-weight="700">${esc(head)}</text>`);
    let yy = y;
    for (const [k, h] of stack) {
      if (k === "f") {
        b.push(`<rect x="${x}" y="${yy}" width="${w}" height="${h}" fill="${color.f}" stroke="${ACCENT}" stroke-width="1.5"/>`);
        // штрихування «тканини» волокна
        for (let i = 0; i < w; i += 12) b.push(`<line x1="${x + i}" y1="${yy}" x2="${x + i + 8}" y2="${yy + h}" stroke="${ACCENT}" stroke-opacity="0.55" stroke-width="1"/>`);
      } else {
        b.push(`<rect x="${x}" y="${yy}" width="${w}" height="${h}" fill="${color[k]}"/>`);
        // текстура деревини
        for (let i = 1; i < 3; i++) b.push(`<line x1="${x}" y1="${yy + (h * i) / 3}" x2="${x + w}" y2="${yy + (h * i) / 3 + 2}" stroke="#000" stroke-opacity="0.08"/>`);
      }
      yy += h;
    }
    b.push(`<rect x="${x}" y="${y}" width="${w}" height="${yy - y}" fill="none" stroke="${TEXT}" stroke-opacity="0.4"/>`);
    notes.forEach((n, i) => b.push(`<text x="${x}" y="${yy + 36 + i * 24}" fill="${i ? MUTED : TEXT}" font-size="${i ? 15 : 17}">${esc(n)}</text>`));
    return yy;
  };
  const y0 = 150;
  draw(outerStack, 70, y0, t.outer, t.outerNote);
  draw(innerStack, 640, y0, t.inner, t.innerNote);

  // підписи шарів між двома розрізами
  const labels = [[y0 + 12, t.a], [y0 + 36, t.f], [y0 + 58, t.b], [y0 + 119, t.c]];
  for (const [ly, txt] of labels) b.push(`<text x="565" y="${ly + 5}" fill="${MUTED}" font-size="12" text-anchor="middle">${esc(txt)}</text>`);

  b.push(`<text x="60" y="${H - 50}" fill="${MUTED}" font-size="14">${esc(t.legend)}</text>`);
  b.push(`<text x="60" y="${H - 24}" fill="${DIM}" font-size="13">${esc(t.source)}</text>`);
  b.push(`<text x="1140" y="${H - 24}" fill="${DIM}" font-size="13" text-anchor="end">ttmax.com.ua</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT}">\n${b.join("\n")}\n</svg>\n`;
}

/* ───────────── 2. Карта основ: реакція × вібрація ───────────── */

const FAM = {
  alc: { color: ACCENT, ua: "ALC", ru: "ALC" },
  salc: { color: "#B6F24A", ua: "Super ALC", ru: "Super ALC" },
  zlc: { color: "#5AA9FF", ua: "ZLC", ru: "ZLC" },
  szlc: { color: "#B48CFF", ua: "Super ZLC", ru: "Super ZLC" },
  cnf: { color: "#3DDC97", ua: "CNF", ru: "CNF" },
  caf: { color: "#FF9F43", ua: "CAF", ru: "CAF" },
  t5000: { color: "#C8CDD3", ua: "T5000 (карбон)", ru: "T5000 (карбон)" },
};

/** [назва, родина, реакція, вібрація, inner?, dx, dy, anchor] — dx/dy розводять підписи. */
const PTS = [
  ["Viscaria · Timo Boll ALC · Fan Zhendong ALC", "alc", 11.8, 10.3, false, -12, 22, "end"],
  ["Outerforce ALC", "alc", 11.4, 10.4, false, -12, 4, "end"],
  ["Freitas ALC", "alc", 11.4, 10.8, false, -12, 4, "end"],
  ["Ovtcharov Innerforce ALC", "alc", 11.7, 10.5, true, -12, -8, "end"],
  ["Innerforce Layer ALC · Harimoto ALC", "alc", 10.7, 9.4, true, 12, 4, "start"],
  ["Innerforce Layer ALC.S", "alc", 10.1, 8.4, true, 12, 4, "start"],
  ["Viscaria Super ALC · Fan Zhendong Super ALC", "salc", 12.1, 10.1, false, 12, 20, "start"],
  ["Harimoto Innerforce Super ALC", "salc", 11.4, 9.5, true, 12, 18, "start"],
  ["Timo Boll ZLC · Fan Zhendong ZLC", "zlc", 11.7, 10.8, false, 12, 4, "start"],
  ["Mizutani ZLC", "zlc", 11.8, 11.2, false, 0, -14, "middle"],
  ["Outerforce ZLC", "zlc", 11.3, 11.1, false, -12, 4, "end"],
  ["Innerforce Layer ZLC · Franziska · Apolonia", "zlc", 10.5, 9.5, true, -12, -10, "end"],
  ["Fan Zhendong · Lin Yun-Ju Super ZLC", "szlc", 12.3, 11.1, false, 12, 4, "start"],
  ["Mizutani Super ZLC", "szlc", 12.5, 11.6, false, -12, -6, "end"],
  ["Harimoto Innerforce Super ZLC", "szlc", 12.0, 10.5, true, 12, 15, "start"],
  ["Omar Assar Innerforce ZLC", "zlc", 12.0, 10.6, true, 12, 3, "start"],
  ["Revoldia CNF · Fan Zhendong CNF", "cnf", 11.7, 9.5, false, 12, 4, "start"],
  ["Outerforce CAF", "caf", 11.3, 9.1, false, 12, 14, "start"],
  ["Timo Boll CAF", "caf", 10.6, 10.4, false, 12, 18, "start"],
  ["Primorac Carbon", "t5000", 12.5, 13.3, false, -12, 4, "end"],
  ["SK Carbon", "t5000", 10.5, 10.5, false, -12, -4, "end"],
];

const L2 = {
  ua: {
    title: "КАРТА КАРБОНОВИХ ОСНОВ BUTTERFLY",
    x: "реакція (швидкість) →",
    y: "вібрація (жорсткість відчуття) →",
    outer: "outer",
    inner: "inner",
    note: "Офіційні числа Butterfly (Reaction / Vibration property). Порівнюються лише між основами Butterfly.",
  },
  ru: {
    title: "КАРТА КАРБОНОВЫХ ОСНОВАНИЙ BUTTERFLY",
    x: "реакция (скорость) →",
    y: "вибрация (жёсткость ощущения) →",
    outer: "outer",
    inner: "inner",
    note: "Официальные числа Butterfly (Reaction / Vibration property). Сравниваются только между основаниями Butterfly.",
  },
};

function matrix(lang) {
  const t = L2[lang];
  const W = 1200;
  const H = 800;
  const px0 = 130;
  const px1 = 1080;
  const py0 = 640;
  const py1 = 120;
  const xMin = 9.9;
  const xMax = 12.7;
  const yMin = 8.2;
  const yMax = 13.5;
  const X = (v) => px0 + ((v - xMin) / (xMax - xMin)) * (px1 - px0);
  const Y = (v) => py0 - ((v - yMin) / (yMax - yMin)) * (py0 - py1);
  const b = [];
  b.push(`<rect width="${W}" height="${H}" fill="${BG}"/>`);
  b.push(`<text x="60" y="64" fill="${TEXT}" font-size="30" font-weight="700" letter-spacing="1">${esc(t.title)}</text>`);
  b.push(`<line x1="60" y1="84" x2="1140" y2="84" stroke="${GRID}"/>`);
  // сітка
  for (let v = 10; v <= 12.5 + 1e-9; v += 0.5) {
    b.push(`<line x1="${X(v)}" y1="${py1}" x2="${X(v)}" y2="${py0}" stroke="${GRID}"/>`);
    b.push(`<text x="${X(v)}" y="${py0 + 22}" fill="${MUTED}" font-size="13" text-anchor="middle">${num(v)}</text>`);
  }
  for (let v = 8.5; v <= 13.5 + 1e-9; v += 1) {
    b.push(`<line x1="${px0}" y1="${Y(v)}" x2="${px1}" y2="${Y(v)}" stroke="${GRID}"/>`);
    b.push(`<text x="${px0 - 12}" y="${Y(v) + 5}" fill="${MUTED}" font-size="13" text-anchor="end">${num(v)}</text>`);
  }
  b.push(`<rect x="${px0}" y="${py1}" width="${px1 - px0}" height="${py0 - py1}" fill="none" stroke="${DIM}"/>`);
  b.push(`<text x="${(px0 + px1) / 2}" y="${py0 + 50}" fill="${TEXT}" font-size="15" text-anchor="middle">${esc(t.x)}</text>`);
  b.push(`<text x="70" y="${(py0 + py1) / 2}" fill="${TEXT}" font-size="15" text-anchor="middle" transform="rotate(-90 70 ${(py0 + py1) / 2})">${esc(t.y)}</text>`);

  for (const [name, fam, r, v, inner, dx, dy, anchor] of PTS) {
    const c = FAM[fam].color;
    const cx = X(r);
    const cy = Y(v);
    b.push(
      inner
        ? `<circle cx="${cx}" cy="${cy}" r="7" fill="${BG}" stroke="${c}" stroke-width="3"/>`
        : `<circle cx="${cx}" cy="${cy}" r="7" fill="${c}"/>`,
    );
    b.push(`<text x="${cx + dx}" y="${cy + dy}" fill="${TEXT}" font-size="13" text-anchor="${anchor}" opacity="0.92">${esc(name)}</text>`);
  }

  // легенда під графіком, в один рядок: справа лишається місце для підписів точок
  let lx = px0;
  const ly = py0 + 92;
  for (const f of Object.values(FAM)) {
    b.push(`<circle cx="${lx}" cy="${ly - 5}" r="7" fill="${f.color}"/>`);
    b.push(`<text x="${lx + 14}" y="${ly}" fill="${TEXT}" font-size="15">${esc(f[lang])}</text>`);
    lx += 34 + f[lang].length * 8.5;
  }
  lx += 20;
  b.push(`<circle cx="${lx}" cy="${ly - 5}" r="7" fill="${MUTED}"/>`);
  b.push(`<text x="${lx + 14}" y="${ly}" fill="${MUTED}" font-size="15">${esc(t.outer)}</text>`);
  lx += 80;
  b.push(`<circle cx="${lx}" cy="${ly - 5}" r="7" fill="${BG}" stroke="${MUTED}" stroke-width="3"/>`);
  b.push(`<text x="${lx + 14}" y="${ly}" fill="${MUTED}" font-size="15">${esc(t.inner)}</text>`);

  b.push(`<text x="60" y="${H - 24}" fill="${MUTED}" font-size="13">${esc(t.note)}</text>`);
  b.push(`<text x="1140" y="${H - 24}" fill="${DIM}" font-size="13" text-anchor="end">ttmax.com.ua</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT}">\n${b.join("\n")}\n</svg>\n`;
}

for (const lang of ["ua", "ru"]) {
  for (const [name, fn] of [["karbon-shary", layers], ["karbon-matrytsia", matrix]]) {
    const out = fn(lang);
    writeFileSync(join(OUT, `${name}-${lang}.svg`), out);
    console.log(`  ${name}-${lang}.svg ${(out.length / 1024).toFixed(1)} kb`);
  }
}
