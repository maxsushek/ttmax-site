import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { getSupabaseSessionClient } from "@/lib/supabase/server";
import { AdminTopBar } from "../admin-topbar";
import { LeadsFilters } from "./filters";
import { LeadsMetrics } from "./metrics";
import { LeadsTable } from "./leads-table";
import type { LeadRow, LeadStatus } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SearchParams = {
  status?: string;
  source?: string;
  q?: string;
  range?: string; // 'today' | 'week' | 'month' | 'all'
};

const VALID_STATUSES: LeadStatus[] = [
  "new",
  "qualified",
  "unqualified",
  "contacted",
  "in_progress",
  "won",
  "lost",
];

function startOfRange(range?: string): string | null {
  const now = new Date();
  if (range === "today") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  if (range === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  }
  if (range === "month") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  }
  return null;
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;

  const supabase = await getSupabaseSessionClient();
  if (!supabase) {
    return (
      <>
        <AdminTopBar email={admin.email} />
        <main className="max-w-[1400px] mx-auto px-5 py-8">
          <div className="text-red-400">Сервис недоступен</div>
        </main>
      </>
    );
  }

  // ---------- запрос лидов с фильтрами ----------
  let query = supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const statusFilter = params.status;
  if (statusFilter && (VALID_STATUSES as string[]).includes(statusFilter)) {
    query = query.eq("status", statusFilter as LeadStatus);
  }

  if (params.source) {
    query = query.eq("source", params.source);
  }

  const rangeStart = startOfRange(params.range);
  if (rangeStart) {
    query = query.gte("created_at", rangeStart);
  }

  if (params.q && params.q.trim().length >= 2) {
    const search = params.q.trim();
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: leads, error: leadsError } = await query;

  // ---------- агрегированные метрики ----------
  const { data: allForMetrics, error: metricsError } = await supabase
    .from("leads")
    .select("status, value_uah, source");

  const metrics = (() => {
    if (!allForMetrics) return { total: 0, qualified: 0, won: 0, conversion: 0, revenue: 0 };
    let total = 0;
    let qualified = 0;
    let won = 0;
    let revenue = 0;
    const qualifiedSet = new Set<LeadStatus>([
      "qualified",
      "contacted",
      "in_progress",
      "won",
    ]);
    for (const l of allForMetrics) {
      total += 1;
      if (qualifiedSet.has(l.status)) qualified += 1;
      if (l.status === "won") {
        won += 1;
        revenue += Number(l.value_uah ?? 0);
      }
    }
    return {
      total,
      qualified,
      won,
      revenue,
      conversion: total > 0 ? Math.round((won / total) * 1000) / 10 : 0,
    };
  })();

  // ---------- список уникальных source для селектора ----------
  const sources = Array.from(new Set((allForMetrics ?? []).map((l) => l.source))).filter(Boolean);

  return (
    <>
      <AdminTopBar email={admin.email} />

      <main className="max-w-[1400px] mx-auto px-5 py-6">
        <div className="flex items-baseline justify-between flex-wrap gap-3 mb-5">
          <h1 className="text-2xl font-black tracking-tight uppercase">
            Лиды <span className="text-[#666] text-base font-bold">({metrics.total})</span>
          </h1>
          <Link
            href="https://supabase.com/dashboard"
            target="_blank"
            className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#666] hover:text-[#E8FF47] transition-colors"
          >
            Открыть Supabase →
          </Link>
        </div>

        <LeadsMetrics metrics={metrics} />

        <div className="mt-5">
          <LeadsFilters
            currentStatus={params.status}
            currentSource={params.source}
            currentQuery={params.q}
            currentRange={params.range}
            sources={sources}
          />
        </div>

        <div className="mt-4">
          {leadsError ? (
            <div className="bg-[#FF6B81]/[0.08] border border-[#FF6B81]/20 text-[#FF6B81] rounded-lg p-4 text-[14px] font-['Barlow',sans-serif]">
              Ошибка загрузки: {leadsError.message}
            </div>
          ) : !leads || leads.length === 0 ? (
            <div className="bg-[#0E1117] border border-white/[0.06] rounded-2xl p-10 text-center">
              <div className="text-3xl mb-2 opacity-50">📭</div>
              <div className="text-[15px] text-[#555] font-['Barlow',sans-serif]">
                Лидов по этому фильтру нет
              </div>
            </div>
          ) : (
            <LeadsTable leads={leads as LeadRow[]} />
          )}
        </div>

        {metricsError && (
          <div className="mt-3 text-[11px] text-[#FF6B81]/70 font-['Barlow',sans-serif]">
            Метрики временно недоступны: {metricsError.message}
          </div>
        )}
      </main>
    </>
  );
}
