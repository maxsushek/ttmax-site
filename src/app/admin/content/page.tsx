// src/components/admin/ContentEditor.tsx
// Редактор описів: вибір (тип + slug + мова), мета, intro, body (markdown), FAQ, порівняння (JSON), noindex.
// Завантажує існуючий блок через GET, зберігає через POST. Порожній блок видаляється автоматично.
"use client";

import { useState } from "react";
import { TOKEN_DEFS, TOKEN_NOTE, findTokens } from "@/lib/content/token-catalog";

type Suggestion = { slug: string; label: string };
type ExistingRow = {
  entity_type: string;
  slug: string;
  locale: string;
  meta_title: string | null;
  updated_at: string;
  /** Формули-токени, знайдені в будь-якому полі опису (для огляду). */
  tokens?: string[];
};
type Faq = { q: string; a: string };
type Status = "idle" | "loading" | "saving" | "saved" | "deleted" | "error";

const ENTITY_LABEL: Record<string, string> = {
  product: "Товар",
  category: "Категорія",
  brand: "Бренд",
  brandCategory: "Бренд×категорія",
  series: "Серія",
  facet: "Фасет",
};

export function ContentEditor({
  suggestions,
  existing,
}: {
  suggestions: Record<string, Suggestion[]>;
  existing: ExistingRow[];
}) {
  const [entityType, setEntityType] = useState("category");
  const [slug, setSlug] = useState("");
  const [locale, setLocale] = useState("uk");

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [intro, setIntro] = useState("");
  const [body, setBody] = useState("");
  const [faq, setFaq] = useState<Faq[]>([]);
  const [comparison, setComparison] = useState("");
  const [noindex, setNoindex] = useState(false);

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [onlyFormulas, setOnlyFormulas] = useState(false);

  const sugg = suggestions[entityType] ?? [];
  const formulaCount = existing.filter((r) => (r.tokens?.length ?? 0) > 0).length;
  const shownExisting = onlyFormulas
    ? existing.filter((r) => (r.tokens?.length ?? 0) > 0)
    : existing;

  // Формули в ПОТОЧНОМУ описі (оновлюється під час набору).
  const blockTokens = [
    { field: "Meta title", tokens: findTokens(metaTitle) },
    { field: "Meta description", tokens: findTokens(metaDescription) },
    { field: "Intro", tokens: findTokens(intro) },
    { field: "Body", tokens: findTokens(body) },
    { field: "FAQ", tokens: findTokens(faq.map((f) => `${f.q} ${f.a}`).join(" ")) },
    { field: "Порівняння", tokens: findTokens(comparison) },
  ].filter((x) => x.tokens.length > 0);

  const copyToken = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied((c) => (c === text ? null : c)), 1200);
    } catch {
      /* clipboard недоступний — ігноруємо */
    }
  };

  const resetFields = () => {
    setMetaTitle("");
    setMetaDescription("");
    setIntro("");
    setBody("");
    setFaq([]);
    setComparison("");
    setNoindex(false);
  };

  const load = async (et = entityType, sl = slug, lc = locale) => {
    if (!sl) {
      setError("Вкажіть slug");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/content?entityType=${encodeURIComponent(et)}&slug=${encodeURIComponent(sl)}&locale=${encodeURIComponent(lc)}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { row } = (await res.json()) as { row: Record<string, unknown> | null };
      resetFields();
      if (row) {
        setMetaTitle((row.meta_title as string) ?? "");
        setMetaDescription((row.meta_description as string) ?? "");
        setIntro((row.intro as string) ?? "");
        setBody((row.body as string) ?? "");
        setFaq(Array.isArray(row.faq) ? (row.faq as Faq[]) : []);
        setComparison(row.comparison ? JSON.stringify(row.comparison, null, 2) : "");
        setNoindex(row.noindex === true);
      }
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Помилка завантаження");
    }
  };

  const pickExisting = (r: ExistingRow) => {
    setEntityType(r.entity_type);
    setSlug(r.slug);
    setLocale(r.locale);
    void load(r.entity_type, r.slug, r.locale);
  };

  const save = async () => {
    if (!slug) {
      setError("Вкажіть slug");
      setStatus("error");
      return;
    }
    let comparisonValue: unknown = undefined;
    if (comparison.trim()) {
      try {
        comparisonValue = JSON.parse(comparison);
      } catch {
        setStatus("error");
        setError("Порівняння: некоректний JSON");
        return;
      }
    }
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          slug: slug.trim(),
          locale,
          metaTitle,
          metaDescription,
          intro,
          body,
          faq: faq.filter((f) => f.q.trim() && f.a.trim()),
          comparison: comparisonValue,
          noindex,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { deleted?: boolean };
      setStatus(data.deleted ? "deleted" : "saved");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Помилка збереження");
    }
  };

  const field =
    "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-[#F0F0F0] outline-none placeholder:text-[#555] focus:border-[#E8FF47]/50";

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Існуючі описи */}
      <aside className="lg:order-2">
        <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
          Існуючі ({existing.length})
        </h2>
        <label className="mb-2 flex items-center gap-2 text-[12px] text-[#aaa]">
          <input
            type="checkbox"
            checked={onlyFormulas}
            onChange={(e) => setOnlyFormulas(e.target.checked)}
          />
          лише з формулами ({formulaCount})
        </label>
        <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-white/10">
          {shownExisting.length === 0 && (
            <p className="p-3 text-[12px] text-[#666]">Поки порожньо</p>
          )}
          {shownExisting.map((r) => (
            <button
              key={`${r.entity_type}:${r.slug}:${r.locale}`}
              type="button"
              onClick={() => pickExisting(r)}
              className="block w-full border-b border-white/5 px-3 py-2 text-left text-[12px] text-[#ccc] hover:bg-white/[0.04]"
            >
              <span className="text-[#888]">
                {ENTITY_LABEL[r.entity_type] ?? r.entity_type} · {r.locale}
              </span>
              {r.tokens && r.tokens.length > 0 && (
                <span
                  className="ml-1.5 rounded bg-[#E8FF47]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#E8FF47]"
                  title={r.tokens.join("  ")}
                >
                  ƒ {r.tokens.length}
                </span>
              )}
              <br />
              <span className="text-[#eee]">{r.slug}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex flex-col gap-4 lg:order-1">
        {/* Шпаргалка формул (токенів) — завжди під рукою */}
        <details open className="rounded-lg border border-[#E8FF47]/25 bg-[#E8FF47]/[0.04]">
          <summary className="cursor-pointer list-none px-3.5 py-2.5 text-[12px] font-bold uppercase tracking-[0.12em] text-[#E8FF47]">
            Формули — натисніть, щоб скопіювати ▾
          </summary>
          <div className="border-t border-[#E8FF47]/15 px-3.5 py-3">
            <div className="flex flex-col gap-1.5">
              {TOKEN_DEFS.map((t) => (
                <div key={t.label} className="flex items-baseline gap-2">
                  <button
                    type="button"
                    onClick={() => copyToken(t.insert)}
                    className="shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12px] text-[#E8FF47] hover:bg-white/[0.12]"
                    title="Скопіювати"
                  >
                    {t.label}
                  </button>
                  <span className="text-[12px] leading-snug text-[#aaa]">
                    {t.desc}
                    {copied === t.insert && (
                      <span className="ml-1 text-[#4ade80]">скопійовано ✓</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2.5 border-t border-white/10 pt-2 text-[11px] leading-relaxed text-[#777]">
              {TOKEN_NOTE}
            </p>
          </div>
        </details>

        {/* Ключ */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr_120px]">
          <label className="block">
            <span className="mb-1 block text-[12px] text-[#aaa]">Тип</span>
            <select
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setStatus("idle");
              }}
              className={field}
            >
              {Object.keys(ENTITY_LABEL).map((k) => (
                <option key={k} value={k}>
                  {ENTITY_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] text-[#aaa]">Slug</span>
            <input
              list="slug-suggestions"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setStatus("idle");
              }}
              placeholder="напр. nakladki / dignics-09c / butterfly"
              className={field}
            />
            <datalist id="slug-suggestions">
              {sugg.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.label}
                </option>
              ))}
            </datalist>
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] text-[#aaa]">Мова</span>
            <select
              value={locale}
              onChange={(e) => {
                setLocale(e.target.value);
                setStatus("idle");
              }}
              className={field}
            >
              <option value="uk">uk</option>
              <option value="ru">ru</option>
            </select>
          </label>
        </div>
        <div>
          <button
            type="button"
            onClick={() => load()}
            disabled={status === "loading"}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-[#ddd] hover:bg-white/[0.05] disabled:opacity-40"
          >
            {status === "loading" ? "Завантаження…" : "Завантажити"}
          </button>
        </div>

        {/* Мета */}
        <label className="block">
          <span className="mb-1 flex justify-between text-[12px] text-[#aaa]">
            <span>Meta title</span>
            <span className={metaTitle.length > 60 ? "text-[#f87171]" : "text-[#666]"}>
              {metaTitle.length}/~60
            </span>
          </span>
          <input
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            className={field}
          />
        </label>
        <label className="block">
          <span className="mb-1 flex justify-between text-[12px] text-[#aaa]">
            <span>Meta description</span>
            <span className={metaDescription.length > 155 ? "text-[#f87171]" : "text-[#666]"}>
              {metaDescription.length}/~155
            </span>
          </span>
          <textarea
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            rows={2}
            className={field}
          />
        </label>

        {/* Intro */}
        <label className="block">
          <span className="mb-1 block text-[12px] text-[#aaa]">Intro (короткий вступ під H1)</span>
          <textarea
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            rows={2}
            className={field}
          />
        </label>

        {/* Body */}
        <label className="block">
          <span className="mb-1 block text-[12px] text-[#aaa]">
            Body (markdown: ## H2, ### H3, **жирний**, *курсив*, - список, [текст](/посилання))
          </span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className={`${field} font-mono text-[13px]`}
          />
        </label>

        {/* FAQ */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] text-[#aaa]">FAQ (питання / відповідь)</span>
            <button
              type="button"
              onClick={() => setFaq((p) => [...p, { q: "", a: "" }])}
              className="rounded-md border border-white/15 px-2.5 py-1 text-[12px] text-[#ddd] hover:bg-white/[0.05]"
            >
              + питання
            </button>
          </div>
          <div className="flex flex-col gap-2.5">
            {faq.map((f, i) => (
              <div key={i} className="rounded-lg border border-white/10 p-2.5">
                <input
                  value={f.q}
                  onChange={(e) =>
                    setFaq((p) => p.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))
                  }
                  placeholder="Питання"
                  className={`${field} mb-2`}
                />
                <textarea
                  value={f.a}
                  onChange={(e) =>
                    setFaq((p) => p.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))
                  }
                  placeholder="Відповідь"
                  rows={2}
                  className={field}
                />
                <button
                  type="button"
                  onClick={() => setFaq((p) => p.filter((_, j) => j !== i))}
                  className="mt-1.5 text-[12px] text-[#f87171] hover:underline"
                >
                  Видалити
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Порівняння (JSON) */}
        <label className="block">
          <span className="mb-1 block text-[12px] text-[#aaa]">
            Порівняння (JSON, опц.):{" "}
            {`{ "heading": "...", "columns": [...], "rows": [{ "cells": [...], "href": "/..." }] }`}
          </span>
          <textarea
            value={comparison}
            onChange={(e) => setComparison(e.target.value)}
            rows={5}
            placeholder='{"columns":["Модель","Швидкість","Контроль"],"rows":[{"cells":["Dignics 05","9.5","8"],"href":"/uk/butterfly/nakladki/dignics-05"}]}'
            className={`${field} font-mono text-[12px]`}
          />
        </label>

        <label className="flex items-center gap-2 text-[13px] text-[#ccc]">
          <input type="checkbox" checked={noindex} onChange={(e) => setNoindex(e.target.checked)} />
          noindex (примусово закрити сторінку від індексації)
        </label>

        {/* Які формули вжито в ЦЬОМУ описі (оновлюється під час набору) */}
        <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3.5 py-2.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#888]">
            Формули в цьому описі
          </span>
          {blockTokens.length === 0 ? (
            <p className="mt-1 text-[12px] text-[#666]">Немає — текст статичний.</p>
          ) : (
            <ul className="mt-1.5 flex flex-col gap-1">
              {blockTokens.map((b) => (
                <li key={b.field} className="text-[12px] text-[#bbb]">
                  <span className="text-[#777]">{b.field}:</span>{" "}
                  {b.tokens.map((t) => (
                    <code
                      key={t}
                      className="mr-1 rounded bg-white/[0.06] px-1 py-0.5 font-mono text-[11px] text-[#E8FF47]"
                    >
                      {t}
                    </code>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center gap-3 border-t border-white/10 bg-[#080A0E]/95 py-3 backdrop-blur">
          <button
            type="button"
            onClick={save}
            disabled={status === "saving"}
            className="rounded-lg bg-[#E8FF47] px-5 py-2.5 text-sm font-bold text-[#080A0E] transition-opacity disabled:opacity-40"
          >
            {status === "saving" ? "Збереження…" : "Зберегти"}
          </button>
          {status === "saved" && <span className="text-sm text-[#4ade80]">✓ Збережено</span>}
          {status === "deleted" && (
            <span className="text-sm text-[#4ade80]">✓ Порожній блок — рядок видалено</span>
          )}
          {status === "error" && <span className="text-sm text-[#f87171]">⚠ {error}</span>}
        </div>

        <p className="text-[12px] leading-relaxed text-[#666]">
          Порожні поля не виводяться на сайті. Якщо очистити всі поля й зберегти — опис видаляється
          (фолбэк на дефолти каталогу). Зміни застосовуються без передеплою.
        </p>
      </div>
    </div>
  );
}
