"use client";

import Link from "next/link";

type Props = {
  name: string;
  createdAt: string;
  updatedAt: string;
};

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffD = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return "только что";
  if (diffMin < 60) return `${diffMin} мин назад`;
  if (diffH < 24) return `${diffH} ч назад`;
  if (diffD < 7) return `${diffD} дн назад`;

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: diffD > 365 ? "numeric" : undefined,
  });
}

function formatExactDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LeadHeader({ name, createdAt, updatedAt }: Props) {
  return (
    <div className="sticky top-0 z-30 bg-[#080A0E]/95 backdrop-blur-md border-b border-white/[0.05] -mx-5 px-5">
      <div className="py-3 flex items-center gap-3">
        <Link
          href="/admin/leads"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#888] hover:text-[#E8FF47] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all flex-shrink-0"
          aria-label="Назад к списку лидов"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        <div className="flex-1 min-w-0">
          <h1
            className="text-[18px] md:text-[22px] font-black uppercase tracking-tight leading-tight truncate"
            title={name}
          >
            {name}
          </h1>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#555] flex-wrap">
            <span
              style={{ fontFamily: "'Barlow',sans-serif" }}
              title={formatExactDate(createdAt)}
            >
              Создан {formatRelativeTime(createdAt)}
            </span>
            {createdAt !== updatedAt && (
              <>
                <span className="text-[#333]">·</span>
                <span
                  style={{ fontFamily: "'Barlow',sans-serif" }}
                  title={formatExactDate(updatedAt)}
                >
                  Изменён {formatRelativeTime(updatedAt)}
                </span>
              </>
            )}
          </div>
        </div>

        <Link
          href="/admin/leads"
          className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase text-[#666] hover:text-[#E8FF47] transition-colors px-3 py-2 rounded-lg hover:bg-white/[0.04] flex-shrink-0"
        >
          К списку →
        </Link>
      </div>
    </div>
  );
}
