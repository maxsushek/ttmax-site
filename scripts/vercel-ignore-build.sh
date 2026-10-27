#!/usr/bin/env bash
# Ignored Build Step для Vercel (vercel.json → ignoreCommand).
# Код виходу: 0 — збірку ПРОПУСТИТИ, 1 — збирати.
#
# ⚠️ НАВІЩО. Кожен push у main — продакшен-збірка: ~1600 сторінок, читання Supabase (Free —
# 5 ГБ egress на місяць) і запис ISR-кешу Vercel. Коміт лише з документацією, інструкціями
# Claude (CLAUDE.md, .claude/), скриптами-генераторами чи міграціями сайт не змінює — збирати
# його даремно.
#
# ⚠️ Порівнюємо з ОСТАННІМ УСПІШНИМ деплоєм (VERCEL_GIT_PREVIOUS_SHA), а не з HEAD^:
# якщо одним push прийшло кілька комітів, HEAD^ бачить лише останній — і коміт зі зміною
# сайту, за яким іде коміт із документацією, тихо не задеплоївся б.
#
# Будь-яка невизначеність → збирати (exit 1): зайва збірка коштує квоти, пропущена — зламаний прод.
set -u

prev="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -z "$prev" ] || ! git cat-file -e "${prev}^{commit}" 2>/dev/null; then
  echo "Немає попереднього деплою в історії клону — збираємо."
  exit 1
fi

changed="$(git diff --name-only "$prev" HEAD)"
if [ -z "$changed" ]; then
  # Той самий коміт (ручний Redeploy, напр. після зміни env) — збираємо.
  echo "Змін у файлах немає (повторний деплой) — збираємо."
  exit 1
fi

# Шляхи, що НЕ впливають на сайт. Усе інше (src/, public/, конфіги, package*.json, vercel.json) → збірка.
skip_re='^(docs/|\.claude/|scripts/|supabase/|[^/]+\.md$|\.env\.example$|\.prettierrc$|\.gitignore$)'

if echo "$changed" | grep -qvE "$skip_re"; then
  echo "Змінено файли сайту — збираємо:"
  echo "$changed" | grep -vE "$skip_re" | head -20
  exit 1
fi

echo "Змінено лише документацію/інструменти — збірку пропущено:"
echo "$changed" | head -20
exit 0
