// Міні-банер «Калькулятор рейтингу ФНТУ» для статті reityng-fntu
// → public/blog/fntu-calc-banner-{ua,ru}.svg
//
// Банер веде на калькулятор партнера fntu-rating.com.ua (обмін посиланнями, див.
// docs/partners/fntu-rating). Картка праворуч показує ПРИКЛАД ЗІ СТАТТІ, а числа на ній
// рахує цей скрипт за формулою ФНТУ (uttf.com.ua/docs/ranking-rules, 15.11.2025) — не руками:
// намальована цифра розійшлася б із розділом «formula» при першій правці прикладу.
// ⚠️ Міняєш приклад тут — міняй і текст та таблицю розділу «formula» в blog.ts (і навпаки).
//
// Палітра й шрифт — як у scripts/gen-care-diagram.mjs.
// Запуск: node scripts/gen-fntu-calc-banner.mjs
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "blog");

const BG = "#0E1117";
const CARD = "#161B22";
const GRID = "#212832";
const MUTED = "#8A93A0";
const TEXT = "#F2F4F7";
const ACCENT = "#E8FF47";
const FONT = "Oswald,'Arial Narrow',Arial,sans-serif";

/* ── Приклад зі статті й формула ФНТУ ── */
const EXAMPLE = { r: 30, n: 20, k: 1, wins: [34, 29, 25], losses: [40] };

/** Внесок зустрічі за правилами ФНТУ: очікуваний результат 2 / 1 / 0, несподіваний — (ΔR + 5) / 3. */
function contribution(winnerR, loserR) {
  const d = Math.abs(winnerR - loserR);
  if (winnerR >= loserR) return d <= 2 ? 2 : d <= 20 ? 1 : 0;
  return (d + 5) / 3;
}

function calc({ r, n, k, wins, losses }) {
  const P = wins.reduce((s, opp) => s + contribution(r, opp), 0);
  const S = losses.reduce((s, opp) => s + contribution(opp, r), 0);
  const delta = (k * (P - S) * 10) / Math.min(40, n + P + S);
  return { P, S, delta, r1: r + delta, n1: n + P + S };
}

const res = calc(EXAMPLE);
const num = (x) => (Math.round(x * 100) / 100).toFixed(2).replace(/0$/, "").replace(".", ",");
// Звірка з текстом статті: P = 6, S = 1, приріст ≈ +1,85, рейтинг 31,85, вага 27.
if (res.P !== 6 || res.S !== 1 || num(res.r1) !== "31,85" || res.n1 !== 27) {
  throw new Error(`Приклад розійшовся зі статтею: ${JSON.stringify(res)}`);
}

const T = {
  ua: {
    eyebrow: "ОНЛАЙН-ІНСТРУМЕНТ",
    title: ["КАЛЬКУЛЯТОР", "РЕЙТИНГУ ФНТУ"],
    sub: ["Рейтинг і вага після турніру", "за формулою ФНТУ"],
    label: "РЕЙТИНГ ПІСЛЯ ТУРНІРУ",
    weight: "ВАГА",
    note: `з ${EXAMPLE.r} · приклад зі статті`,
  },
  ru: {
    eyebrow: "ОНЛАЙН-ИНСТРУМЕНТ",
    title: ["КАЛЬКУЛЯТОР", "РЕЙТИНГА ФНТУ"],
    sub: ["Рейтинг и вес после турнира", "по формуле ФНТУ"],
    label: "РЕЙТИНГ ПОСЛЕ ТУРНИРА",
    weight: "ВЕС",
    note: `с ${EXAMPLE.r} · пример из статьи`,
  },
};

const W = 1200;
const H = 640;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function banner(t) {
  const cta = "fntu-rating.com.ua  →";
  const ctaW = 440;
  const card = { x: 760, y: 112, w: 380, h: 416 };
  const cx = card.x + 34;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${CARD}"/><stop offset="100%" stop-color="${BG}"/></linearGradient>
<radialGradient id="glow"><stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.22"/><stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<circle cx="${card.x + card.w / 2}" cy="${card.y + card.h / 2}" r="330" fill="url(#glow)"/>
<text x="64" y="112" fill="${MUTED}" font-size="26" letter-spacing="4">${esc(t.eyebrow)}</text>
<text x="64" y="208" fill="${TEXT}" font-size="76" font-weight="700">${esc(t.title[0])}</text>
<text x="64" y="294" fill="${ACCENT}" font-size="76" font-weight="700">${esc(t.title[1])}</text>
<text x="64" y="372" fill="${MUTED}" font-size="36">${esc(t.sub[0])}</text>
<text x="64" y="420" fill="${MUTED}" font-size="36">${esc(t.sub[1])}</text>
<rect x="64" y="470" width="${ctaW}" height="72" rx="36" fill="${ACCENT}"/>
<text x="${64 + ctaW / 2}" y="518" fill="${BG}" font-size="34" font-weight="700" text-anchor="middle">${esc(cta)}</text>
<rect x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" rx="28" fill="${BG}" stroke="${GRID}" stroke-width="2"/>
<text x="${cx}" y="${card.y + 66}" fill="${MUTED}" font-size="20" letter-spacing="1">${esc(t.label)}</text>
<text x="${cx}" y="${card.y + 186}" fill="${TEXT}" font-size="104" font-weight="700">${num(res.r1)}</text>
<rect x="${cx}" y="${card.y + 226}" width="132" height="52" rx="26" fill="${ACCENT}" fill-opacity="0.14"/>
<text x="${cx + 66}" y="${card.y + 262}" fill="${ACCENT}" font-size="30" font-weight="700" text-anchor="middle">+${num(res.delta)}</text>
<rect x="${cx + 148}" y="${card.y + 226}" width="150" height="52" rx="26" fill="${GRID}"/>
<text x="${cx + 223}" y="${card.y + 262}" fill="${TEXT}" font-size="28" text-anchor="middle">${esc(t.weight)} ${res.n1}</text>
<line x1="${cx}" y1="${card.y + 316}" x2="${card.x + card.w - 34}" y2="${card.y + 316}" stroke="${GRID}" stroke-width="2"/>
<text x="${cx}" y="${card.y + 362}" fill="${MUTED}" font-size="22">${esc(t.note)}</text>
</svg>
`;
}

for (const [locale, t] of Object.entries(T)) {
  const file = `fntu-calc-banner-${locale}.svg`;
  writeFileSync(join(OUT, file), banner(t));
  console.log(`  ${file}`);
}
console.log(`  приклад: P ${res.P}, S ${res.S}, приріст +${num(res.delta)}, рейтинг ${num(res.r1)}, вага ${res.n1}`);
