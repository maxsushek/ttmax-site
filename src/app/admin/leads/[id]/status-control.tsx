"use client";

import { useState, useTransition } from "react";
import type { LeadStatus } from "@/lib/supabase/types";
import { useToast } from "./toast";
import { updateLeadStatusAction } from "./actions";

type Props = {
  leadId: string;
  currentStatus: LeadStatus;
};

type StatusMeta = {
  value: LeadStatus;
  label: string;
  color: string;
  bg: string;
  icon: string;
  description: string;
  hint: string;
  terminal?: boolean;
};

const STATUSES: StatusMeta[] = [
  {
    value: "new",
    label: "Новый",
    color: "#888",
    bg: "rgba(255,255,255,0.06)",
    icon: "○",
    description: "Заявка на консультацию",
    hint: "Клиент оставил заявку, но мы ещё не звонили. Свяжись в ближайшее время.",
  },
  {
    value: "contacted",
    label: "Связались",
    color: "#A29BFE",
    bg: "rgba(162,155,254,0.08)",
    icon: "📞",
    description: "Дозвонились, узнали что нужно",
    hint: "Узнали уровень игры (новичок / любитель / профи), стиль, бюджет. Товар пока не подбирали.",
  },
  {
    value: "qualified",
    label: "Целевой клиент",
    color: "#54A0FF",
    bg: "rgba(84,160,255,0.08)",
    icon: "✓",
    description: "Хочет купить, выбрали товар",
    hint: "Клиент чётко понимает что нужно, бюджет адекватный. Согласовали модели. Готов оформлять заказ.",
  },
  {
    value: "in_progress",
    label: "Заказал",
    color: "#FFA502",
    bg: "rgba(255,165,2,0.08)",
    icon: "📦",
    description: "Оставил данные для доставки",
    hint: "Принял заказ — адрес НП, ФИО получателя. Уточни способ оплаты (предоплата / наложка / при получении) и запиши в заметки. Ждём отправки или выкупа.",
  },
  {
    value: "won",
    label: "Выкупил",
    color: "#2ED573",
    bg: "rgba(46,213,115,0.08)",
    icon: "🎉",
    description: "Получил товар, оплата прошла",
    hint: "Клиент забрал заказ на НП / самовывозом, или курьер доставил и оплата получена. ⚠️ Финальный статус — попадёт в Revenue и Google/Meta Ads.",
    terminal: true,
  },
  {
    value: "unqualified",
    label: "Не наш клиент",
    color: "#666",
    bg: "rgba(255,255,255,0.04)",
    icon: "—",
    description: "Спам / не ЦА",
    hint: "Ошиблись номером, спам-бот, продают свои услуги, или ищут товар которого у нас нет (промышленные роботы, столы для соревнований и т.д.).",
  },
  {
    value: "lost",
    label: "Не выкупил",
    color: "#FF6B81",
    bg: "rgba(255,107,129,0.08)",
    icon: "✕",
    description: "Отказался / не забрал",
    hint: "Не забрал посылку с НП через 7 дней, отказался от заказа, передумал, нашёл дешевле, не дозвонились. Укажи причину — для аналитики.",
    terminal: true,
  },
];

export function StatusControl({ leadId, currentStatus }: Props) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<LeadStatus>(currentStatus);
  const [confirm, setConfirm] = useState<StatusMeta | null>(null);

  const handleChange = (next: StatusMeta) => {
    if (next.value === optimistic) return;
    if (next.terminal) {
      setConfirm(next);
      return;
    }
    commit(next);
  };

  const commit = (next: StatusMeta) => {
    const prev = optimistic;
    setOptimistic(next.value);
    setConfirm(null);

    startTransition(async () => {
      const res = await updateLeadStatusAction(leadId, next.value);
      if (res.ok) {
        toast.push("success", `Статус: ${next.label}`);
      } else {
        setOptimistic(prev);
        toast.push("error", res.error ?? "Не удалось обновить статус");
      }
    });
  };

  const currentMeta = (STATUSES.find((s) => s.value === optimistic) ?? STATUSES[0])!;

  return (
    <div className="bg-[#0E1117] border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between gap-3">
        <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#666]">
          Статус
        </div>
        {isPending && (
          <span
            className="text-[11px] text-[#666]"
            style={{ fontFamily: "'Barlow',sans-serif" }}
          >
            Сохранение…
          </span>
        )}
      </div>

      {/* Current status pill + hint */}
      <div className="px-4 pt-4 pb-3">
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors mb-2"
          style={{
            background: currentMeta.bg,
            border: `1px solid ${currentMeta.color}33`,
          }}
        >
          <span className="text-[13px]">{currentMeta.icon}</span>
          <span
            className="text-[12px] font-bold tracking-wide uppercase"
            style={{ color: currentMeta.color }}
          >
            {currentMeta.label}
          </span>
        </div>
        <p
          className="text-[12px] leading-relaxed text-[#888]"
          style={{ fontFamily: "'Barlow',sans-serif" }}
        >
          {currentMeta.hint}
        </p>
      </div>

      {/* Mobile: horizontal scroll */}
      <div className="md:hidden">
        <div
          className="flex gap-2 px-4 pb-4 overflow-x-auto"
          style={{
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {STATUSES.map((s) => {
            const active = s.value === optimistic;
            return (
              <button
                key={s.value}
                onClick={() => handleChange(s)}
                disabled={isPending}
                className="flex-shrink-0 rounded-xl px-3 py-2.5 transition-all disabled:opacity-50 active:scale-[0.96]"
                style={{
                  background: active ? s.bg : "rgba(255,255,255,0.02)",
                  border: `1.5px solid ${active ? s.color : "rgba(255,255,255,0.06)"}`,
                }}
              >
                <div
                  className="text-[11px] font-bold tracking-wide uppercase whitespace-nowrap"
                  style={{ color: active ? s.color : "#888" }}
                >
                  <span className="mr-1">{s.icon}</span>
                  {s.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: grid */}
      <div className="hidden md:block px-4 pb-4">
        <div className="grid grid-cols-2 gap-2">
          {STATUSES.map((s) => {
            const active = s.value === optimistic;
            return (
              <button
                key={s.value}
                onClick={() => handleChange(s)}
                disabled={isPending}
                className="text-left rounded-xl px-3 py-2.5 transition-all disabled:opacity-50 hover:bg-white/[0.03] group"
                style={{
                  background: active ? s.bg : "rgba(255,255,255,0.02)",
                  border: `1.5px solid ${active ? s.color : "rgba(255,255,255,0.06)"}`,
                }}
                title={s.hint}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[13px]">{s.icon}</span>
                  <span
                    className="text-[12px] font-bold tracking-wide uppercase"
                    style={{ color: active ? s.color : "#aaa" }}
                  >
                    {s.label}
                  </span>
                </div>
                <div
                  className="text-[11px] text-[#555] leading-snug"
                  style={{ fontFamily: "'Barlow',sans-serif" }}
                >
                  {s.description}
                </div>
              </button>
            );
          })}
        </div>
        <p
          className="text-[10px] text-[#444] mt-2 italic"
          style={{ fontFamily: "'Barlow',sans-serif" }}
        >
          Наведи на статус чтобы увидеть когда его применять
        </p>
      </div>

      {/* Confirm modal */}
      {confirm && (
        <div
          className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirm(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#0E1117] border border-white/[0.08] rounded-2xl p-5 shadow-2xl"
            style={{
              animation: "slideUp 0.25s cubic-bezier(0.2, 0.9, 0.4, 1)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[20px]"
                style={{ background: confirm.bg, border: `1px solid ${confirm.color}33` }}
              >
                {confirm.icon}
              </div>
              <div>
                <div className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#666] mb-0.5">
                  Подтвердить статус
                </div>
                <div
                  className="text-[16px] font-black uppercase tracking-tight"
                  style={{ color: confirm.color }}
                >
                  {confirm.label}
                </div>
              </div>
            </div>
            <p
              className="text-[13px] text-[#888] leading-relaxed mb-4"
              style={{ fontFamily: "'Barlow',sans-serif" }}
            >
              {confirm.hint}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-[13px] font-bold tracking-wide uppercase text-[#888] hover:bg-white/[0.08] transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => commit(confirm)}
                className="flex-1 py-3 rounded-xl text-[13px] font-bold tracking-wide uppercase transition-opacity hover:opacity-90"
                style={{
                  background: confirm.color,
                  color: "#080A0E",
                }}
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
