"use server";

// Дії модерації з адмінки — ті самі функції, що й кнопки в Telegram, тож сайт,
// база й повідомлення в чаті завжди показують один стан.
import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { applyModeration, applyReply, refreshMessage, type ModerationAction } from "@/lib/reviews/moderation";

const ACTIONS: ModerationAction[] = ["approve", "reject", "spam", "pending"];

async function client() {
  const admin = await getCurrentAdmin();
  if (!admin) return null;
  const sb = getSupabaseServerClient({ useServiceRole: true });
  return sb ? { admin, sb } : null;
}

export async function moderateAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const op = String(formData.get("op") ?? "") as ModerationAction;
  if (!/^[0-9a-f-]{36}$/.test(id) || !ACTIONS.includes(op)) return;
  const c = await client();
  if (!c) return;
  const row = await applyModeration(c.sb, id, op, `${c.admin.email} (адмінка)`);
  if (row) await refreshMessage(row);
  revalidatePath("/admin/reviews");
}

export async function replyAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const text = String(formData.get("reply") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(id)) return;
  const c = await client();
  if (!c) return;
  const row = await applyReply(c.sb, id, text.trim() ? text : null);
  if (row) await refreshMessage(row);
  revalidatePath("/admin/reviews");
}
