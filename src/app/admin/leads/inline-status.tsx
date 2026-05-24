"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import type { LeadStatus } from "@/lib/supabase/types";
import { updateLeadStatusAction } from "./[id]/actions";

type Props = {
  leadId: string;
  currentStatus: LeadStatus;
};

const STATUS_META: Record<
  LeadStatus,
  { label: string; short: string; bg: string; text: string; dot: string }
> = {
  new:         { label: "Новый",       short: "Новый",     bg: "bg-white/[0.06]",     text: "text-[#aaa]",     dot: "#888" },
  qualified:   { label: "Квалиф.",     short: "Квалиф.",   bg: "bg-[#54A0FF]/[0.12]", text: "text-[#54A0FF]",  dot: "#54A0FF" },
  contacted:   { label: "Связались",   short: "Связ.",     bg: "bg-[#A29BFE]/[0.12]", text: "text-[#A29BFE]",  dot: "#A29BFE" },
  in_progress: { label: "В работе",    short: "В работе",  bg: "bg-[#FFA94D]/[0.12]", text: "text-[#FFA94D]",  dot: "#FFA94D" },
  won:         { label: "Купил",       short: "Купил",     bg: "bg-[#2ED573]/[0.14]", text: "text-[#2ED573]",  dot: "#2ED573" },
  unqualified: { label: "Неквалиф.",   short: "Неквалиф.", bg: "bg-[#FF6B81]/[0.10]", text: "text-[#FF6B81]",  dot: "#FF6B81" },
  lost:        { label: "Потерян",     short: "Потерян",   bg: "bg-[#FF6B81]/[0.10]", text: "text-[#FF6B81]",  dot: "#FF6B81" },
};

const ALL_STATUSES: LeadStatus[] = [
  "new",
  "qualified",
  "contacted",
  "in_progress",
  "won",
  "unqualified",
  "lost",
];

export function InlineStatus({ leadId, currentStatus }: Props) {
  const [optimistic, setOptimistic] = useState<LeadStatus>(currentStatus);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const meta = STATUS_META[optimistic];

  const handleChange = (next: LeadStatus) => {
    if (next === optimistic) {
      setOpen(false);
      return;
    }
    const prev = optimistic;
    setOptimistic(next);
    setOpen(false);

    startTransition(async () => {
      const res = await updateLeadStatusAction(leadId, next);
      if (!res.ok) {
        setOptimistic(prev);
      }
    });
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen((o) => !o);
        }}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 ${meta.bg} ${meta.text} text-[11px] font-bold uppercase tracking-[0.04em] rounded-md px-2 py-0.5 hover:opacity-80 transition-opacity disabled:opacity-50 cursor-pointer`}
      >
        <span>{meta.short}</span>
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          fill="none"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M1.5 3L4 5.5L6.5 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 left-0 min-w-[160px] bg-[#0E1117] border border-white/[0.1] rounded-lg shadow-xl py-1 overflow-hidden">
          {ALL_STATUSES.map((s) => {
            const m = STATUS_META[s];
            const isActive = s === optimistic;
            return (
              <button
                key={s}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleChange(s);
                }}
                className={`w-full text-left px-3 py-2 text-[12px] flex items-center gap-2 transition-colors ${
                  isActive
                    ? "bg-white/[0.05]"
                    : "hover:bg-white/[0.04]"
                }`}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: m.dot }}
                />
                <span className={`font-bold uppercase tracking-wide text-[11px] ${m.text}`}>
                  {m.label}
                </span>
                {isActive && (
                  <span className="ml-auto text-[#E8FF47] text-[11px]">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
