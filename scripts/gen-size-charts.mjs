// Генерує src/data/sizeChartsData.ts зі звіреного JSON розмірної сітки.
//
// Запуск: node scripts/gen-size-charts.mjs scripts/size-charts
// У теці: data.json — { checked, page, sections, charts, models } (формат — тип SizeChartsData
// у src/data/sizeCharts.ts). Числа в таблицях — як в офіційному джерелі Butterfly, без перерахунків.
//
// Скрипт падає, якщо: id таблиці не унікальний; у рядку немає значення для колонки або є зайвий
// ключ; немає джерела; розділ посилається на неіснуючу таблицю; таблиця не показується ніде (ні в
// розділі сторінки, ні на картці моделі); slug моделі не знайдено в каталозі; моделі призначено
// таблицю для іншого типу товару (кросівкам — сітку футболок); title/description поза нормою;
// ua/ru різної довжини.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = process.argv[2];
if (!dir) {
  console.error("Вкажіть теку з data.json: node scripts/gen-size-charts.mjs scripts/size-charts");
  process.exit(1);
}
const d = JSON.parse(readFileSync(join(dir, "data.json"), "utf8"));

// slug → gearType із каталогу (gear.ts читаємо як текст: у записі спершу slug, далі gearType).
const gearTypeBySlug = new Map();
{
  const gear = readFileSync(join(ROOT, "src/data/catalog/gear.ts"), "utf8");
  const re = /^\s+slug: "([^"]+)",|^\s+gearType: "([^"]+)",/gm;
  let slug = null;
  for (const m of gear.matchAll(re)) {
    if (m[1]) slug = m[1];
    else if (m[2] && slug && !gearTypeBySlug.has(slug)) gearTypeBySlug.set(slug, m[2]);
  }
}

const errors = [];
const both = (v, where) => {
  if (!v || typeof v.ua !== "string" || typeof v.ru !== "string" || !v.ua.trim() || !v.ru.trim())
    errors.push(`${where}: потрібні непорожні ua і ru`);
};

if (!/^\d{4}-\d{2}-\d{2}$/.test(d.checked ?? "")) errors.push("checked: потрібна дата YYYY-MM-DD");

// Сторінка
const p = d.page ?? {};
for (const k of ["metaTitle", "metaDescription", "h1", "howToTitle"]) both(p[k], `page.${k}`);
for (const l of ["ua", "ru"]) {
  const t = p.metaTitle?.[l] ?? "";
  if (t.length > 60 || !t.endsWith(" | TTMAX")) errors.push(`page.metaTitle.${l}: ${t.length} символів, має бути ≤60 і закінчуватися « | TTMAX»`);
  const m = p.metaDescription?.[l] ?? "";
  if (m.length < 110 || m.length > 158) errors.push(`page.metaDescription.${l}: ${m.length} символів, має бути 110–158`);
}
if ((p.intro?.ua?.length ?? 0) === 0 || p.intro.ua.length !== p.intro?.ru?.length) errors.push("page.intro: ua/ru різної довжини або порожньо");
for (const [i, s] of (p.howTo ?? []).entries()) {
  both(s.name, `page.howTo[${i}].name`);
  both(s.text, `page.howTo[${i}].text`);
}
for (const [i, f] of (p.faq ?? []).entries()) {
  both(f.q, `page.faq[${i}].q`);
  both(f.a, `page.faq[${i}].a`);
}

// Таблиці
const charts = new Map();
for (const c of d.charts ?? []) {
  const where = `chart ${c.id}`;
  if (!/^[a-z0-9-]+$/.test(c.id ?? "")) errors.push(`${where}: поганий id`);
  if (charts.has(c.id)) errors.push(`${where}: дубль id`);
  charts.set(c.id, c);
  both(c.title, `${where}.title`);
  both(c.lead, `${where}.lead`);
  if (c.note != null) both(c.note, `${where}.note`);
  const keys = (c.columns ?? []).map((col) => col.key);
  if (keys.length < 2) errors.push(`${where}: потрібно щонайменше 2 колонки`);
  if (new Set(keys).size !== keys.length) errors.push(`${where}: дубль ключа колонки`);
  for (const col of c.columns ?? []) both(col.label, `${where}.columns.${col.key}`);
  if (!(c.rows?.length > 0)) errors.push(`${where}: немає рядків`);
  for (const [i, r] of (c.rows ?? []).entries()) {
    for (const k of keys) if (typeof r[k] !== "string" || !r[k].trim()) errors.push(`${where}.rows[${i}]: немає значення «${k}»`);
    for (const k of Object.keys(r)) if (!keys.includes(k)) errors.push(`${where}.rows[${i}]: зайвий ключ «${k}»`);
  }
  if (!(c.sources?.length > 0)) errors.push(`${where}: немає джерел`);
  for (const s of c.sources ?? []) {
    both(s.label, `${where}.sources.label`);
    if (!/^https:\/\//.test(s.url ?? "")) errors.push(`${where}: джерело без https-адреси`);
    if (typeof s.official !== "boolean") errors.push(`${where}: sources.official має бути true/false`);
    if (s.snapshot != null && !/^\d{4}-\d{2}-\d{2}$/.test(s.snapshot)) errors.push(`${where}: snapshot не YYYY-MM-DD`);
    if (s.archiveUrl != null && !/^https:\/\/web\.archive\.org\/web\/\d{14}\//.test(s.archiveUrl))
      errors.push(`${where}: archiveUrl має бути копією web.archive.org з міткою часу`);
    if ((s.archiveUrl != null) !== (s.snapshot != null)) errors.push(`${where}: archiveUrl і snapshot задаються разом`);
    // Дата копії мусить збігатися з міткою часу в адресі архіву.
    if (s.archiveUrl && s.snapshot && !s.archiveUrl.includes(`/web/${s.snapshot.replaceAll("-", "")}`))
      errors.push(`${where}: дата snapshot не збігається з міткою часу в archiveUrl`);
  }
  if (!Array.isArray(c.gearTypes) || c.gearTypes.length === 0) errors.push(`${where}: gearTypes має бути непорожнім масивом`);
}

// Розділи
const inSections = new Set();
const anchors = new Set(["faq", "yak-obraty-rozmir"]);
for (const s of d.sections ?? []) {
  if (!/^[a-z0-9-]+$/.test(s.id ?? "")) errors.push(`section ${s.id}: поганий id`);
  if (anchors.has(s.id) || charts.has(s.id)) errors.push(`section ${s.id}: id збігається з іншим якорем`);
  anchors.add(s.id);
  both(s.title, `section ${s.id}.title`);
  if (s.text != null) both(s.text, `section ${s.id}.text`);
  for (const id of s.charts ?? []) {
    if (!charts.has(id)) errors.push(`section ${s.id}: немає таблиці ${id}`);
    if (inSections.has(id)) errors.push(`section ${s.id}: таблиця ${id} вже є в іншому розділі`);
    inSections.add(id);
  }
  for (const lnk of s.links ?? []) {
    both(lnk.label, `section ${s.id}.links.label`);
    if (!/^\/[a-z0-9/-]+$/.test(lnk.href ?? "")) errors.push(`section ${s.id}: посилання має бути шляхом без локалі (${lnk.href})`);
  }
}
// Таблиця мусить десь показуватися: у розділі сторінки або на картці моделі (таблиці замірів
// окремих моделей японської колекції живуть лише на картках і в llms-файлі).
const usedByModels = new Set(Object.values(d.models ?? {}).flatMap((m) => m.charts ?? []));
for (const id of charts.keys()) {
  if (!inSections.has(id) && !usedByModels.has(id)) errors.push(`chart ${id}: немає ні в розділі сторінки, ні на картці моделі`);
  if (anchors.has(id)) errors.push(`chart ${id}: id збігається з якорем розділу`);
}

// Моделі: таблиця призначається лише товару того типу, для якого вона складена.
for (const [slug, m] of Object.entries(d.models ?? {})) {
  const type = gearTypeBySlug.get(slug);
  if (!type) {
    errors.push(`models: товару ${slug} немає в каталозі екіпірування`);
    continue;
  }
  if (!Array.isArray(m.charts)) errors.push(`models.${slug}: charts має бути масивом`);
  if ((m.charts ?? []).length === 0 && m.note == null) errors.push(`models.${slug}: ні таблиць, ні примітки — запис зайвий`);
  for (const id of m.charts ?? []) {
    const c = charts.get(id);
    if (!c) errors.push(`models.${slug}: немає таблиці ${id}`);
    else if (!c.gearTypes.includes(type)) errors.push(`models.${slug}: таблиця ${id} не для типу «${type}»`);
  }
  if (m.note != null) both(m.note, `models.${slug}.note`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const data = {
  checked: d.checked,
  page: {
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
    h1: p.h1,
    intro: p.intro,
    howTo: (p.howTo ?? []).map((s) => ({ name: s.name, text: s.text })),
    howToTitle: p.howToTitle,
    faq: (p.faq ?? []).map((f) => ({ q: f.q, a: f.a })),
  },
  sections: (d.sections ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    text: s.text ?? null,
    charts: s.charts ?? [],
    links: (s.links ?? []).map((lnk) => ({ label: lnk.label, href: lnk.href })),
  })),
  charts: d.charts.map((c) => ({
    id: c.id,
    title: c.title,
    lead: c.lead,
    columns: c.columns.map((col) => ({ key: col.key, label: col.label })),
    rows: c.rows,
    note: c.note ?? null,
    sources: c.sources.map((s) => ({
      label: s.label,
      url: s.url,
      official: s.official,
      snapshot: s.snapshot ?? null,
      archiveUrl: s.archiveUrl ?? null,
    })),
    gearTypes: c.gearTypes,
  })),
  models: Object.fromEntries(
    Object.entries(d.models ?? {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([slug, m]) => [slug, { charts: m.charts ?? [], note: m.note ?? null }]),
  ),
};

const out = `// АВТОГЕНЕРОВАНО scripts/gen-size-charts.mjs — не правити руками, правити scripts/size-charts/data.json.
import type { SizeChartsData } from "@/data/sizeCharts";

export const SIZE_CHARTS_DATA: SizeChartsData = ${JSON.stringify(data, null, 2)};
`;
writeFileSync(join(ROOT, "src/data/sizeChartsData.ts"), out);
console.log(
  `  таблиць: ${data.charts.length}, розділів: ${data.sections.length}, моделей із таблицею: ${Object.keys(data.models).length} → src/data/sizeChartsData.ts`,
);
