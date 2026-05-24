"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

const STATUS_OPTIONS = [
  { value: "", label: "Все статусы" },
  { value: "new", label: "Новые" },
  { value: "qualified", label: "Квалиф." },
  { value: "unqualified", label: "Неквалиф." },
  { value: "contacted", label: "Связались" },
  { value: "in_progress", label: "В работе" },
  { value: "won", label: "Купили" },
  { value: "lost", label: "Потеряны" },
];

const RANGE_OPTIONS = [
  { value: "", label: "За всё время" },
  { value: "today", label: "Сегодня" },
  { value: "week", label: "7 дней" },
  { value: "month", label: "30 дней" },
];

export function LeadsFilters({
  currentStatus,
  currentSource,
  currentQuery,
  currentRange,
  sources,
}: {
  currentStatus?: string;
  currentSource?: string;
  currentQuery?: string;
  currentRange?: string;
  sources: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(currentQuery ?? "");

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateFilter("q", searchInput.trim());
  };

  const reset = () => {
    setSearchInput("");
    startTransition(() => router.push(pathname));
  };

  const hasActiveFilters =
    !!currentStatus || !!currentSource || !!currentQuery || !!currentRange;

  const selectClass =
    "bg-[#0E1117] border border-white/[0.08] text-[#ccc] text-[13px] font-medium font-['Barlow',sans-serif] rounded-lg px-3 py-2 outline-none hover:border-white/[0.18] focus:border-[#E8FF47]/40 transition-colors cursor-pointer min-w-[140px]";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={currentStatus ?? ""}
        onChange={(e) => updateFilter("status", e.target.value)}
        disabled={isPending}
        className={selectClass}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        value={currentSource ?? ""}
        onChange={(e) => updateFilter("source", e.target.value)}
        disabled={isPending || sources.length === 0}
        className={selectClass}
      >
        <option value="">Все источники</option>
        {sources.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={currentRange ?? ""}
        onChange={(e) => updateFilter("range", e.target.value)}
        disabled={isPending}
        className={selectClass}
      >
        {RANGE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <form onSubmit={handleSearch} className="flex-1 min-w-[200px] flex gap-2">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Поиск: имя, телефон, email..."
          className="flex-1 bg-[#0E1117] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-[#ccc] outline-none placeholder:text-[#3a3a3a] hover:border-white/[0.18] focus:border-[#E8FF47]/40 transition-colors font-['Barlow',sans-serif]"
        />
        <button
          type="submit"
          disabled={isPending}
          className="bg-white/[0.05] border border-white/[0.08] hover:border-white/[0.2] text-[#ccc] hover:text-white text-[12px] font-bold tracking-[0.08em] uppercase rounded-lg px-4 transition-colors disabled:opacity-50"
        >
          Найти
        </button>
      </form>

      {hasActiveFilters && (
        <button
          onClick={reset}
          disabled={isPending}
          className="text-[12px] font-bold tracking-[0.08em] uppercase text-[#FF6B81]/80 hover:text-[#FF6B81] border border-[#FF6B81]/20 hover:border-[#FF6B81]/40 rounded-lg px-3 py-2 transition-colors"
        >
          ✕ Сброс
        </button>
      )}
    </div>
  );
}
