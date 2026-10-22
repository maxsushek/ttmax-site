// src/lib/telegram/crm.ts
// Зміна статусів заявок і замовлень (з кнопок Telegram і з CRM) + перемальовування карток.
//
// Синхронізація в обидва боки:
//  • Telegram → база: setLeadStatus / setOrderStatus (ті самі тригери, що й у CRM: час етапу,
//    історія; в історію пишемо, хто натиснув);
//  • CRM → Telegram: після зміни в адмінці викликається syncAfterLeadChange.
// Замовлення і його копія в CRM (lead_number = order_number) тримаються в узгодженому стані.
// Вигляд карток і кнопок — lib/telegram/cards.ts.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, LeadStatus, OrderStatus } from "@/lib/supabase/types";
import { ORDER_TO_LEAD, leadToOrder } from "@/lib/crm/status";
import { refreshLeadCard, refreshOrderCard } from "./cards";

type Sb = SupabaseClient<Database>;

type LeadLite = { id: string; status: LeadStatus; source: string; lead_number: string };
type OrderLite = { id: string; status: OrderStatus; order_number: string };

async function getLead(sb: Sb, id: string): Promise<LeadLite | null> {
  const { data } = await sb.from("leads").select("id, status, source, lead_number").eq("id", id).maybeSingle();
  return (data as unknown as LeadLite) ?? null;
}

async function getOrder(sb: Sb, by: { id?: string; number?: string }): Promise<OrderLite | null> {
  let q = sb.from("orders").select("id, status, order_number");
  q = by.id ? q.eq("id", by.id) : q.eq("order_number", by.number ?? "");
  const { data } = await q.maybeSingle();
  return (data as unknown as OrderLite) ?? null;
}

/** Хто змінив — в історію події (тригер пише 'system'; уточнюємо щойно створений запис). */
export async function signLeadEvent(sb: Sb, leadId: string, by: string): Promise<void> {
  const { data } = await sb
    .from("lead_events")
    .select("id")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data) await sb.from("lead_events").update({ changed_by: by.slice(0, 80) }).eq("id", (data as { id: string }).id);
}

async function signOrderEvent(sb: Sb, orderId: string, by: string): Promise<void> {
  const { data } = await sb
    .from("order_events")
    .select("id")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data) await sb.from("order_events").update({ changed_by: by.slice(0, 80) }).eq("id", (data as { id: string }).id);
}

/** Статус заявки з Telegram. Для копії замовлення — міняє й саме замовлення. */
export async function setLeadStatus(sb: Sb, leadId: string, status: LeadStatus, by: string): Promise<boolean> {
  const l = await getLead(sb, leadId);
  if (!l) return false;
  if (l.status !== status) {
    const { error } = await sb.from("leads").update({ status }).eq("id", leadId);
    if (error) return false;
    await signLeadEvent(sb, leadId, by);
  }
  await syncAfterLeadChange(sb, leadId, by);
  return true;
}

/** Статус замовлення з Telegram + його копії в CRM. */
export async function setOrderStatus(sb: Sb, orderId: string, status: OrderStatus, by: string): Promise<boolean> {
  const o = await getOrder(sb, { id: orderId });
  if (!o) return false;
  if (o.status !== status) {
    const { error } = await sb.from("orders").update({ status }).eq("id", orderId);
    if (error) return false;
    await signOrderEvent(sb, orderId, by);
  }
  const { data: mirror } = await sb.from("leads").select("id, status").eq("lead_number", o.order_number).maybeSingle();
  const m = mirror as { id: string; status: LeadStatus } | null;
  if (m && m.status !== ORDER_TO_LEAD[status]) {
    const { error } = await sb.from("leads").update({ status: ORDER_TO_LEAD[status] }).eq("id", m.id);
    if (!error) await signLeadEvent(sb, m.id, by);
  }
  await refreshOrderCard(sb, orderId);
  return true;
}

/**
 * Після зміни статусу заявки (з Telegram чи з CRM): якщо це копія замовлення — підтягнути
 * статус замовлення й перемалювати його картку; інакше — картку заявки.
 */
export async function syncAfterLeadChange(sb: Sb, leadId: string, by: string): Promise<void> {
  const l = await getLead(sb, leadId);
  if (!l) return;
  if (l.source === "order" && l.lead_number.startsWith("TT-")) {
    const o = await getOrder(sb, { number: l.lead_number });
    if (!o) return;
    const next = leadToOrder(l.status, o.status);
    if (next) {
      const { error } = await sb.from("orders").update({ status: next }).eq("id", o.id);
      if (!error) await signOrderEvent(sb, o.id, by);
    }
    await refreshOrderCard(sb, o.id);
  } else {
    await refreshLeadCard(sb, leadId);
  }
}
