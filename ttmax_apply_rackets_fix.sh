#!/usr/bin/env bash
# ttmax_apply_rackets_fix.sh — доопрацювання збірних ракеток:
#  1) ціни/сітка на /butterfly/rakety (маршрут brandCategory)
#  2) пункт меню «Готові ракетки» -> /rakety
#  3) картка: одна рамка (основа крупніше + 2 накладки мікроквадратами)
# Застосовувати ПІСЛЯ ttmax_apply_rackets.sh. Запуск: bash ttmax_apply_rackets_fix.sh
# Сухий прогін: TTMAX_NO_GIT=1 bash ttmax_apply_rackets_fix.sh
set -euo pipefail

PAGE='src/app/[locale]/[...segments]/page.tsx'
TMP=".ttmax_rackets_fix_tmp"

if [ ! -f package.json ] || [ ! -f "$PAGE" ]; then echo "✗ Запустіть у корені репозиторію ttmax-site."; exit 1; fi
if ! command -v node >/dev/null 2>&1; then echo "✗ Потрібен Node.js"; exit 1; fi
if ! grep -q "function ComboTriptych" "$PAGE"; then
  echo "✗ Не знайдено збірних ракеток у коді. Спершу застосуйте ttmax_apply_rackets.sh."; exit 1
fi
mkdir -p "$TMP"

cat > "$TMP/patch_edits.txt" <<'PATCH_EDITS_EOF'
@@@EDIT@@@ src/app/[locale]/[...segments]/page.tsx
@@@ANCHOR@@@
      ) : route.kind === "category" && route.category.slug === "rakety" ? (
@@@REPL@@@
      ) : (route.kind === "category" || route.kind === "brandCategory") && route.category.slug === "rakety" ? (
@@@EDIT@@@ src/app/[locale]/[...segments]/page.tsx
@@@ANCHOR@@@
function ComboTriptych({
  parts,
  media,
  size = "card",
}: {
  parts: CatalogProduct[];
  media: EntityMediaMap;
  size?: "card" | "hero";
}) {
  const px = size === "hero" ? 420 : 240;
  const tiles = parts.slice(0, 3).map((p, i) => {
    const m = pickPrimary(media, "product", p.slug);
    return {
      key: `${p.slug}-${i}`,
      url: m ? cldUrl(m.publicId, { w: px, h: px, crop: "fit" }) : null,
      label: p.model,
    };
  });
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {tiles.map((t) => (
        <div
          key={t.key}
          className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-border-strong bg-white/[0.03]"
        >
          {t.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.url} alt={t.label} className="h-full w-full object-contain p-1.5" />
          ) : (
            <span className="px-1 text-center font-display text-[9px] font-bold uppercase tracking-[0.12em] text-ink-ghost">
              {t.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
@@@REPL@@@
function ComboTriptych({
  parts,
  media,
  size = "card",
}: {
  parts: CatalogProduct[];
  media: EntityMediaMap;
  size?: "card" | "hero";
}) {
  const blade = parts[0];
  const rubbers = parts.slice(1, 3);
  const tile = (p: CatalogProduct | undefined, big: boolean) => {
    const m = p ? pickPrimary(media, "product", p.slug) : null;
    const dim = big
      ? { w: size === "hero" ? 460 : 280, h: size === "hero" ? 620 : 380 }
      : { w: size === "hero" ? 300 : 190, h: size === "hero" ? 300 : 190 };
    const url = m ? cldUrl(m.publicId, { ...dim, crop: "fit" }) : null;
    return url ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={p?.model ?? ""} className="h-full w-full object-contain p-1" />
    ) : (
      <span className="px-1 text-center font-display text-[9px] font-bold uppercase leading-tight tracking-[0.1em] text-ink-ghost">
        {p?.model ?? "Butterfly"}
      </span>
    );
  };
  return (
    <div className="flex gap-2 rounded-2xl border border-border-strong bg-white/[0.02] p-2">
      <div className="relative flex aspect-[3/4] basis-[56%] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.03]">
        {tile(blade, true)}
      </div>
      <div className="flex grow flex-col gap-2">
        <div className="relative flex grow items-center justify-center overflow-hidden rounded-xl bg-white/[0.03]">
          {tile(rubbers[0], false)}
        </div>
        <div className="relative flex grow items-center justify-center overflow-hidden rounded-xl bg-white/[0.03]">
          {tile(rubbers[1], false)}
        </div>
      </div>
    </div>
  );
}
@@@EDIT@@@ src/i18n/messages/types.ts
@@@ANCHOR@@@
  nav: {
    bases: string;
@@@REPL@@@
  nav: {
    rackets: string;
    bases: string;
@@@EDIT@@@ src/i18n/messages/ua.ts
@@@ANCHOR@@@
  nav: {
    bases: "Основи",
@@@REPL@@@
  nav: {
    rackets: "Готові ракетки",
    bases: "Основи",
@@@EDIT@@@ src/i18n/messages/ru.ts
@@@ANCHOR@@@
  nav: {
    bases: "Основания",
@@@REPL@@@
  nav: {
    rackets: "Готовые ракетки",
    bases: "Основания",
@@@EDIT@@@ src/config/navigation.ts
@@@ANCHOR@@@
export const navigation: ReadonlyArray<NavItem> = [
  {
    key: "bases",
@@@REPL@@@
export const navigation: ReadonlyArray<NavItem> = [
  {
    key: "rackets",
    href: "/rakety",
  },
  {
    key: "bases",
PATCH_EDITS_EOF

cat > "$TMP/applier.mjs" <<'APPLIER_MJS_EOF'
import fs from "fs";
const editsFile = process.argv[2];
const raw = fs.readFileSync(editsFile, "utf8");
const blocks = raw.split(/^@@@EDIT@@@ /m).slice(1);
let applied = 0, skipped = 0;
for (const b of blocks) {
  const nl = b.indexOf("\n");
  const path = b.slice(0, nl).trim();
  const rest = b.slice(nl + 1);
  const AM = "@@@ANCHOR@@@\n", RM = "@@@REPL@@@\n";
  const aIdx = rest.indexOf(AM), rIdx = rest.indexOf(RM);
  const anchor = rest.slice(aIdx + AM.length, rIdx).replace(/\n$/, "");
  const repl = rest.slice(rIdx + RM.length).replace(/\n$/, "");
  let src = fs.readFileSync(path, "utf8");
  if (src.includes(repl)) { console.log("  = skip (already applied):", path); skipped++; continue; }
  if (!src.includes(anchor)) {
    console.error("\n  \u2717 ANCHOR NOT FOUND in " + path + "\n--- expected anchor ---\n" + anchor + "\n-----------------------");
    process.exit(2);
  }
  src = src.replace(anchor, repl);
  fs.writeFileSync(path, src);
  console.log("  \u2713 applied:", path);
  applied++;
}
console.log(`\nПравки: ${applied} застосовано, ${skipped} пропущено (вже були).`);
APPLIER_MJS_EOF

echo "▶ Застосовую правки (page.tsx, навігація, i18n)…"
node "$TMP/applier.mjs" "$TMP/patch_edits.txt"
rm -rf "$TMP"

FILES=( "$PAGE" src/config/navigation.ts src/i18n/messages/types.ts src/i18n/messages/ua.ts src/i18n/messages/ru.ts )
if [ "${TTMAX_NO_GIT:-0}" = "1" ]; then
  echo "▶ TTMAX_NO_GIT=1 — без git."
else
  git add "${FILES[@]}"
  git commit -m "fix(rakety): ціни на brandCategory, пункт меню, картка-композиція (основа+2 накладки)" || echo "(нема змін)"
  git push origin HEAD
  echo "✓ Запушено."
fi
echo ""
echo "✅ Готово. Перевірте: /ua/rakety і /ua/butterfly/rakety (ціни -10% + нова картка), пункт меню «Готові ракетки»."
