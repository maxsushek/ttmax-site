"use client";

import { useState, useTransition } from "react";
import type { LeadStatus } from "@/lib/supabase/types";
import { useToast } from "./toast";
import { updateLeadValueAction } from "./actions";

type Props = {
  leadId: string;
  initialValue: number | null;
  currentStatus: LeadStatus;
};

const RELEVANT_STATUSES: LeadStatus[] = ["in_progress", "won"];

function formatNumber(v: string): string {
  // оставляем только цифры
  const digits = v.replace(/\D/g, "");
  if (!digits) return "";
  // форматируем пробелами по 3 цифры справа
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function parseNumber(v: string): number | null {
  const digits = v.replace(/\D/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

export function ValueInput({ leadId, initialValue, currentStatus }: Props) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(
    initialValue !== null ? formatNumber(String(initialValue)) : ""
  );
  const [saved, setSaved] = useState(initialValue);
  const [justSaved, setJustSaved] = useState(false);

  const isRelevant = RELEVANT_STATUSES.includes(currentStatus);
  if (!isRelevant) return null;

  const isWon = currentStatus === "won";
  const parsed = parseNumber(value);
  const dirty = parsed !== saved;

  const handleSave = () => {
    if (!dirty || isPending) return;
    const next = parsed;
    startTransition(async () => {
      const res = await updateLeadValueAction(leadId, next);
      if (res.ok) {
        setSaved(next);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 1500);
      } else {
        toast.push("error", res.error ?? "Не удалось сохранить сумму");
      }
    });
  };

  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{
        background: isWon ? "rgba(46,213,115,0.04)" : "#0E1117",
        borderColor: isWon ? "rgba(46,213,115,0.18)" : "rgba(255,255,255,0.06)",
      }}
    >
      <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between gap-3">
        <div
          className="text-[10px] font-bold tracking-[0.16em] uppercase"
          style={{ color: isWon ? "#2ED573" : "#666" }}
        >
          {isWon ? "Сумма сделки" : "Ожидаемая сумма"}
        </div>
        <div className="min-h-[16px] flex items-center">
          {isPending ? (
            <span
              className="text-[11px] text-[#666]"
              style={{ fontFamily: "'Barlow',sans-serif" }}
            >
              Сохранение…
            </span>
          ) : justSaved ? (
            <span
              className="text-[11px] text-[#2ED573] flex items-center gap-1"
              style={{ fontFamily: "'Barlow',sans-serif" }}
            >
              <span>✓</span> Сохранено
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(formatNumber(e.target.value))}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
            placeholder="0"
            className="flex-1 bg-transparent outline-none text-[28px] font-black tracking-tight"
            style={{
              color: isWon ? "#2ED573" : "#E8FF47",
              fontFamily: "'Barlow Condensed',sans-serif",
            }}
          />
          <span
            className="text-[24px] font-black"
            style={{
              color: isWon ? "#2ED573" : "#E8FF47",
              fontFamily: "'Barlow Condensed',sans-serif",
            }}
          >
            ₴
          </span>
        </div>

        <div
          className="text-[11px] text-[#444] mt-1"
          style={{ fontFamily: "'Barlow',sans-serif" }}
        >
          {isWon
            ? "Эта сумма попадёт в метрику Revenue и в attribution для рекламы"
            : "Прогноз для расчёта pipeline value"}
        </div>
      </div>
    </div>
  );
}
