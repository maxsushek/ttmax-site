// Генерує src/data/playerProfilesData.ts із перевірених JSON (по файлу на гравця).
// JSON — результат ресерчу + окремої перевірки фактів (формат — тип PlayerProfile у playerProfiles.ts
// плюс службове поле openQuestions, яке сюди НЕ потрапляє).
//
// Запуск: node scripts/gen-player-profiles.mjs <тека з JSON>
// Скрипт падає, якщо: slug немає в players.ts; товар не існує в каталозі; UA/RU різної довжини;
// дата asOf не ISO. Так помилка ловиться до збірки, а не на проді.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = process.argv[2];
if (!dir) {
  console.error("usage: node scripts/gen-player-profiles.mjs <dir-with-json>");
  process.exit(1);
}

const players = readFileSync(join(ROOT, "src/data/players.ts"), "utf8");
const catalog =
  readFileSync(join(ROOT, "src/data/catalog/bases.ts"), "utf8") + readFileSync(join(ROOT, "src/data/catalog/products.ts"), "utf8");
const productExists = (slug) => catalog.includes(`"slug": "${slug}"`) || catalog.includes(`slug: "${slug}"`);

const errors = [];
const out = {};
for (const f of readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
  const d = JSON.parse(readFileSync(join(dir, f), "utf8"));
  const where = d.slug ?? f;
  if (!players.includes(`"${d.slug}": {`)) errors.push(`${where}: slug немає в players.ts`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.equipment?.asOf ?? "")) errors.push(`${where}: equipment.asOf не YYYY-MM-DD`);
  for (const k of ["blade", "fh", "bh"]) {
    const it = d.equipment?.[k];
    if (it?.product && !productExists(it.product)) errors.push(`${where}: товару ${it.product} немає в каталозі`);
  }
  if ((d.bio?.ua?.length ?? 0) !== (d.bio?.ru?.length ?? -1)) errors.push(`${where}: bio ua/ru різної довжини`);
  if (!d.summary?.ua || !d.summary?.ru) errors.push(`${where}: немає summary`);
  delete d.openQuestions;
  d.history ??= [];
  d.faq ??= [];
  out[d.slug] = d;
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const body = `// Згенеровано scripts/gen-player-profiles.mjs із перевірених JSON. Див. playerProfiles.ts.
// Не правте вручну без потреби: при перегенерації правки затруться.
import type { PlayerProfile } from "@/data/playerProfiles";
import type { PlayerSlug } from "@/data/players";

export const PROFILES_DATA: Partial<Record<PlayerSlug, PlayerProfile>> = ${JSON.stringify(out, null, 2)};
`;
writeFileSync(join(ROOT, "src/data/playerProfilesData.ts"), body);
console.log(`  гравців: ${Object.keys(out).length} → src/data/playerProfilesData.ts`);
