// src/components/admin/CountersForm.tsx
"use client";

import { useState } from "react";
import { COUNTER_KEYS } from "@/lib/analytics/ids";

type Values = Record<string, string>;

const FIELDS: { key: string; label: string; placeholder: string; hint?: string }[] = [
  {
    key: COUNTER_KEYS.gtm,
    label: "Google Tag Manager",
    placeholder: "GTM-XXXXXXX",
    hint: "Якщо заданий — GA4/Ads/Pixel зазвичай налаштовуються тегами всередині GTM.",
  },
  {
    key: COUNTER_KEYS.ga,
    label: "Google Analytics 4",
    placeholder: "G-XXXXXXXXXX",
    hint: "Підключається напряму, якщо GTM не заданий.",
  },
  {
    key: COUNTER_KEYS.adsId,
    label: "Google Ads ID",
    placeholder: "AW-XXXXXXXXX",
  },
  {
    key: COUNTER_KEYS.adsLabel,
    label: "Google Ads conversion label",
    placeholder: "AbC-D_efG",
    hint: "Потрібен для відстеження конверсій-замовлень напряму (без GTM).",
  },
  {
    key: COUNTER_KEYS.pixel,
    label: "Meta Pixel ID",
    placeholder: "1234567890",
  },
];

type Status = "idle" | "saving" | "saved" | "error";

export function CountersForm({ initial }: { initial: Values }) {
  const [values, setValues] = useState<Values>(initial);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const update = (key: string, v: string) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    setStatus("idle");
  };

  const save = async () => {
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: values }),
      });
      if (!res.ok) throw new Error("Не вдалося зберегти");
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Помилка збереження");
    }
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="space-y-4">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-[#888]">
              {f.label}
            </label>
            <input
              type="text"
              value={values[f.key] ?? ""}
              onChange={(e) => update(f.key, e.target.value)}
              placeholder={f.placeholder}
              spellCheck={false}
              autoComplete="off"
              className="w-full rounded-lg border border-white/10 bg-[#0E1117] px-3 py-2 font-mono text-sm text-white outline-none placeholder:text-[#555] focus:border-[#E8FF47]/50"
            />
            {f.hint && <p className="mt-1 text-[11px] text-[#666]">{f.hint}</p>}
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={status === "saving"}
          className="rounded-lg bg-[#E8FF47] px-4 py-2 text-sm font-black uppercase tracking-[0.06em] text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === "saving" ? "Збереження…" : "Зберегти"}
        </button>
        {status === "saved" && (
          <span className="text-sm text-[#2ED573]">Збережено · оновиться за хвилину</span>
        )}
        {status === "error" && <span className="text-sm text-[#FF6B81]">{error}</span>}
      </div>

      <p className="mt-4 text-[11px] text-[#555]">
        Порожнэ поле = використати значення з env (або вимкнути, якщо в env теж порожнэ). Зміни
        застосовуються без передеплою.
      </p>
    </div>
  );
}
