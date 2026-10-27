#!/usr/bin/env bash
# ttmax_media_revalidate_button.sh — кнопка "Скинути кеш фото" в адмінці.
# Додає: API-роут /api/admin/revalidate-media (POST, revalidateTag MEDIA_TAG)
#        + клієнтську кнопку RevalidateMediaButton, вмонтовану в сторінку Медіа.
# Навіщо: коли фото залиті в БД повз адмінку (масовий імпорт), кеш галереї треба скинути вручну.
# Перезаписує 1 файл + 2 нові. Запуск: bash ttmax_media_revalidate_button.sh
# Сухий прогін (без git): TTMAX_NO_GIT=1 bash ttmax_media_revalidate_button.sh
set -euo pipefail

[ -f package.json ] || { echo "✗ Запусти в корені ttmax-site."; exit 1; }
grep -q "MEDIA_TAG" src/lib/media/get.ts || { echo "✗ Не знайшов MEDIA_TAG у src/lib/media/get.ts — структура інша."; exit 1; }

echo "▶ Додаю API-роут скиду кешу…"
mkdir -p src/app/api/admin/revalidate-media
cat > src/app/api/admin/revalidate-media/route.ts << 'TS'
// src/app/api/admin/revalidate-media/route.ts
// Ручний скид кешу фото вітрини (revalidateTag MEDIA_TAG). Тільки для адміна.
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { MEDIA_TAG } from "@/lib/media/get";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  revalidateTag(MEDIA_TAG);
  return NextResponse.json({ ok: true, revalidated: MEDIA_TAG, at: Date.now() });
}
TS

echo "▶ Додаю кнопку…"
cat > src/components/admin/RevalidateMediaButton.tsx << 'TSX'
// src/components/admin/RevalidateMediaButton.tsx
"use client";

import { useState } from "react";

export function RevalidateMediaButton() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const run = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/admin/revalidate-media", { method: "POST" });
      if (!res.ok) throw new Error(String(res.status));
      setState("done");
      setTimeout(() => setState("idle"), 4000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  };

  const label =
    state === "loading" ? "Скидаю…"
    : state === "done" ? "Готово ✓ — фото оновляться за мить"
    : state === "error" ? "Помилка, спробуй ще раз"
    : "Скинути кеш фото";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={run}
        disabled={state === "loading"}
        className="rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:border-[#E8FF47]/40 disabled:opacity-50"
      >
        {label}
      </button>
      <span className="text-[12px] text-[#888]">
        Натисни, якщо додав фото в базу повз адмінку (масовий імпорт).
      </span>
    </div>
  );
}
TSX

echo "▶ Вмонтовую кнопку у сторінку Медіа…"
cat > src/app/admin/media/page.tsx << 'PAGE'
// src/app/admin/media/page.tsx
import { requireAdmin } from "@/lib/auth/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { MediaManager, type MediaEntity } from "@/components/admin/MediaManager";
import { RevalidateMediaButton } from "@/components/admin/RevalidateMediaButton";
import { catalogCategories, getActiveBrands, getAllProducts } from "@/data/catalog";
import { SITE_ASSETS } from "@/lib/media/site-assets";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Медіа · Admin · TTMAX",
  robots: { index: false, follow: false },
};

export default async function MediaPage() {
  const admin = await requireAdmin();

  const categories: MediaEntity[] = [...catalogCategories]
    .sort((a, b) => a.sort - b.sort)
    .map((c) => ({ type: "category", slug: c.slug, label: c.name.ua, group: "Категорії" }));

  const brands: MediaEntity[] = getActiveBrands().map((b) => ({
    type: "brand",
    slug: b.slug,
    label: b.name,
    group: "Бренди",
  }));

  const products: MediaEntity[] = getAllProducts().map((p) => ({
    type: "product",
    slug: p.slug,
    label: p.model,
    group: p.base ? "Товари — основи" : "Товари — накладки",
  }));

  const site: MediaEntity[] = [
    { type: "category", slug: SITE_ASSETS.logo, label: "Логотип", group: "Сайт" },
    { type: "category", slug: SITE_ASSETS.hero, label: "Hero — головне фото", group: "Сайт" },
    { type: "category", slug: SITE_ASSETS.favicon, label: "Favicon", group: "Сайт" },
  ];

  const entities = [...site, ...categories, ...brands, ...products];

  return (
    <AdminShell email={admin.email}>
      <main className="mx-auto max-w-[1100px] px-5 py-8">
        <h1 className="mb-1 text-2xl font-black">Медіа / фото</h1>
        <p className="mb-4 text-sm text-[#888]">
          Завантаження зображень для категорій, товарів і брендів, а також загальносайтових слотів
          (група «Сайт»: логотип, банер, фавікон — береться перше зображення). Зміни застосовуються
          без передеплою — оновлюється на сайті за хвилину.
        </p>
        <div className="mb-6">
          <RevalidateMediaButton />
        </div>
        <MediaManager entities={entities} />
      </main>
    </AdminShell>
  );
}
PAGE

echo "✔ Файли записані."

if [ "${TTMAX_NO_GIT:-0}" = "1" ]; then
  echo "TTMAX_NO_GIT=1 — git пропущено. Перевір файли і запусти без цього прапора."
  exit 0
fi

git add src/app/api/admin/revalidate-media/route.ts src/components/admin/RevalidateMediaButton.tsx src/app/admin/media/page.tsx
git commit -m "feat(admin): кнопка 'Скинути кеш фото' (revalidateTag media) для масового імпорту"
git push
echo "✔ Запушено в main. Vercel задеплоїть за 1–2 хв."
