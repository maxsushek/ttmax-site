// src/components/admin/PriceStockManager.tsx
// Керування ціною та наявністю (товар-рівень). Порожня ціна = з коду, статус «Авто» = з коду.
// Зберігаються лише змінені рядки → POST /api/admin/overrides.
"use client";

import { useMemo, useState } from "react";

export type PriceStockRow = {
  slug: string;
  model: string;
  category: string;
  /** Ціна з коду (довідково). */
  codePrice: number | null;
};

type OverrideValue = { price: number | null; inStock: boolean | null };
type Values = Record<string, OverrideValue>;

const EMPTY: OverrideValue = { price: null, inStock: null };

const CATEGORY_LABEL: Record<string, string> = {
  nakladki: "Накладки",
  osnovaniya: "Основи",
};

const fmt = (n: number) => new Intl.NumberFormat("uk-UA").format(n) + " ₴";

function stockToSelect(v: boolean | null): "auto" | "in" | "out" {
  if (v === true) return "in";
  if (v === false) return "out";
  return "auto";
}
function selectToStock(v: string): boolean | null {
  if (v === "in") return true;
  if (v === "out") return false;
  return null;
}

function sameValue(a: OverrideValue, b: OverrideValue): boolean {
  return a.price === b.price && a.inStock === b.inStock;
}

export function PriceStockManager({ rows, initial }: { rows: PriceStockRow[]; initial: Values }) {
  const base = useMemo<Values>(() => {
    const m: Values = {};
    for (const r of rows) m[r.slug] = initial[r.slug] ?? { price: null, inStock: null };
    return m;
  }, [rows, initial]);

  const [values, setValues] = useState<Values>(base);
  const [baseline, setBaseline] = useState<Values>(base);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const changed = useMemo(
    () =>
      rows
        .filter((r) => !sameValue(values[r.slug] ?? EMPTY, baseline[r.slug] ?? EMPTY))
        .map((r) => r.slug),
    [rows, values, baseline],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.model.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const setPrice = (slug: string, raw: string) => {
    const t = raw.trim();
    let price: number | null = null;
    if (t !== "") {
      const n = Number(t);
      if (!isFinite(n) || n < 0) return;
      price = n;
    }
    setValues((p) => ({ ...p, [slug]: { ...(p[slug] ?? EMPTY), price } }));
    setStatus("idle");
  };

  const setStock = (slug: string, sel: string) => {
    setValues((p) => ({ ...p, [slug]: { ...(p[slug] ?? EMPTY), inStock: selectToStock(sel) } }));
    setStatus("idle");
  };

  const save = async () => {
    if (changed.length === 0) return;
    setStatus("saving");
    setError(null);
    try {
      const items = changed.map((slug) => {
        const cur = values[slug] ?? EMPTY;
        return { key: slug, price: cur.price, inStock: cur.inStock };
      });
      const res = await fetch("/api/admin/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setBaseline(values);
      setStatus("saved");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Помилка збереження");
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Пошук за назвою…"
          className="w-full max-w-[280px] rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-[#F0F0F0] outline-none placeholder:text-[#555] focus:border-white/30"
        />
        <span className="text-xs text-[#888]">
          {rows.length} товарів · змінено: {changed.length}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <div className="grid grid-cols-[1fr_120px_140px] items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#888]">
          <span>Товар</span>
          <span>Ціна, ₴</span>
          <span>Наявність</span>
        </div>
        <ul className="divide-y divide-white/[0.06]">
          {filtered.map((r) => {
            const v = values[r.slug] ?? EMPTY;
            const isChanged = !sameValue(v, baseline[r.slug] ?? EMPTY);
            return (
              <li
                key={r.slug}
                className={
                  "grid grid-cols-[1fr_120px_140px] items-center gap-2 px-4 py-2.5 " +
                  (isChanged ? "bg-[#E8FF47]/[0.04]" : "")
                }
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-[#F0F0F0]">{r.model}</div>
                  <div className="text-[11px] text-[#666]">
                    {CATEGORY_LABEL[r.category] ?? r.category}
                    {" · "}
                    {r.codePrice != null ? `код: ${fmt(r.codePrice)}` : "код: за запитом"}
                  </div>
                </div>

                <input
                  inputMode="numeric"
                  value={v.price ?? ""}
                  onChange={(e) => setPrice(r.slug, e.target.value)}
                  placeholder={r.codePrice != null ? String(r.codePrice) : "—"}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[#F0F0F0] outline-none placeholder:text-[#555] focus:border-[#E8FF47]/50"
                />

                <select
                  value={stockToSelect(v.inStock)}
                  onChange={(e) => setStock(r.slug, e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-sm text-[#F0F0F0] outline-none focus:border-[#E8FF47]/50"
                >
                  <option value="auto">Авто (з коду)</option>
                  <option value="in">В наявності</option>
                  <option value="out">Немає</option>
                </select>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="sticky bottom-0 mt-4 flex items-center gap-3 border-t border-white/10 bg-[#080A0E]/95 py-3 backdrop-blur">
        <button
          type="button"
          onClick={save}
          disabled={status === "saving" || changed.length === 0}
          className="rounded-lg bg-[#E8FF47] px-5 py-2.5 text-sm font-bold text-[#080A0E] transition-opacity disabled:opacity-40"
        >
          {status === "saving"
            ? "Збереження…"
            : `Зберегти${changed.length ? ` (${changed.length})` : ""}`}
        </button>
        {status === "saved" && <span className="text-sm text-[#4ade80]">✓ Збережено</span>}
        {status === "error" && <span className="text-sm text-[#f87171]">⚠ {error}</span>}
      </div>
    </div>
  );
}
