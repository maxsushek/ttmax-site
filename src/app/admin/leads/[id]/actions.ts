"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseSessionClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/auth/admin";
import type { LeadStatus } from "@/lib/supabase/types";

type ActionResult = { ok: true } | { ok: false; error: string };

const VALID_STATUSES: LeadStatus[] = [
  "new",
  "qualified",
  "unqualified",
  "contacted",
  "in_progress",
  "won",
  "lost",
];

type AuthedContext = {
  admin: { id: string; email: string };
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseSessionClient>>>;
};

type AuthedResult =
  | { ok: true; ctx: AuthedContext }
  | { ok: false; error: string };

async function getAuthedClient(): Promise<AuthedResult> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { ok: false, error: "Не авторизован" };
  }
  const supabase = await getSupabaseSessionClient();
  if (!supabase) {
    return { ok: false, error: "Сервис недоступен" };
  }
  return { ok: true, ctx: { admin, supabase } };
}

function revalidate(leadId: string) {
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/leads");
}

// ─── STATUS ─────────────────────────────────────────────────────
export async function updateLeadStatusAction(
  leadId: string,
  status: LeadStatus
): Promise<ActionResult> {
  if (!leadId) return { ok: false, error: "Нет ID лида" };
  if (!VALID_STATUSES.includes(status)) {
    return { ok: false, error: "Неверный статус" };
  }

  const auth = await getAuthedClient();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.ctx.supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId);

  if (error) {
    console.error("updateLeadStatus failed:", error.code);
    return { ok: false, error: "Не удалось обновить статус" };
  }

  revalidate(leadId);
  return { ok: true };
}

// ─── NOTES ──────────────────────────────────────────────────────
export async function updateLeadNotesAction(
  leadId: string,
  notes: string
): Promise<ActionResult> {
  if (!leadId) return { ok: false, error: "Нет ID лида" };

  const auth = await getAuthedClient();
  if (!auth.ok) return { ok: false, error: auth.error };

  const value = notes.trim().length === 0 ? null : notes;

  const { error } = await auth.ctx.supabase
    .from("leads")
    .update({ notes: value })
    .eq("id", leadId);

  if (error) {
    console.error("updateLeadNotes failed:", error.code);
    return { ok: false, error: "Не удалось сохранить заметки" };
  }

  revalidate(leadId);
  return { ok: true };
}

// ─── VALUE ──────────────────────────────────────────────────────
export async function updateLeadValueAction(
  leadId: string,
  value: number | null
): Promise<ActionResult> {
  if (!leadId) return { ok: false, error: "Нет ID лида" };
  if (value !== null) {
    if (!Number.isFinite(value) || value < 0 || value > 1_000_000_000) {
      return { ok: false, error: "Неверная сумма" };
    }
  }

  const auth = await getAuthedClient();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.ctx.supabase
    .from("leads")
    .update({ value_uah: value })
    .eq("id", leadId);

  if (error) {
    console.error("updateLeadValue failed:", error.code);
    return { ok: false, error: "Не удалось сохранить сумму" };
  }

  revalidate(leadId);
  return { ok: true };
}

// ─── QUALIFICATION REASON ───────────────────────────────────────
export async function updateLeadQualificationReasonAction(
  leadId: string,
  reason: string
): Promise<ActionResult> {
  if (!leadId) return { ok: false, error: "Нет ID лида" };

  const auth = await getAuthedClient();
  if (!auth.ok) return { ok: false, error: auth.error };

  const value = reason.trim().length === 0 ? null : reason.trim();

  const { error } = await auth.ctx.supabase
    .from("leads")
    .update({ qualification_reason: value })
    .eq("id", leadId);

  if (error) {
    console.error("updateLeadQualificationReason failed:", error.code);
    return { ok: false, error: "Не удалось сохранить причину" };
  }

  revalidate(leadId);
  return { ok: true };
}

// ─── LOSS REASON ────────────────────────────────────────────────
export async function updateLeadLossReasonAction(
  leadId: string,
  reason: string
): Promise<ActionResult> {
  if (!leadId) return { ok: false, error: "Нет ID лида" };

  const auth = await getAuthedClient();
  if (!auth.ok) return { ok: false, error: auth.error };

  const value = reason.trim().length === 0 ? null : reason.trim();

  const { error } = await auth.ctx.supabase
    .from("leads")
    .update({ loss_reason: value })
    .eq("id", leadId);

  if (error) {
    console.error("updateLeadLossReason failed:", error.code);
    return { ok: false, error: "Не удалось сохранить причину" };
  }

  revalidate(leadId);
  return { ok: true };
}
