"use client";

import { useState } from "react";
import { useToast } from "./toast";

type Props = {
  phone: string;
  email: string | null;
};

function formatPhoneUA(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 12 && digits.startsWith("380")) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
  }
  return raw;
}

export function ContactsPanel({ phone, email }: Props) {
  const toast = useToast();
  const [copied, setCopied] = useState<"phone" | "email" | null>(null);

  const handleCopy = async (value: string, kind: "phone" | "email") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      toast.push("success", "Скопировано");
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.push("error", "Не удалось скопировать");
    }
  };

  const phoneFormatted = formatPhoneUA(phone);
  const phoneClean = phone.replace(/[\s\-()]/g, "");

  return (
    <div className="bg-[#0E1117] border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.04]">
        <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#666]">
          Контакты
        </div>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {/* Phone */}
        <div className="flex items-stretch">
          <a
            href={`tel:${phoneClean}`}
            className="flex flex-1 items-center gap-3 px-4 py-4 min-h-[60px] hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2ED573]/[0.12] text-[18px] flex-shrink-0">
              📞
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#444] mb-0.5">
                Позвонить
              </div>
              <div className="text-[15px] font-bold text-[#F0F0F0] truncate">
                {phoneFormatted}
              </div>
            </div>
          </a>
          <button
            onClick={() => handleCopy(phoneClean, "phone")}
            className="flex h-auto w-12 items-center justify-center border-l border-white/[0.04] hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors text-[#666] hover:text-[#E8FF47]"
            aria-label="Скопировать номер"
          >
            <span className="text-[16px]">
              {copied === "phone" ? "✓" : "⧉"}
            </span>
          </button>
        </div>

        {/* Email */}
        {email ? (
          <div className="flex items-stretch">
            <a
              href={`mailto:${email}`}
              className="flex flex-1 items-center gap-3 px-4 py-4 min-h-[60px] hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#54A0FF]/[0.12] text-[18px] flex-shrink-0">
                ✉️
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#444] mb-0.5">
                  Email
                </div>
                <div
                  className="text-[14px] font-medium text-[#F0F0F0] truncate"
                  style={{ fontFamily: "'Barlow',sans-serif" }}
                >
                  {email}
                </div>
              </div>
            </a>
            <button
              onClick={() => handleCopy(email, "email")}
              className="flex h-auto w-12 items-center justify-center border-l border-white/[0.04] hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors text-[#666] hover:text-[#E8FF47]"
              aria-label="Скопировать email"
            >
              <span className="text-[16px]">
                {copied === "email" ? "✓" : "⧉"}
              </span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3.5 opacity-60">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.03] text-[16px] flex-shrink-0">
              ✉️
            </div>
            <div
              className="text-[13px] text-[#444]"
              style={{ fontFamily: "'Barlow',sans-serif" }}
            >
              Email не указан
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
