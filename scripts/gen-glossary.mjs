// Генерує src/data/glossaryData.ts зі звірених JSON словника.
//
// Запуск: node scripts/gen-glossary.mjs scripts/glossary
// У теці — по файлу на категорію (blades.json, rubbers.json, technique.json, rules.json, play.json),
// кожен { "terms": [ { slug, cat, term:{ua,ru}, aka:{ua:[],ru:[]}, def:{ua,ru}, href|null, sources:[] } ] }.
//
// Перевіряє: унікальність slug, допустимі категорії, обидві мови, довжину визначення, шлях href.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = process.argv[2];
if (!dir) {
  console.error("Вкажіть теку з JSON: node scripts/gen-glossary.mjs scripts/glossary");
  process.exit(1);
}
const CATS = new Set(["blades", "rubbers", "technique", "rules", "play"]);
const terms = [];
const seen = new Set();
const errors = [];
// Додаткові файли в тій самій теці: forms.json ({forms: {slug: {ua, ru, caseSensitive}}}) —
// словоформи для автопосилань; pages-*.json ({pages: [{slug, page}]}) — окремі сторінки термінів.
const forms = {};
const pages = {};
// guards — фрази, всередині яких термін НЕ лінкується («чоп-блок» ≠ «чоп», «Гранд Смеш» ≠ «смеш»).
const guards = { ua: [], ru: [] };
for (const f of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const json = JSON.parse(readFileSync(join(dir, f), "utf8"));
  if (json.forms) Object.assign(forms, json.forms);
  if (json.guards) for (const l of ["ua", "ru"]) guards[l].push(...(json.guards[l] ?? []));
  for (const p of json.pages ?? []) pages[p.slug] = p.page;
}
for (const f of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const { terms: list } = JSON.parse(readFileSync(join(dir, f), "utf8"));
  if (!list) continue;
  for (const t of list) {
    const where = `${f}:${t.slug}`;
    if (!/^[a-z0-9-]+$/.test(t.slug ?? "")) errors.push(`${where}: поганий slug`);
    if (seen.has(t.slug)) errors.push(`${where}: дубль slug`);
    seen.add(t.slug);
    if (!CATS.has(t.cat)) errors.push(`${where}: невідома категорія ${t.cat}`);
    for (const l of ["ua", "ru"]) {
      if (!t.term?.[l]) errors.push(`${where}: немає term.${l}`);
      if (!t.def?.[l]) errors.push(`${where}: немає def.${l}`);
      else if (t.def[l].length > 420) errors.push(`${where}: def.${l} задовге (${t.def[l].length})`);
    }
    if (t.href != null && !/^\/[a-z0-9/-]*$/.test(t.href)) errors.push(`${where}: href має бути шляхом без локалі`);
    terms.push({
      slug: t.slug,
      cat: t.cat,
      term: { ua: t.term.ua, ru: t.term.ru },
      aka: { ua: t.aka?.ua ?? [], ru: t.aka?.ru ?? [] },
      def: { ua: t.def.ua, ru: t.def.ru },
      href: t.href ?? null,
      sources: t.sources ?? [],
      ...(forms[t.slug] ? { forms: forms[t.slug] } : {}),
      ...(pages[t.slug] ? { page: pages[t.slug] } : {}),
    });
  }
}
for (const slug of [...Object.keys(forms), ...Object.keys(pages)]) {
  if (!seen.has(slug)) errors.push(`forms/pages: немає терміна ${slug}`);
}
for (const [slug, p] of Object.entries(pages)) {
  for (const l of ["ua", "ru"]) {
    if ((p.metaTitle?.[l] ?? "").length > 60) errors.push(`page ${slug}: metaTitle.${l} > 60`);
    const d = (p.metaDescription?.[l] ?? "").length;
    if (d < 110 || d > 158) errors.push(`page ${slug}: metaDescription.${l} ${d} поза 110–158`);
  }
  if (p.body.ua.length !== p.body.ru.length) errors.push(`page ${slug}: різна кількість абзаців`);
  for (const r of p.related ?? []) if (!seen.has(r)) errors.push(`page ${slug}: related ${r} не існує`);
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
const out = `// АВТОГЕНЕРОВАНО scripts/gen-glossary.mjs — не правити руками, правити JSON у scripts/glossary.
import type { GlossaryTerm } from "@/data/glossary";

export const GLOSSARY_DATA: GlossaryTerm[] = ${JSON.stringify(terms, null, 2)};

export const GLOSSARY_GUARDS: { ua: string[]; ru: string[] } = ${JSON.stringify(guards, null, 2)};
`;
writeFileSync(join(ROOT, "src/data/glossaryData.ts"), out);
console.log(`  термінів: ${terms.length} (автопосилань: ${Object.keys(forms).length}, окремих сторінок: ${Object.keys(pages).length}) → src/data/glossaryData.ts`);
