// src/components/admin/HomepageForm.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HOME_KEYS } from "@/lib/homepage/keys";

type ProductOption = { slug: string; label: string };
type Status = "idle" | "saving" | "saved" | "error";

export function HomepageForm({
  initial,
  products,
}: {
  initial: {
    heroUk: string;
    heroRu: string;
    brandsUk: string;
    brandsRu: string;
    hits: string[];
  };
  products: ProductOption[];
}) {
  const router = useRouter();
  const [heroUk, setHeroUk] = useState(initial.heroUk);
  const [heroRu, setHeroRu] = useState(initial.heroRu);
  const [brandsUk, setBrandsUk] = useState(initial.brandsUk);
  const [brandsRu, setBrandsRu] = useState(initial.brandsRu);
  const [hits, setHits] = useState<string[]>(initial.hits);
  const [toAdd, setToAdd] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const labelBySlug = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of products) m.set(p.slug, p.label);
    return m;
  }, [products]);

  const available = useMemo(() => products.filter((p) => !hits.includes(p.slug)), [products, hits]);

  const dirty = () => setStatus("idle");

  const addHit = (slug: string) => {
    if (!slug || hits.includes(slug)) return;
    setHits((prev) => [...prev, slug]);
    setToAdd("");
    dirty();
  };
  const removeHit = (slug: string) => {
    setHits((prev) => prev.filter((s) => s !== slug));
    dirty();
  };
  const move = (i: number, dir: -1 | 1) => {
    setHits((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
    dirty();
  };

  const save = async () => {
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            [HOME_KEYS.heroTitleUk]: heroUk.trim(),
            [HOME_KEYS.heroTitleRu]: heroRu.trim(),
            [HOME_KEYS.brandsTitleUk]: brandsUk.trim(),
            [HOME_KEYS.brandsTitleRu]: brandsRu.trim(),
            [HOME_KEYS.hits]: hits.join(","),
          },
        }),
      });
      if (!res.ok) throw new Error("Не вдалося зберегти");
      setStatus("saved");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Помилка збереження");
    }
  };

  const field =
    "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[#E8FF47]/50";
  const lbl = "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#888]";

  return (
    <div className="space-y-6">
      {/* Заголовки */}
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h2 className="mb-1 text-sm font-black uppercase tracking-wide">Заголовки головної</h2>
        <p className="mb-4 text-xs text-[#888]">
          Порожнэ поле — використовується стандартний заголовок із коду. Заголовок Hero (якщо
          заданий) показується одним акцентним рядком.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={lbl}>Hero — заголовок (UA)</label>
            <input
              className={field}
              value={heroUk}
              onChange={(e) => {
                setHeroUk(e.target.value);
                dirty();
              }}
              placeholder="Напр.: Все для настільного тенісу"
            />
          </div>
          <div>
            <label className={lbl}>Hero — заголовок (RU)</label>
            <input
              className={field}
              value={heroRu}
              onChange={(e) => {
                setHeroRu(e.target.value);
                dirty();
              }}
              placeholder="Напр.: Всё для настольного тенниса"
            />
          </div>
          <div>
            <label className={lbl}>Секція брендів — заголовок (UA)</label>
            <input
              className={field}
              value={brandsUk}
              onChange={(e) => {
                setBrandsUk(e.target.value);
                dirty();
              }}
              placeholder="Інвентар Butterfly для будь-якого рівня"
            />
          </div>
          <div>
            <label className={lbl}>Секція брендів — заголовок (RU)</label>
            <input
              className={field}
              value={brandsRu}
              onChange={(e) => {
                setBrandsRu(e.target.value);
                dirty();
              }}
              placeholder="Инвентарь Butterfly для любого уровня"
            />
          </div>
        </div>
      </section>

      {/* Хіти */}
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h2 className="mb-1 text-sm font-black uppercase tracking-wide">Хіти на головній</h2>
        <p className="mb-4 text-xs text-[#888]">
          Товари в блоці «Хіти». Порядок — кнопками ↑/↓. Якщо список порожнэ — показуэться
          стандартний набір.
        </p>

        <div className="mb-4 flex flex-wrap items-end gap-2">
          <div className="min-w-[260px] flex-1">
            <label className={lbl}>Додати товар</label>
            <select className={field} value={toAdd} onChange={(e) => addHit(e.target.value)}>
              <option value="">— оберіть товар —</option>
              {available.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hits.length === 0 ? (
          <p className="text-xs text-[#666]">
            Поки порожнэ — буде показано стандартний набір хітів.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {hits.map((slug, i) => (
              <li
                key={slug}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
              >
                <span className="min-w-0 truncate text-sm">
                  <span className="text-white">{labelBySlug.get(slug) ?? slug}</span>
                  {!labelBySlug.has(slug) && (
                    <span className="ml-2 text-[10px] font-bold uppercase text-[#E8714D]">
                      немає в каталозі
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="rounded px-2 py-1 text-xs text-[#aaa] ring-1 ring-white/10 disabled:opacity-30"
                    aria-label="Вище"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === hits.length - 1}
                    className="rounded px-2 py-1 text-xs text-[#aaa] ring-1 ring-white/10 disabled:opacity-30"
                    aria-label="Нижче"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeHit(slug)}
                    className="rounded px-2 py-1 text-xs font-bold text-[#E8714D] ring-1 ring-[#E8714D]/30"
                  >
                    Прибрати
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={status === "saving"}
          className="rounded-lg bg-[#E8FF47] px-5 py-2.5 text-sm font-black uppercase tracking-wide text-black transition hover:brightness-110 disabled:opacity-60"
        >
          {status === "saving" ? "Збереження…" : "Зберегти"}
        </button>
        {status === "saved" && (
          <span className="text-sm font-bold text-[#2ED573]">✓ Збережено</span>
        )}
        {status === "error" && <span className="text-sm font-bold text-[#E8714D]">{error}</span>}
      </div>
    </div>
  );
}
