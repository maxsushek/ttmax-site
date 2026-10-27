#!/usr/bin/env bash
# Чекає, поки Vercel закінчить деплой коміту, і друкує результат ОДНИМ рядком.
# Статус береться з GitHub (Vercel ставить його на коміт) — без MCP-конектора Vercel.
#
#   bash scripts/wait-deploy.sh            — поточний HEAD
#   bash scripts/wait-deploy.sh <sha>      — конкретний коміт
#
# Вихід: 0 — success, 1 — failure/error, 2 — не дочекались (10 хв).
# Пропущена збірка (Ignored Build Step) теж приходить як окремий статус — див. опис у виводі.
set -u
sha="${1:-$(git rev-parse HEAD)}"
repo="maxsushek/ttmax-site"

for _ in $(seq 1 60); do
  line="$(gh api "repos/$repo/commits/$sha/status" \
    --jq '[.statuses[] | select(.context == "Vercel")][0] | "\(.state)\t\(.description // "")\t\(.target_url // "")"' 2>/dev/null)"
  state="${line%%$'\t'*}"
  case "$state" in
    success) echo "✅ ${sha:0:7}: $line"; exit 0 ;;
    failure|error) echo "❌ ${sha:0:7}: $line"; exit 1 ;;
  esac
  sleep 10
done
echo "⏳ ${sha:0:7}: за 10 хв статус не змінився (${line:-немає статусу Vercel})"
exit 2
