"use client";
// src/components/admin/HomepageEditor.tsx

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HOME_KEYS, homeKey } from "@/lib/homepage/keys";

type ProductOption = { slug: string; label: string };
type Status = "idle" | "saving" | "saved" | "error";

type Field = { base: string; label: string; ph?: string };
type Group = { title: string; hint?: string; fields: Field[] };

// Усі редаговані тексти головної, згруповані за секціями. base → ключі home_<base>_uk/_ru.
const GROUPS: Group[] = [
  {
    title: "Hero — перший екран",
    fields: [
      { base: "hero_badge", label: "Бейдж над заголовком", ph: "Офіційний Butterfly в Україні" },
      { base: "hero_title", label: "Заголовок (один рядок)", ph: "Все для настільного тенісу" },
      { base: "hero_subtitle", label: "Підзаголовок", ph: "Оригінальний інвентар Butterfly…" },
    ],
  },
  {
    title: "Секція «Категорії»",
    fields: [
      { base: "cat_kicker", label: "Кікер (маленький напис)" },
      { base: "cat_title_muted", label: "Заголовок — сіра частина" },
      { base: "cat_title_accent", label: "Заголовок — акцент (жовтий)" },
    ],
  },
  {
    title: "Секція «Хіти»",
    fields: [
      { base: "prod_kicker", label: "Кікер" },
      { base: "prod_title_muted", label: "Заголовок — сіра частина" },
      { base: "prod_title_accent", label: "Заголовок — акцент" },
    ],
  },
  {
    title: "Секція «Колекції»",
    fields: [
      { base: "brands_kicker", label: "Кікер" },
      { base: "brands_title", label: "Заголовок" },
    ],
  },
  {
    title: "Тристрічка довіри",
    fields: [
      { base: "trust_1", label: "Пункт 1 (🚚 доставка)" },
      { base: "trust_2", label: "Пункт 2 (↩️ повернення)" },
      { base: "trust_3", label: "Пункт 3 (🔒 оплата)" },
      { base: "trust_4", label: "Пункт 4 (⭐ рейтинг)" },
    ],
  },
  {
    title: "Форма-CTA (консультація)",
    fields: [
      { base: "cta_kicker", label: "Кікер" },
      { base: "cta_title", label: "Заголовок" },
      { base: "cta_subtitle", label: "Підзаголовок" },
    ],
  },
  {
    title: "FAQ",
    fields: [
      { base: "faq_kicker", label: "Кікер" },
      { base: "faq_title", label: "Заголовок" },
    ],
  },
];

export function HomepageEditor({
  initial,
  products,
}: {
  initial: { texts: Record<string, string>; hits: string[] };
  products: ProductOption[];
}) {
  const router = useRouter();
  const [texts, setTexts] = useState<Record<string, string>>(initial.texts);
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
  const setText = (key: string, v: string) => {
    setTexts((prev) => ({ ...prev, [key]: v }));
    dirty();
  };

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
  const move = (i: number, d: -1 | 1) => {
    setHits((prev) => {
      const next = [...prev];
      const j = i + d;
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
      const settings: Record<string, string> = {};
      for (const [k, v] of Object.entries(texts)) settings[k] = (v ?? "").trim();
      settings[HOME_KEYS.hits] = hits.join(",");
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
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

  const renderField = (f: Field) => {
    const ku = homeKey(f.base, "uk");
    const kr = homeKey(f.base, "ru");
    return (
      <div key={f.base} className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={lbl}>{f.label} (UA)</label>
          <input
            className={field}
            value={texts[ku] ?? ""}
            onChange={(e) => setText(ku, e.target.value)}
            placeholder={f.ph}
          />
        </div>
        <div>
          <label className={lbl}>{f.label} (RU)</label>
          <input
            className={field}
            value={texts[kr] ?? ""}
            onChange={(e) => setText(kr, e.target.value)}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {GROUPS.map((g) => (
        <section key={g.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h2 className="mb-4 text-sm font-black uppercase tracking-wide">{g.title}</h2>
          <div className="space-y-4">{g.fields.map(renderField)}</div>

          {g.title === "Секція «Хіти»" && (
            <div className="mt-6 border-t border-white/[0.06] pt-5">
              <h3 className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-[#aaa]">
                Товари в блоці «Хіти»
              </h3>
              <p className="mb-3 text-xs text-[#888]">
                Порядок — кнопками ↑/↓. Якщо список порожнэ — показується стандартний набір.
              </p>
              <div className="mb-3 min-w-[260px]">
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
              {hits.length === 0 ? (
                <p className="text-xs text-[#666]">Поки порожнэ — буде стандартний набір хітів.</p>
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
            </div>
          )}
        </section>
      ))}

      <div className="sticky bottom-4 flex items-center gap-3 rounded-xl border border-white/10 bg-[#111]/90 p-3 backdrop-blur">
        <button
          type="button"
          onClick={save}
          disabled={status === "saving"}
          className="rounded-lg bg-[#E8FF47] px-5 py-2.5 text-sm font-black uppercase tracking-wide text-black transition hover:brightness-110 disabled:opacity-60"
        >
          {status === "saving" ? "Збереження…" : "Зберегти все"}
        </button>
        {status === "saved" && <span className="text-sm font-bold text-[#2ED573]">✓ Збережено</span>}
        {status === "error" && <span className="text-sm font-bold text-[#E8714D]">{error}</span>}
      </div>
    </div>
  );
}
