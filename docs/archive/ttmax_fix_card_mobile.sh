#!/usr/bin/env bash
# ttmax_fix_card_mobile.sh — фікс «вильоту» картки по ширині на мобільному.
# 1) таблиця порівняння більше не повноширинна (скролиться в межах контенту, з відступами);
# 2) колонці картки додано min-w-0 (захист від розпирання вузьким контентом).
# Ідемпотентний. Запуск: bash ttmax_fix_card_mobile.sh | Сухий: TTMAX_NO_GIT=1 bash ttmax_fix_card_mobile.sh
set -euo pipefail

PAGE='src/app/[locale]/[...segments]/page.tsx'
COMP='src/components/catalog/ExpertSections.tsx'

if [ ! -f package.json ] || [ ! -f "$PAGE" ] || [ ! -f "$COMP" ]; then
  echo "✗ Запустіть у корені репозиторію ttmax-site (і має бути застосована розширена картка)."; exit 1
fi

echo "▶ Правлю мобільну ширину картки…"
python3 - "$PAGE" "$COMP" <<'PY'
import sys
page, comp = sys.argv[1], sys.argv[2]

def edit(path, old, new, label):
    s = open(path, encoding="utf-8").read()
    if new in s and old not in s:
        print("  = вже застосовано:", label); return
    if old not in s:
        print("  ✗ якір не знайдено:", label, "->", path); sys.exit(1)
    open(path, "w", encoding="utf-8").write(s.replace(old, new, 1))
    print("  ✓", label)

# 1) Таблиця порівняння: прибрати повноширинність (-mx-4 px-4), лишити звичайний скрол.
edit(
    comp,
    '-mx-4 mt-5 overflow-x-auto px-4 sm:mx-0 sm:px-0',
    'mt-5 overflow-x-auto',
    "таблиця: без повноширинності",
)
# 2) Колонка картки в гріді: min-w-0, щоб вузький контент не розпирав ширину.
edit(
    page,
    '{extra && <div className="lg:col-span-2">{extra}</div>}',
    '{extra && <div className="min-w-0 lg:col-span-2">{extra}</div>}',
    "грид-колонка: min-w-0",
)
PY
echo "  ✓ файли оновлено"
echo ""

FILES=( "$PAGE" "$COMP" )
if [ "${TTMAX_NO_GIT:-0}" = "1" ]; then
  echo "▶ TTMAX_NO_GIT=1 — без git."
else
  git add "${FILES[@]}"
  git commit -m "fix(card): мобільна ширина — таблиця без повноширинності, min-w-0 на колонку" || echo "(нема змін)"
  git push origin HEAD
  echo "✓ Запушено."
fi
echo ""
echo "✅ Готово. Перевірте на мобільному: /ua/butterfly/nakladki/dignics-05 (таблиця з відступами, нічого не вилазить)."
