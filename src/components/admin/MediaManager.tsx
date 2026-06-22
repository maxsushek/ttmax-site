// src/components/admin/MediaManager.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cldUrl, isCloudinaryConfigured } from "@/lib/cloudinary/url";
import type { EntityType } from "@/lib/media/types";

export type MediaEntity = {
  type: EntityType;
  slug: string;
  label: string;
  group: string;
};

type MediaRow = {
  id: string;
  entity_type: EntityType;
  entity_slug: string;
  public_id: string;
  format: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  sort: number | null;
};

export function MediaManager({ entities }: { entities: MediaEntity[] }) {
  const cloudReady = isCloudinaryConfigured();

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MediaEntity | null>(entities[0] ?? null);
  const [items, setItems] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? entities.filter(
          (e) => e.label.toLowerCase().includes(q) || e.slug.toLowerCase().includes(q),
        )
      : entities;
    const byGroup = new Map<string, MediaEntity[]>();
    for (const e of filtered) {
      const arr = byGroup.get(e.group) ?? [];
      arr.push(e);
      byGroup.set(e.group, arr);
    }
    return [...byGroup.entries()];
  }, [entities, query]);

  const loadItems = async (e: MediaEntity) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/media?type=${e.type}&slug=${encodeURIComponent(e.slug)}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setItems([]);
      setError("Не вдалося завантажити список");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selected) void loadItems(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.type, selected?.slug]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selected) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        // 1) подпись
        const signRes = await fetch("/api/admin/cloudinary-sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: selected.type, slug: selected.slug }),
        });
        if (!signRes.ok) throw new Error("Помилка підпису (Cloudinary не налаштовано?)");
        const sign = await signRes.json();

        // 2) прямая загрузка в Cloudinary
        const form = new FormData();
        form.append("file", file);
        form.append("api_key", sign.apiKey);
        form.append("timestamp", String(sign.timestamp));
        form.append("folder", sign.folder);
        form.append("signature", sign.signature);

        const upRes = await fetch(
          `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
          { method: "POST", body: form },
        );
        if (!upRes.ok) throw new Error("Cloudinary відхилив завантаження");
        const up = await upRes.json();

        // 3) сохранить ссылку
        const saveRes = await fetch("/api/admin/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: selected.type,
            slug: selected.slug,
            publicId: up.public_id,
            format: up.format ?? null,
            width: up.width ?? null,
            height: up.height ?? null,
          }),
        });
        if (!saveRes.ok) throw new Error("Не вдалося зберегти в базу");
      }
      await loadItems(selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка завантаження");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = async (row: MediaRow) => {
    if (!confirm("Видалити це зображення?")) return;
    setError(null);
    try {
      const res = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, publicId: row.public_id }),
      });
      if (!res.ok) throw new Error("Не вдалося видалити");
      if (selected) await loadItems(selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка видалення");
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (!selected || savingOrder || target < 0 || target >= items.length) return;
    const next = items.slice();
    const a = next[index];
    const b = next[target];
    if (!a || !b) return;
    next[index] = b;
    next[target] = a;
    setItems(next); // оптимістично
    setSavingOrder(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selected.type,
          slug: selected.slug,
          order: next.map((r) => r.id),
        }),
      });
      if (!res.ok) throw new Error("Не вдалося зберегти порядок");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка збереження порядку");
      await loadItems(selected); // відкат до стану БД
    } finally {
      setSavingOrder(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* Список сущностей */}
      <aside className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Пошук товару / категорії…"
          className="mb-3 w-full rounded-lg border border-white/10 bg-[#0E1117] px-3 py-2 text-sm text-white outline-none placeholder:text-[#555] focus:border-[#E8FF47]/50"
        />
        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {groups.map(([group, list]) => (
            <div key={group}>
              <div className="mb-1 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#666]">
                {group}
              </div>
              <ul className="space-y-0.5">
                {list.map((e) => {
                  const active = selected?.type === e.type && selected?.slug === e.slug;
                  return (
                    <li key={`${e.type}:${e.slug}`}>
                      <button
                        type="button"
                        onClick={() => setSelected(e)}
                        className={`w-full truncate rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                          active
                            ? "bg-[#E8FF47] font-semibold text-black"
                            : "text-[#bbb] hover:bg-white/[0.05] hover:text-white"
                        }`}
                      >
                        {e.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </aside>

      {/* Загрузка + галерея */}
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        {!cloudReady && (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/[0.08] px-3 py-2 text-sm text-amber-200">
            Не задано <code>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code> — прев'ю та завантаження не
            працюватимуть, поки не додаси змінні Cloudinary у Vercel.
          </div>
        )}

        {selected ? (
          <>
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <div>
                <div className="font-bold text-white">{selected.label}</div>
                <div className="text-xs text-[#666]">
                  {selected.type} · {selected.slug}
                </div>
              </div>
            </div>

            <label
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                uploading
                  ? "border-[#E8FF47]/40 bg-[#E8FF47]/[0.04]"
                  : "border-white/15 hover:border-[#E8FF47]/50 hover:bg-white/[0.03]"
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void handleFiles(e.dataTransfer.files);
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading || !cloudReady}
                onChange={(e) => void handleFiles(e.target.files)}
              />
              <span className="font-display text-sm font-bold uppercase tracking-[0.08em] text-white">
                {uploading ? "Завантаження…" : "Перетягни фото або натисни"}
              </span>
              <span className="mt-1 text-xs text-[#666]">JPG, PNG, WebP · можна декілька</span>
            </label>

            {error && (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/[0.08] px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="mt-5">
              {loading ? (
                <div className="py-6 text-center text-sm text-[#666]">Завантаження…</div>
              ) : items.length === 0 ? (
                <div className="py-6 text-center text-sm text-[#666]">Поки немає зображень</div>
              ) : (
                <>
                  <div className="mb-2 text-xs text-[#666]">
                    Порядок = послідовність фото на сайті. Тисни ◀ ▶, щоб переставити (№1 — головне фото).
                  </div>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {items.map((row, index) => (
                      <li
                        key={row.id}
                        className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#0E1117]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cldUrl(row.public_id, { w: 300, h: 300 })}
                          alt={row.alt ?? ""}
                          loading="lazy"
                          className="aspect-square w-full object-cover"
                        />
                        <span className="absolute left-1.5 top-1.5 flex h-6 min-w-[24px] items-center justify-center rounded-md bg-black/75 px-1.5 text-[11px] font-bold text-[#E8FF47]">
                          {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => void remove(row)}
                          className="absolute right-1.5 top-1.5 rounded-md bg-black/70 px-2 py-1 text-[11px] font-bold text-red-300 opacity-0 transition-opacity hover:bg-black/90 group-hover:opacity-100"
                        >
                          Видалити
                        </button>
                        <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between gap-1">
                          <button
                            type="button"
                            disabled={index === 0 || savingOrder}
                            onClick={() => void move(index, -1)}
                            title="Перемістити лівіше"
                            aria-label="Перемістити лівіше"
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-black/75 text-sm text-white transition-colors hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-25"
                          >
                            ◀
                          </button>
                          <button
                            type="button"
                            disabled={index === items.length - 1 || savingOrder}
                            onClick={() => void move(index, 1)}
                            title="Перемістити правіше"
                            aria-label="Перемістити правіше"
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-black/75 text-sm text-white transition-colors hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-25"
                          >
                            ▶
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="py-10 text-center text-sm text-[#666]">Оберіть товар або категорію</div>
        )}
      </section>
    </div>
  );
}
