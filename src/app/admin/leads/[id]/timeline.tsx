import type { LeadEventRow, LeadStatus } from "@/lib/supabase/types";

type Props = {
  events: LeadEventRow[];
};

const STATUS_META: Record<
  LeadStatus,
  { label: string; color: string; icon: string }
> = {
  new: { label: "Новый", color: "#888", icon: "○" },
  contacted: { label: "Контакт", color: "#A29BFE", icon: "📞" },
  qualified: { label: "Квалифицирован", color: "#54A0FF", icon: "✓" },
  in_progress: { label: "В работе", color: "#FFA502", icon: "⚡" },
  won: { label: "Купил", color: "#2ED573", icon: "🎉" },
  unqualified: { label: "Не квалиф.", color: "#666", icon: "—" },
  lost: { label: "Потерян", color: "#FF6B81", icon: "✕" },
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

function formatExactTime(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Timeline({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="bg-[#0E1117] border border-white/[0.06] rounded-2xl p-6 text-center">
        <div className="text-2xl mb-2 opacity-40">⏱</div>
        <div
          className="text-[13px] text-[#555]"
          style={{ fontFamily: "'Barlow',sans-serif" }}
        >
          События пока отсутствуют
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0E1117] border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
        <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#666]">
          История изменений
        </div>
        <span
          className="text-[11px] text-[#444]"
          style={{ fontFamily: "'Barlow',sans-serif" }}
        >
          {events.length} {events.length === 1 ? "событие" : "событий"}
        </span>
      </div>

      <div className="relative px-4 py-4">
        {/* Vertical line */}
        <div className="absolute left-[28px] top-6 bottom-6 w-px bg-white/[0.06]" />

        <div className="space-y-4">
          {events.map((event, idx) => {
            const toMeta = STATUS_META[event.to_status];
            const fromMeta = event.from_status
              ? STATUS_META[event.from_status]
              : null;
            const isFirst = idx === 0;

            return (
              <div key={event.id} className="relative flex gap-3">
                {/* Dot */}
                <div
                  className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full flex-shrink-0 text-[12px] border-2"
                  style={{
                    background: "#0E1117",
                    borderColor: toMeta.color,
                    color: toMeta.color,
                    boxShadow: isFirst
                      ? `0 0 0 4px ${toMeta.color}1a`
                      : undefined,
                  }}
                >
                  {toMeta.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    {fromMeta ? (
                      <span
                        className="text-[12px]"
                        style={{ fontFamily: "'Barlow',sans-serif", color: "#aaa" }}
                      >
                        <span style={{ color: fromMeta.color }}>
                          {fromMeta.label}
                        </span>
                        <span className="mx-1.5 text-[#444]">→</span>
                        <span
                          className="font-bold"
                          style={{ color: toMeta.color }}
                        >
                          {toMeta.label}
                        </span>
                      </span>
                    ) : (
                      <span
                        className="text-[12px] font-bold"
                        style={{ color: toMeta.color }}
                      >
                        Создан: {toMeta.label}
                      </span>
                    )}
                  </div>

                  {event.reason && (
                    <div
                      className="mt-1 text-[12px] text-[#888] leading-relaxed"
                      style={{ fontFamily: "'Barlow',sans-serif" }}
                    >
                      &laquo;{event.reason}&raquo;
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-[11px] text-[#555]"
                      style={{ fontFamily: "'Barlow',sans-serif" }}
                      title={formatExactTime(event.created_at)}
                    >
                      {formatRelativeTime(event.created_at)}
                    </span>
                    {event.changed_by && (
                      <>
                        <span className="text-[10px] text-[#333]">·</span>
                        <span
                          className="text-[11px] text-[#555] truncate"
                          style={{ fontFamily: "'Barlow',sans-serif" }}
                        >
                          {event.changed_by}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
