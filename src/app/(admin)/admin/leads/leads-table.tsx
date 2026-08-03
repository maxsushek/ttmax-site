import Link from "next/link";
import type { LeadRow } from "@/lib/supabase/types";
import { InlineStatus } from "./inline-status";
import { InlineValue } from "./inline-value";

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
  const d = p.replace(/\D/g, "");
  if (d.startsWith("380") && d.length === 12) {
    return `+380 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`;
  }
  return p;
}

export function LeadsTable({ leads }: { leads: LeadRow[] }) {
  return (
    <div className="bg-[#0E1117] border border-white/[0.06] rounded-2xl overflow-visible">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto overflow-y-visible">
        <table className="w-full text-[13px] font-['Barlow',sans-serif]">
          <thead className="bg-white/[0.02] border-b border-white/[0.05]">
            <tr className="text-[10px] uppercase tracking-[0.12em] font-bold text-[#555]">
              <th className="text-left px-4 py-3">Дата</th>
              <th className="text-left px-4 py-3">Имя</th>
              <th className="text-left px-4 py-3">Контакты</th>
              <th className="text-left px-4 py-3">Источник</th>
              <th className="text-left px-4 py-3">Статус</th>
              <th className="text-right px-4 py-3">Сумма</th>
              <th className="text-right px-4 py-3 w-[80px]"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
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
                  <InlineStatus leadId={lead.id} currentStatus={lead.status} />
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <InlineValue leadId={lead.id} initialValue={lead.value_uah} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/leads/${lead.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold tracking-[0.06em] uppercase text-[#E8FF47] hover:text-white border border-[#E8FF47]/30 hover:border-white/40 hover:bg-white/[0.04] rounded-md px-2.5 py-1 transition-colors whitespace-nowrap"
                  >
                    <span>Открыть</span>
                    <span className="text-[10px]">→</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-white/[0.05]">
        {leads.map((lead) => (
          <div key={lead.id} className="p-4">
            {/* Top row: name + status */}
            <div className="flex items-start justify-between mb-2 gap-2">
              <Link
                href={`/admin/leads/${lead.id}`}
                className="font-bold text-white truncate flex-1 hover:text-[#E8FF47] transition-colors"
              >
                {lead.name}
              </Link>
              <div className="shrink-0">
                <InlineStatus leadId={lead.id} currentStatus={lead.status} />
              </div>
            </div>

            {/* Phone */}
            <a
              href={`tel:${lead.phone}`}
              className="block font-['Barlow',sans-serif] text-[13px] text-[#aaa] hover:text-[#E8FF47] transition-colors"
            >
              {formatPhone(lead.phone)}
            </a>

            {/* Bottom row: meta + value + open */}
            <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
              <span className="text-[11px] text-[#555] font-['Barlow',sans-serif]">
                {lead.source} · {formatDate(lead.created_at)}
              </span>
              <div className="flex items-center gap-2">
                <InlineValue leadId={lead.id} initialValue={lead.value_uah} />
                <Link
                  href={`/admin/leads/${lead.id}`}
                  className="inline-flex items-center gap-1 text-[10px] font-bold tracking-[0.06em] uppercase text-[#E8FF47] border border-[#E8FF47]/30 rounded-md px-2 py-0.5 hover:bg-[#E8FF47]/10 transition-colors"
                >
                  <span>Открыть</span>
                  <span className="text-[9px]">→</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
