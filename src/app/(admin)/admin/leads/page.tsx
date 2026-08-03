import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { getSupabaseSessionClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
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

type MetricsRow = {
  status: LeadStatus;
  value_uah: number | null;
  source: string;
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
      <AdminShell email={admin.email}>
        <main className="mx-auto max-w-[1400px] px-5 py-8">
          <div className="text-red-400">Сервис недоступен</div>
        </main>
      </AdminShell>
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
  const metricsRes = await supabase.from("leads").select("status, value_uah, source");

  const allForMetrics = (metricsRes.data ?? []) as unknown as MetricsRow[];
  const metricsError = metricsRes.error;

  const metrics = (() => {
    let total = 0;
    let qualified = 0;
    let won = 0;
    let revenue = 0;
    const qualifiedSet = new Set<LeadStatus>(["qualified", "contacted", "in_progress", "won"]);
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
  const sources = Array.from(new Set(allForMetrics.map((l) => l.source))).filter(Boolean);

  return (
    <AdminShell email={admin.email}>
      <main className="mx-auto max-w-[1400px] px-5 py-6">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-2xl font-black uppercase tracking-tight">
            Лиды <span className="text-base font-bold text-[#666]">({metrics.total})</span>
          </h1>
          <Link
            href="https://supabase.com/dashboard"
            target="_blank"
            className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#666] transition-colors hover:text-[#E8FF47]"
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
            <div className="rounded-lg border border-[#FF6B81]/20 bg-[#FF6B81]/[0.08] p-4 font-['Barlow',sans-serif] text-[14px] text-[#FF6B81]">
              Ошибка загрузки: {leadsError.message}
            </div>
          ) : !leads || leads.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-[#0E1117] p-10 text-center">
              <div className="mb-2 text-3xl opacity-50">📭</div>
              <div className="font-['Barlow',sans-serif] text-[15px] text-[#555]">
                Лидов по этому фильтру нет
              </div>
            </div>
          ) : (
            <LeadsTable leads={leads as LeadRow[]} />
          )}
        </div>

        {metricsError && (
          <div className="mt-3 font-['Barlow',sans-serif] text-[11px] text-[#FF6B81]/70">
            Метрики временно недоступны: {metricsError.message}
          </div>
        )}
      </main>
    </AdminShell>
  );
}
