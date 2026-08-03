import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { getSupabaseSessionClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { ToastProvider } from "./toast";
import { LeadHeader } from "./lead-header";
import { ContactsPanel } from "./contacts-panel";
import { StatusControl } from "./status-control";
import { NotesEditor } from "./notes-editor";
import { ValueInput } from "./value-input";
import { ReasonInput } from "./reason-input";
import { AttributionPanel } from "./attribution-panel";
import { Timeline } from "./timeline";
import type { LeadEventRow, LeadRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// UUID v4 / generic UUID check — guard rails against random URLs
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function LeadDetailPage({ params }: PageProps) {
  const admin = await requireAdmin();
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    notFound();
  }

  const supabase = await getSupabaseSessionClient();
  if (!supabase) {
    return (
      <AdminShell email={admin.email}>
        <main className="mx-auto max-w-[1200px] px-5 py-8">
          <div className="text-red-400">Сервис недоступен</div>
        </main>
      </AdminShell>
    );
  }

  // ─── Load lead ────────────────────────────────────────────────
  const { data: leadData, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (leadError) {
    console.error("Lead fetch failed:", leadError.code);
  }

  if (!leadData) {
    notFound();
  }

  const lead = leadData as LeadRow;

  // ─── Load events ──────────────────────────────────────────────
  const { data: eventsData } = await supabase
    .from("lead_events")
    .select("*")
    .eq("lead_id", id)
    .order("created_at", { ascending: false });

  const events = (eventsData ?? []) as LeadEventRow[];

  // ─── Normalize attribution ────────────────────────────────────
  const attribution: Record<string, unknown> =
    lead.attribution && typeof lead.attribution === "object"
      ? (lead.attribution as Record<string, unknown>)
      : {};

  return (
    <ToastProvider>
      <AdminShell email={admin.email}>
        <main className="mx-auto max-w-[1200px] px-5 pb-24 md:pb-12">
          <LeadHeader name={lead.name} createdAt={lead.created_at} updatedAt={lead.updated_at} />

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_360px] md:gap-5">
            {/* ── MAIN COLUMN ─────────────────────────────── */}
            <div className="min-w-0 space-y-4 md:space-y-5">
              {/* On mobile contacts go first — main CTA is to call */}
              <div className="md:hidden">
                <ContactsPanel phone={lead.phone} email={lead.email} />
              </div>

              <StatusControl leadId={lead.id} currentStatus={lead.status} />

              <ValueInput
                leadId={lead.id}
                initialValue={lead.value_uah}
                currentStatus={lead.status}
              />

              <ReasonInput
                leadId={lead.id}
                currentStatus={lead.status}
                initialQualificationReason={lead.qualification_reason}
                initialLossReason={lead.loss_reason}
              />

              <NotesEditor leadId={lead.id} initialNotes={lead.notes} />

              <Timeline events={events} />
            </div>

            {/* ── SIDEBAR (desktop only at top, on mobile attribution goes below) ── */}
            <aside className="min-w-0 space-y-4 md:space-y-5">
              {/* Contacts visible only on desktop here (mobile shows them at the top) */}
              <div className="hidden md:sticky md:top-[88px] md:block">
                <div className="space-y-4">
                  <ContactsPanel phone={lead.phone} email={lead.email} />
                  <AttributionPanel
                    attribution={attribution}
                    source={lead.source}
                    locale={lead.locale}
                  />
                </div>
              </div>

              {/* On mobile attribution at the bottom */}
              <div className="md:hidden">
                <AttributionPanel
                  attribution={attribution}
                  source={lead.source}
                  locale={lead.locale}
                />
              </div>
            </aside>
          </div>
        </main>
      </AdminShell>
    </ToastProvider>
  );
}
