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
