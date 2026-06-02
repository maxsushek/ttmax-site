"use client";

// src/components/admin/ContentImport.tsx
// Масовий імпорт контенту: вставив один JSON (масив блоків uk+ru або кілька сторінок) →
// кожен блок зберігається через /api/admin/content (upsert + revalidate = публікація без редеплою).
// Формат блоку = контракт API: { entityType, slug, locale, metaTitle?, metaDescription?,
// intro?, body?, faq?: [{q,a}], comparison?, noindex? }.
import { useState } from "react";
import { useRouter } from "next/navigation";

type Result = { key: string; ok: boolean; msg: string };
type Block = {
  entityType?: unknown;
  slug?: unknown;
  locale?: unknown;
  [k: string]: unknown;
};

const ENTITY = ["product", "category", "brand", "brandCategory", "series", "facet"];
const LOCALE = ["uk", "ru"];

/** Прибираємо обгортку ```json ... ``` якщо вона є, і парсимо. */
function parseInput(raw: string): Block[] {
  let s = raw.trim();
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fence && fence[1]) s = fence[1].trim();
  const data = JSON.parse(s);
  return Array.isArray(data) ? (data as Block[]) : [data as Block];
}

function validate(b: Block): string | null {
  if (typeof b.entityType !== "string" || !ENTITY.includes(b.entityType))
    return `entityType має бути одним з: ${ENTITY.join(", ")}`;
  if (typeof b.slug !== "string" || !b.slug.trim()) return "slug відсутній";
  if (typeof b.locale !== "string" || !LOCALE.includes(b.locale))
    return `locale має бути uk або ru`;
  return null;
}

export function ContentImport() {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const run = async () => {
    setParseError(null);
    setResults([]);
    let blocks: Block[];
    try {
      blocks = parseInput(raw);
    } catch (e) {
      setParseError("Не вдалося розпарсити JSON: " + (e instanceof Error ? e.message : "помилка"));
      return;
    }
    if (!blocks.length) {
      setParseError("Порожній масив — нема що імпортувати.");
      return;
    }

    setBusy(true);
    const out: Result[] = [];
    for (const b of blocks) {
      const key = `${(b.entityType as string) ?? "?"}/${(b.slug as string) ?? "?"}/${(b.locale as string) ?? "?"}`;
      const err = validate(b);
      if (err) {
        out.push({ key, ok: false, msg: err });
        continue;
      }
      try {
        const res = await fetch("/api/admin/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(b),
        });
        const j = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          deleted?: boolean;
          error?: string;
        };
        if (res.ok && j.ok)
          out.push({ key, ok: true, msg: j.deleted ? "видалено (порожній)" : "збережено" });
        else out.push({ key, ok: false, msg: j.error ?? `HTTP ${res.status}` });
      } catch {
        out.push({ key, ok: false, msg: "мережева помилка" });
      }
      setResults([...out]);
    }
    setBusy(false);
    if (out.some((r) => r.ok)) router.refresh(); // оновити список "Існуючі"
  };

  const okCount = results.filter((r) => r.ok).length;
  const errCount = results.length - okCount;

  return (
    <details open className="rounded-lg border border-[#E8FF47]/30 bg-[#E8FF47]/[0.05]">
      <summary className="cursor-pointer list-none px-4 py-3 text-[13px] font-bold uppercase tracking-[0.12em] text-[#E8FF47]">
        ▾ Імпорт із файлу — вставте JSON і опублікуйте
      </summary>
      <div className="border-t border-[#E8FF47]/15 px-4 py-4">
        <p className="mb-2 text-[12px] leading-relaxed text-[#aaa]">
          Вставте вміст JSON-файлу (масив блоків: uk + ru, можна кілька сторінок) і натисніть
          «Імпортувати». Кожен блок зберігається й публікується одразу — без перезавантаження сайту.
          Повторний імпорт того ж slug/мови перезаписує запис.
        </p>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={
            '[\n  { "entityType": "category", "slug": "nakladki", "locale": "uk", "metaTitle": "…", "intro": "…" },\n  { "entityType": "category", "slug": "nakladki", "locale": "ru", "metaTitle": "…", "intro": "…" }\n]'
          }
          spellCheck={false}
          className="h-44 w-full rounded-lg border border-white/10 bg-[#0B0E13] px-3 py-2 font-mono text-[12px] text-[#eee] outline-none focus:border-[#E8FF47]/40"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={run}
            disabled={busy || !raw.trim()}
            className="rounded-lg bg-[#E8FF47] px-4 py-2 text-sm font-bold text-black hover:brightness-95 disabled:opacity-40"
          >
            {busy ? "Імпорт…" : "Імпортувати та опублікувати"}
          </button>
          <button
            type="button"
            onClick={() => {
              setRaw("");
              setResults([]);
              setParseError(null);
            }}
            disabled={busy}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-[#ddd] hover:bg-white/[0.05] disabled:opacity-40"
          >
            Очистити
          </button>
          {results.length > 0 && (
            <span className="text-[12px] text-[#aaa]">
              <span className="text-[#4ade80]">✓ {okCount}</span>
              {errCount > 0 && <span className="ml-2 text-[#f87171]">✗ {errCount}</span>}
            </span>
          )}
        </div>

        {parseError && (
          <p className="mt-3 rounded-lg border border-[#f87171]/30 bg-[#f87171]/10 px-3 py-2 text-[12px] text-[#f87171]">
            {parseError}
          </p>
        )}

        {results.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1">
            {results.map((r, i) => (
              <li key={`${r.key}:${i}`} className="text-[12px]">
                <span className={r.ok ? "text-[#4ade80]" : "text-[#f87171]"}>
                  {r.ok ? "✓" : "✗"}
                </span>{" "}
                <code className="font-mono text-[#ccc]">{r.key}</code>{" "}
                <span className="text-[#888]">— {r.msg}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
