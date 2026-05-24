"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useToast } from "./toast";
import { updateLeadNotesAction } from "./actions";

type Props = {
  leadId: string;
  initialNotes: string | null;
};

export function NotesEditor({ leadId, initialNotes }: Props) {
  const toast = useToast();
  const [value, setValue] = useState(initialNotes ?? "");
  const [savedValue, setSavedValue] = useState(initialNotes ?? "");
  const [isPending, startTransition] = useTransition();
  const [justSaved, setJustSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // auto-grow
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.max(ta.scrollHeight, 120)}px`;
  }, [value]);

  const dirty = value !== savedValue;

  const handleSave = () => {
    if (!dirty || isPending) return;
    const next = value;
    startTransition(async () => {
      const res = await updateLeadNotesAction(leadId, next);
      if (res.ok) {
        setSavedValue(next);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 1500);
      } else {
        toast.push("error", res.error ?? "Не удалось сохранить заметки");
      }
    });
  };

  // Cmd+S / Ctrl+S
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="bg-[#0E1117] border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between gap-3">
        <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#666]">
          Заметки
        </div>
        <div className="flex items-center gap-2 min-h-[16px]">
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
          ) : (
            <span className="text-[11px] text-[#333]">·</span>
          )}
        </div>
      </div>

      <div className="p-4">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder="Запиши итог разговора, договорённости, важные детали…"
          className="w-full bg-transparent text-[14px] text-[#F0F0F0] placeholder:text-[#3a3a3a] outline-none resize-none leading-relaxed"
          style={{
            fontFamily: "'Barlow',sans-serif",
            minHeight: 120,
          }}
        />
      </div>

      <div className="px-4 pb-3 flex items-center justify-between text-[10px] text-[#333]">
        <span style={{ fontFamily: "'Barlow',sans-serif" }}>
          {value.length > 0 ? `${value.length} симв.` : "Пусто"}
        </span>
        <span style={{ fontFamily: "'Barlow',sans-serif" }}>
          Cmd + S чтобы сохранить
        </span>
      </div>
    </div>
  );
}
