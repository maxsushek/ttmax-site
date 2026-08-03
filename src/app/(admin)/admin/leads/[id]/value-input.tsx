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

const STATUS_LABELS: Record<
  LeadStatus,
  { title: string; hint: string; color: string }
> = {
  new: {
    title: "Ожидаемый чек",
    hint: "Можно прикинуть после звонка. Сейчас не обязательно.",
    color: "#888",
  },
  contacted: {
    title: "Ожидаемый чек",
    hint: "Бюджет клиента. Ракетка для новичка ~800–2000 ₴, любителя ~2000–5000 ₴, профи 5000+ ₴.",
    color: "#A29BFE",
  },
  qualified: {
    title: "Ожидаемый чек",
    hint: "Сумма по подобранному товару (ракетка + накладки, стол и т.д.).",
    color: "#54A0FF",
  },
  in_progress: {
    title: "Сумма заказа",
    hint: "Стоимость оформленного заказа. Финализируется когда клиент выкупит.",
    color: "#FFA94D",
  },
  won: {
    title: "Сумма выкупа",
    hint: "Финальная сумма что клиент заплатил. Попадёт в Revenue и attribution Ads.",
    color: "#2ED573",
  },
  unqualified: {
    title: "Сумма (не нужна)",
    hint: "Обычно не заполняется — клиент не наш.",
    color: "#666",
  },
  lost: {
    title: "Упущенный чек",
    hint: "Сколько мог стоить заказ если бы выкупил — для аналитики потерь.",
    color: "#FF6B81",
  },
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

export function ValueInput({ leadId, initialValue, currentStatus }: Props) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(
    initialValue !== null ? formatNumber(String(initialValue)) : ""
  );
  const [saved, setSaved] = useState(initialValue);
  const [justSaved, setJustSaved] = useState(false);

  const meta = STATUS_LABELS[currentStatus];
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
          style={{ color: meta.color }}
        >
          {meta.title}
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
            className="flex-1 bg-transparent outline-none text-[28px] font-black tracking-tight w-0 min-w-0"
            style={{
              color: meta.color,
              fontFamily: "'Barlow Condensed',sans-serif",
            }}
          />
          <span
            className="text-[24px] font-black"
            style={{
              color: meta.color,
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
          {meta.hint}
        </div>
      </div>
    </div>
  );
}
