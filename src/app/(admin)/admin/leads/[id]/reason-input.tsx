"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { LeadStatus } from "@/lib/supabase/types";
import { useToast } from "./toast";
import {
  updateLeadQualificationReasonAction,
  updateLeadLossReasonAction,
} from "./actions";

type Props = {
  leadId: string;
  currentStatus: LeadStatus;
  initialQualificationReason: string | null;
  initialLossReason: string | null;
};

const QUALIFICATION_STATUSES: LeadStatus[] = [
  "qualified",
  "contacted",
  "in_progress",
  "won",
];
const LOSS_STATUSES: LeadStatus[] = ["unqualified", "lost"];

type Mode = "qualification" | "loss" | null;

function getMode(status: LeadStatus): Mode {
  if (QUALIFICATION_STATUSES.includes(status)) return "qualification";
  if (LOSS_STATUSES.includes(status)) return "loss";
  return null;
}

const PRESETS: Record<"qualification" | "loss", string[]> = {
  qualification: [
    "Серьёзный интерес",
    "Бюджет подтверждён",
    "Готов покупать в ближайшее время",
    "Постоянный игрок",
    "Тренер / клуб",
  ],
  loss: [
    "Дорого",
    "Не подошёл товар",
    "Передумал",
    "Спам / тест",
    "Не дозвонился",
    "Купил у конкурентов",
  ],
};

const LABELS: Record<"qualification" | "loss", { title: string; placeholder: string; color: string }> = {
  qualification: {
    title: "Почему квалифицирован",
    placeholder: "Что важно зафиксировать о клиенте?",
    color: "#54A0FF",
  },
  loss: {
    title: "Причина потери",
    placeholder: "Кратко: почему лид не закрылся",
    color: "#FF6B81",
  },
};

export function ReasonInput({
  leadId,
  currentStatus,
  initialQualificationReason,
  initialLossReason,
}: Props) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const mode = getMode(currentStatus);

  const initial =
    mode === "qualification"
      ? initialQualificationReason ?? ""
      : mode === "loss"
        ? initialLossReason ?? ""
        : "";

  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [justSaved, setJustSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // when mode switches (status changed), reset local value to its persisted source
  useEffect(() => {
    const next =
      mode === "qualification"
        ? initialQualificationReason ?? ""
        : mode === "loss"
          ? initialLossReason ?? ""
          : "";
    setValue(next);
    setSaved(next);
  }, [mode, initialQualificationReason, initialLossReason]);

  // auto-grow
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.max(ta.scrollHeight, 64)}px`;
  }, [value]);

  if (!mode) return null;

  const meta = LABELS[mode];
  const dirty = value !== saved;

  const handleSave = () => {
    if (!dirty || isPending) return;
    const next = value;
    startTransition(async () => {
      const res =
        mode === "qualification"
          ? await updateLeadQualificationReasonAction(leadId, next)
          : await updateLeadLossReasonAction(leadId, next);
      if (res.ok) {
        setSaved(next);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 1500);
      } else {
        toast.push("error", res.error ?? "Не удалось сохранить");
      }
    });
  };

  const applyPreset = (preset: string) => {
    setValue(preset);
    // immediate save
    startTransition(async () => {
      const res =
        mode === "qualification"
          ? await updateLeadQualificationReasonAction(leadId, preset)
          : await updateLeadLossReasonAction(leadId, preset);
      if (res.ok) {
        setSaved(preset);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 1500);
      } else {
        toast.push("error", res.error ?? "Не удалось сохранить");
      }
    });
  };

  return (
    <div className="bg-[#0E1117] border border-white/[0.06] rounded-2xl overflow-hidden">
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
          ) : dirty ? (
            <button
              onClick={handleSave}
              className="text-[11px] font-bold tracking-wide uppercase text-[#E8FF47] hover:opacity-80 transition-opacity"
            >
              Сохранить
            </button>
          ) : null}
        </div>
      </div>

      <div className="p-4">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          placeholder={meta.placeholder}
          className="w-full bg-transparent text-[14px] text-[#F0F0F0] placeholder:text-[#3a3a3a] outline-none resize-none leading-relaxed"
          style={{
            fontFamily: "'Barlow',sans-serif",
            minHeight: 64,
          }}
        />

        <div className="flex flex-wrap gap-1.5 mt-3">
          {PRESETS[mode].map((preset) => (
            <button
              key={preset}
              onClick={() => applyPreset(preset)}
              disabled={isPending}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[#888] hover:bg-white/[0.08] hover:text-[#ccc] hover:border-white/[0.12] transition-colors disabled:opacity-50"
              style={{ fontFamily: "'Barlow',sans-serif" }}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
