"use client";

import {
  useState,
  useTransition,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
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

const MENU_HEIGHT_ESTIMATE = 280;
const MENU_WIDTH = 180;

export function InlineStatus({ leadId, currentStatus }: Props) {
  const [optimistic, setOptimistic] = useState<LeadStatus>(currentStatus);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    placement: "below" | "above";
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Smart positioning — flip up if no room below
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;
    const spaceBelow = viewportH - rect.bottom;
    const placement: "below" | "above" =
      spaceBelow < MENU_HEIGHT_ESTIMATE && rect.top > MENU_HEIGHT_ESTIMATE
        ? "above"
        : "below";

    let left = rect.left;
    // Don't go off the right edge
    if (left + MENU_WIDTH > viewportW - 8) {
      left = viewportW - MENU_WIDTH - 8;
    }
    if (left < 8) left = 8;

    const top =
      placement === "below"
        ? rect.bottom + 4 + window.scrollY
        : rect.top - 4 + window.scrollY;

    setPos({ top, left: left + window.scrollX, placement });
  }, [open]);

  // Close on outside click / scroll / resize / escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScrollOrResize = () => setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
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

  const menuPortal =
    mounted && open && pos
      ? createPortal(
          <div
            ref={menuRef}
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              width: MENU_WIDTH,
              transform: pos.placement === "above" ? "translateY(-100%)" : "none",
              zIndex: 9999,
            }}
            className="bg-[#0E1117] border border-white/[0.1] rounded-lg shadow-2xl py-1 overflow-hidden"
          >
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
                    isActive ? "bg-white/[0.05]" : "hover:bg-white/[0.04]"
                  }`}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: m.dot }}
                  />
                  <span
                    className={`font-bold uppercase tracking-wide text-[11px] ${m.text}`}
                  >
                    {m.label}
                  </span>
                  {isActive && (
                    <span className="ml-auto text-[#E8FF47] text-[11px]">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={btnRef}
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
      {menuPortal}
    </>
  );
}
