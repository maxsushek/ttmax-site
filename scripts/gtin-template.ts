// scripts/gtin-template.ts
// Штрихкоди товарів: шаблон для заповнення і імпорт назад у src/data/catalog/gtin.ts.
//
//   npx tsx scripts/gtin-template.ts > gtin.csv          — CSV з усіма ключами фіду
//   npx tsx scripts/gtin-template.ts --import gtin.csv   — перевірити коди й записати gtin.ts
//
// Колонки CSV: category;key;name;variant;gtin. Заповнювати лише колонку gtin — кодом
// зі штрихкоду на упаковці або з накладної постачальника (див. шапку gtin.ts).
// Роздільник «;» — щоб Excel/Numbers з українською локаллю відкрили файл без майстра імпорту.
import { readFileSync, writeFileSync } from "node:fs";
import { getAllProducts } from "../src/data/catalog";
import { GTIN, gtinKey, isValidGtin } from "../src/data/catalog/gtin";

const GTIN_FILE = new URL("../src/data/catalog/gtin.ts", import.meta.url);

type Row = { category: string; key: string; name: string; variant: string };

/** Ті самі гілки, що в buildMerchantItems: варіант накладки → розмір → розфарбування → товар. */
function rows(): Row[] {
  const out: Row[] = [];
  for (const p of getAllProducts()) {
    if (p.kind === "racket") continue; // збірка — набір, власного штрихкоду немає
    const base = { category: p.categorySlug, name: p.name.ua };
    const rubber = p.variants.filter((v) => typeof v.price === "number" && v.price > 0);
    if (rubber.length > 1) {
      for (const v of rubber)
        out.push({ ...base, key: gtinKey(p.slug, v.thickness, v.color), variant: `${v.thickness} ${v.color}` });
      continue;
    }
    const sizes = p.gear?.sizes ?? [];
    if (sizes.length > 1) {
      for (const s of sizes) out.push({ ...base, key: gtinKey(p.slug, s), variant: s });
      continue;
    }
    const colorways = p.gear?.colorways ?? [];
    if (colorways.length > 1) {
      for (const c of colorways) out.push({ ...base, key: gtinKey(p.slug, c.ua), variant: c.ua });
      continue;
    }
    const handles = p.base?.handles ?? [];
    out.push({
      ...base,
      key: gtinKey(p.slug),
      // Основа з кількома ручками — у кожної свій код, а у фіді рядок один (див. gtin.ts).
      variant: handles.length > 1 ? `ручки ${handles.join("/")}: код лише якщо продаємо одну` : "",
    });
  }
  return out;
}

const cell = (s: string) => (/[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

function exportCsv() {
  const lines = ["category;key;name;variant;gtin"];
  for (const r of rows()) lines.push([r.category, r.key, r.name, r.variant, GTIN[r.key] ?? ""].map(cell).join(";"));
  process.stdout.write(lines.join("\n") + "\n");
}

function parseCsv(text: string): string[][] {
  return text
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => {
      const cells: string[] = [];
      let cur = "";
      let q = false;
      for (let i = 0; i < l.length; i++) {
        const ch = l[i]!;
        if (q) {
          if (ch === '"' && l[i + 1] === '"') (cur += '"'), i++;
          else if (ch === '"') q = false;
          else cur += ch;
        } else if (ch === '"') q = true;
        else if (ch === ";" || ch === ",") cells.push(cur), (cur = "");
        else cur += ch;
      }
      cells.push(cur);
      return cells.map((c) => c.trim());
    });
}

function importCsv(path: string) {
  const known = new Set(rows().map((r) => r.key));
  const [head, ...body] = parseCsv(readFileSync(path, "utf8"));
  const ki = head!.indexOf("key");
  const gi = head!.indexOf("gtin");
  if (ki < 0 || gi < 0) throw new Error("У CSV мають бути колонки key і gtin");

  const codes = new Map<string, string>();
  const problems: string[] = [];
  const seen = new Map<string, string>();
  for (const r of body) {
    const key = r[ki] ?? "";
    // Excel любить перетворювати 13 цифр на 4,9069E+12 — такий рядок одразу видно тут.
    const code = (r[gi] ?? "").replace(/\s+/g, "");
    if (!code) continue;
    if (!known.has(key)) problems.push(`невідомий ключ: ${key}`);
    else if (!isValidGtin(code)) problems.push(`хибна контрольна цифра або формат: ${key} = ${code}`);
    else if (seen.has(code)) problems.push(`той самий код у двох рядках: ${seen.get(code)} і ${key} = ${code}`);
    else codes.set(key, code), seen.set(code, key);
  }
  if (problems.length) {
    console.error(problems.join("\n"));
    console.error(`\nНе записано: ${problems.length} проблем. Виправте CSV і запустіть ще раз.`);
    process.exit(1);
  }

  const src = readFileSync(GTIN_FILE, "utf8");
  const body2 = [...codes].map(([k, c]) => `  ${JSON.stringify(k)}: ${JSON.stringify(c)},`).join("\n");
  const next = src.replace(
    /(export const GTIN: Readonly<Record<string, string>> = \{\n)[\s\S]*?(\n\};)/,
    `$1${body2 || '  // "dignics-05__2.1__red": "4906901199811",'}$2`,
  );
  writeFileSync(GTIN_FILE, next);
  console.log(`Записано ${codes.size} кодів у src/data/catalog/gtin.ts`);
}

const i = process.argv.indexOf("--import");
if (i > 0) importCsv(process.argv[i + 1] ?? "");
else exportCsv();
