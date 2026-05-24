import Link from "next/link";
import type { LeadRow, LeadStatus } from "@/lib/supabase/types";

const STATUS_META: Record<LeadStatus, { label: string; bg: string; text: string }> = {
  new:         { label: "Новый",       bg: "bg-white/[0.06]",       text: "text-[#aaa]" },
  qualified:   { label: "Квалиф.",     bg: "bg-[#54A0FF]/[0.12]",   text: "text-[#54A0FF]" },
  unqualified: { label: "Неквалиф.",   bg: "bg-[#FF6B81]/[0.10]",   text: "text-[#FF6B81]" },
  contacted:   { label: "Связались",   bg: "bg-[#A29BFE]/[0.12]",   text: "text-[#A29BFE]" },
  in_progress: { label: "В работе",    bg: "bg-[#FFA94D]/[0.12]",   text: "text-[#FFA94D]" },
  won:         { label: "Купил",       bg: "bg-[#2ED573]/[0.14]",   text: "text-[#2ED573]" },
  lost:        { label: "Потерян",     bg: "bg-[#FF6B81]/[0.10]",   text: "text-[#FF6B81]" },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = diffMs / (1000 * 60 * 60);
  if (diffH < 1) return `${Math.max(1, Math.floor(diffMs / 60000))} мин назад`;
  if (diffH < 24) return `${Math.floor(diffH)} ч назад`;
  if (diffH < 24 * 7)
    return d.toLocaleDateString("uk-UA", { day: "2-digit", month: "short" });
  return d.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function formatPhone(p: string): string {
  // Превращаем +380501234567 → +380 50 123 45 67
  const d = p.replace(/\D/g, "");
  if (d.startsWith("380") && d.length === 12) {
    return `+380 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`;
  }
  return p;
}

export function LeadsTable({ leads }: { leads: LeadRow[] }) {
  return (
    <div className="bg-[#0E1117] border border-white/[0.06] rounded-2xl overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-[13px] font-['Barlow',sans-serif]">
          <thead className="bg-white/[0.02] border-b border-white/[0.05]">
            <tr className="text-[10px] uppercase tracking-[0.12em] font-bold text-[#555]">
              <th className="text-left px-4 py-3">Дата</th>
              <th className="text-left px-4 py-3">Имя</th>
              <th className="text-left px-4 py-3">Контакты</th>
              <th className="text-left px-4 py-3">Источник</th>
              <th className="text-left px-4 py-3">Статус</th>
              <th className="text-right px-4 py-3">Сумма</th>
              <th className="text-right px-4 py-3 w-[100px]"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const meta = STATUS_META[lead.status];
              return (
                <tr
                  key={lead.id}
                  className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3 text-[#777] whitespace-nowrap">
                    {formatDate(lead.created_at)}
                  </td>
                  <td className="px-4 py-3 font-bold text-white max-w-[180px] truncate">
                    {lead.name}
                  </td>
                  <td className="px-4 py-3 text-[#aaa] whitespace-nowrap">
                    <a
                      href={`tel:${lead.phone}`}
                      className="block hover:text-[#E8FF47] transition-colors"
                    >
                      {formatPhone(lead.phone)}
                    </a>
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}`}
                        className="block text-[11px] text-[#555] hover:text-[#aaa] transition-colors mt-0.5"
                      >
                        {lead.email}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#888] text-[12px] whitespace-nowrap">
                    <div>{lead.source}</div>
                    <div className="text-[10px] uppercase text-[#444] tracking-wider">
                      {lead.locale}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block ${meta.bg} ${meta.text} text-[11px] font-bold uppercase tracking-[0.04em] rounded-md px-2 py-0.5`}
                    >
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {lead.value_uah ? (
                      <span className="font-bold text-[#E8FF47]">
                        {Number(lead.value_uah).toLocaleString("uk-UA")} ₴
                      </span>
                    ) : (
                      <span className="text-[#3a3a3a]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="text-[11px] font-bold tracking-[0.06em] uppercase text-[#E8FF47] hover:text-white border border-[#E8FF47]/30 hover:border-white/40 hover:bg-white/[0.04] rounded-md px-2.5 py-1 transition-colors inline-block"
                    >
                      Открыть →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-white/[0.05]">
        {leads.map((lead) => {
          const meta = STATUS_META[lead.status];
          return (
            <Link
              key={lead.id}
              href={`/admin/leads/${lead.id}`}
              className="block p-4 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="font-bold text-white truncate flex-1">{lead.name}</div>
                <span
                  className={`shrink-0 ${meta.bg} ${meta.text} text-[10px] font-bold uppercase tracking-wider rounded px-2 py-0.5`}
                >
                  {meta.label}
                </span>
              </div>
              <div className="font-['Barlow',sans-serif] text-[13px] text-[#888]">
                {formatPhone(lead.phone)}
              </div>
              <div className="flex items-center justify-between mt-2 text-[11px] font-['Barlow',sans-serif]">
                <span className="text-[#555]">
                  {lead.source} · {formatDate(lead.created_at)}
                </span>
                {lead.value_uah && (
                  <span className="font-bold text-[#E8FF47]">
                    {Number(lead.value_uah).toLocaleString("uk-UA")} ₴
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
