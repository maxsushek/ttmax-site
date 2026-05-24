"use client";

import { useState, useTransition } from "react";
import { updateLeadValueAction } from "./[id]/actions";

type Props = {
  leadId: string;
  initialValue: number | null;
};

function formatNumber(v: string): string {
  const digits = v.replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function parseNumber(v: string): number | null {
  const digits = v.replace(/\D/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

export function InlineValue({ leadId, initialValue }: Props) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(
    initialValue !== null ? formatNumber(String(initialValue)) : ""
  );
  const [saved, setSaved] = useState(initialValue);
  const [editing, setEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const parsed = parseNumber(value);
  const dirty = parsed !== saved;

  const handleSave = () => {
    if (!dirty || isPending) {
      setEditing(false);
      return;
    }
    const next = parsed;
    startTransition(async () => {
      const res = await updateLeadValueAction(leadId, next);
      if (res.ok) {
        setSaved(next);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 1200);
      } else {
        // Откатываем UI к сохранённому
        setValue(saved !== null ? formatNumber(String(saved)) : "");
      }
      setEditing(false);
    });
  };

  // Display mode
  if (!editing) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setEditing(true);
        }}
        className="inline-flex items-center gap-1 hover:bg-white/[0.04] rounded px-1.5 py-0.5 -mx-1.5 -my-0.5 transition-colors group"
        title="Кликни чтобы редактировать"
      >
        {saved !== null && saved > 0 ? (
          <span className="font-bold text-[#E8FF47]">
            {saved.toLocaleString("uk-UA")} ₴
          </span>
        ) : (
          <span className="text-[#3a3a3a] group-hover:text-[#666] transition-colors">
            + ₴
          </span>
        )}
        {justSaved && (
          <span className="text-[#2ED573] text-[10px] ml-0.5">✓</span>
        )}
      </button>
    );
  }

  // Edit mode
  return (
    <div
      className="inline-flex items-center gap-1"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <input
        type="text"
        inputMode="numeric"
        autoFocus
        value={value}
        onChange={(e) => setValue(formatNumber(e.target.value))}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            setValue(saved !== null ? formatNumber(String(saved)) : "");
            setEditing(false);
          }
        }}
        disabled={isPending}
        placeholder="0"
        className="w-[80px] bg-white/[0.05] border border-[#E8FF47]/40 rounded px-1.5 py-0.5 text-right text-[13px] font-bold text-[#E8FF47] outline-none focus:border-[#E8FF47]/70 disabled:opacity-50"
        style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
      />
      <span className="text-[12px] text-[#E8FF47] font-bold">₴</span>
    </div>
  );
}
