"use client";
// src/components/admin/HomepageEditor.tsx

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HOME_KEYS, DEFAULT_HITS, homeKey } from "@/lib/homepage/keys";
import { CONTACT_KEYS } from "@/lib/contact/keys";

type ProductOption = { slug: string; label: string };
type Status = "idle" | "saving" | "saved" | "error";

type Field = { base: string; label: string; ph?: string; multiline?: boolean };
type Group = { title: string; fields: Field[] };

// Усі редаговані тексти головної, згруповані за секціями. base → ключі home_<base>_uk/_ru.
const GROUPS: Group[] = [
  {
    title: "Hero — перший екран",
    fields: [
      { base: "hero_badge", label: "Бейдж над заголовком", ph: "Офіційний Butterfly в Україні" },
      { base: "hero_title", label: "Заголовок (один рядок)", ph: "Все для настільного тенісу" },
      { base: "hero_subtitle", label: "Підзаголовок", ph: "Оригінальний інвентар Butterfly…", multiline: true },
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
      { base: "cta_subtitle", label: "Підзаголовок", multiline: true },
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

// Контакти у футері (телефон / email / соцмережі) — одне значення на поле (не двомовні).
const CONTACT_FIELDS: { key: string; label: string; ph?: string }[] = [
  { key: CONTACT_KEYS.phone, label: "Телефон (для кнопки tel:)", ph: "+380501234567" },
  { key: CONTACT_KEYS.phoneDisplay, label: "Телефон (як показувати)", ph: "+380 50 123 45 67" },
  { key: CONTACT_KEYS.email, label: "Email", ph: "hello@ttmax.ua" },
  { key: CONTACT_KEYS.telegram, label: "Telegram (повне посилання)", ph: "https://t.me/…" },
  { key: CONTACT_KEYS.youtube, label: "YouTube (повне посилання)", ph: "https://youtube.com/@…" },
  { key: CONTACT_KEYS.facebook, label: "Facebook (повне посилання)", ph: "https://facebook.com/…" },
];

export function HomepageEditor({
  initial,
  products,
}: {
  initial: {
    values: Record<string, string>;
    defaults: Record<string, string>;
    overridden: string[];
    hits: string[];
  };
  products: ProductOption[];
}) {
  const router = useRouter();
  const { defaults } = initial;
  const [values, setValues] = useState<Record<string, string>>(initial.values);
  const [hits, setHits] = useState<string[]>(initial.hits);
  const [toAdd, setToAdd] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const wasOverridden = useMemo(() => new Set(initial.overridden), [initial.overridden]);
  const labelBySlug = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of products) m.set(p.slug, p.label);
    return m;
  }, [products]);
  const available = useMemo(() => products.filter((p) => !hits.includes(p.slug)), [products, hits]);

  const dirty = () => setStatus("idle");
  const setValue = (key: string, v: string) => {
    setValues((prev) => ({ ...prev, [key]: v }));
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
      // Зберігаэмо лише змінене: відмінне від дефолта → переопределення; повернене до
      // дефолта, але раніше переопределене → порожнэ (видалити рядок, тягнути дефолт коду).
      const settings: Record<string, string> = {};
      for (const key of Object.keys(values)) {
        const v = (values[key] ?? "").trim();
        const def = (defaults[key] ?? "").trim();
        if (v !== def) settings[key] = v;
        else if (wasOverridden.has(key)) settings[key] = "";
      }
      const hitsStr = hits.join(",");
      settings[HOME_KEYS.hits] = hitsStr === DEFAULT_HITS.join(",") ? "" : hitsStr;

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
  const lbl = "block text-[11px] font-bold uppercase tracking-[0.12em] text-[#888]";

  // Одна комірка (label + кнопка «↺ дефолт» + поле). Працюэ і для двомовних, і для контактів.
  const renderCell = (label: string, key: string, ph?: string, multiline?: boolean) => {
    const v = values[key] ?? "";
    const def = defaults[key] ?? "";
    const changed = v.trim() !== def.trim();
    return (
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className={lbl}>{label}</span>
          {changed && (
            <button
              type="button"
              onClick={() => setValue(key, def)}
              className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-[#777] transition-colors hover:text-[#E8FF47]"
              title="Повернути стандартне значення"
            >
              ↺ дефолт
            </button>
          )}
        </div>
        {multiline ? (
          <textarea
            className={`${field} min-h-[68px] resize-y leading-snug`}
            value={v}
            onChange={(e) => setValue(key, e.target.value)}
            placeholder={ph}
            rows={2}
            maxLength={500}
          />
        ) : (
          <input
            className={field}
            value={v}
            onChange={(e) => setValue(key, e.target.value)}
            placeholder={ph}
            maxLength={500}
          />
        )}
      </div>
    );
  };

  const renderField = (f: Field) => {
    const ku = homeKey(f.base, "uk");
    const kr = homeKey(f.base, "ru");
    return (
      <div key={f.base} className="grid gap-3 sm:grid-cols-2">
        {renderCell(`${f.label} (UA)`, ku, f.ph, f.multiline)}
        {renderCell(`${f.label} (RU)`, kr, undefined, f.multiline)}
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
                Порядок — кнопками ↑/↓. Якщо список порожній — показується стандартний набір.
              </p>
              <div className="mb-3 min-w-[260px]">
                <span className={lbl}>Додати товар</span>
                <select className={`${field} mt-1`} value={toAdd} onChange={(e) => addHit(e.target.value)}>
                  <option value="">— оберіть товар —</option>
                  {available.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              {hits.length === 0 ? (
                <p className="text-xs text-[#666]">Поки порожній — буде стандартний набір хітів.</p>
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

      {/* Контакти у футері — телефон, email, соцмережі (показуються на всіх сторінках). */}
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h2 className="mb-1 text-sm font-black uppercase tracking-wide">Контакти й соцмережі (футер)</h2>
        <p className="mb-4 text-xs text-[#888]">
          Показуються у футері на всіх сторінках. Повний набір (адреса, параметри доставки) — у
          розділі «Налаштування → Контакти».
        </p>
        <div className="space-y-4">
          {CONTACT_FIELDS.map((f) => (
            <div key={f.key}>{renderCell(f.label, f.key, f.ph)}</div>
          ))}
        </div>
      </section>

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
