// /admin/reviews — модерація відгуків (запасний шлях до Telegram-кнопок).
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { reviewSubject } from "@/lib/reviews/moderation";
import type { ReviewRow, ReviewStatus } from "@/lib/supabase/types";
import { moderateAction, replyAction } from "./actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TABS: { status: ReviewStatus; label: string }[] = [
  { status: "pending", label: "На модерації" },
  { status: "approved", label: "Опубліковані" },
  { status: "rejected", label: "Відхилені" },
  { status: "spam", label: "Спам" },
];

const BTN: Record<string, string> = {
  approve: "border-[#E8FF47]/50 text-[#E8FF47] hover:bg-[#E8FF47]/10",
  reject: "border-white/20 text-white/80 hover:bg-white/5",
  spam: "border-red-400/40 text-red-300 hover:bg-red-400/10",
  pending: "border-white/20 text-white/80 hover:bg-white/5",
};

function ActionButton({ id, op, label }: { id: string; op: string; label: string }) {
  return (
    <form action={moderateAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="op" value={op} />
      <button type="submit" className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${BTN[op]}`}>
        {label}
      </button>
    </form>
  );
}

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const admin = await requireAdmin();
  const { status: s } = await searchParams;
  const status: ReviewStatus = TABS.some((t) => t.status === s) ? (s as ReviewStatus) : "pending";

  const sb = getSupabaseServerClient({ useServiceRole: true });
  const [{ data }, counts] = sb
    ? await Promise.all([
        sb.from("reviews").select("*").eq("status", status).order("created_at", { ascending: false }).limit(200),
        Promise.all(
          TABS.map((t) => sb.from("reviews").select("id", { count: "exact", head: true }).eq("status", t.status)),
        ),
      ])
    : [{ data: null }, []];
  const rows = (data ?? []) as ReviewRow[];

  return (
    <AdminShell email={admin.email}>
      <main className="mx-auto max-w-[1100px] px-5 py-6">
        <h1 className="mb-1 text-2xl font-black uppercase tracking-tight">Відгуки</h1>
        <p className="mb-5 text-sm text-[#888]">
          Нові відгуки приходять у Telegram з кнопками — тут те саме, якщо Telegram під рукою немає. Відповідь
          магазину показується під відгуком на сайті. Відхиляйте спам і образи, а не негатив: інакше відгукам
          перестануть вірити.
        </p>

        <nav className="mb-6 flex flex-wrap gap-2">
          {TABS.map((t, i) => (
            <Link
              key={t.status}
              href={`/admin/reviews?status=${t.status}`}
              className={`rounded-full border px-3 py-1 text-sm ${
                t.status === status ? "border-[#E8FF47] text-[#E8FF47]" : "border-white/15 text-white/70 hover:text-white"
              }`}
            >
              {t.label} <span className="opacity-60">{counts[i]?.count ?? 0}</span>
            </Link>
          ))}
        </nav>

        {rows.length === 0 && <p className="text-[#888]">Порожньо.</p>}

        <ul className="flex flex-col gap-4">
          {rows.map((r) => {
            const subj = reviewSubject(r);
            return (
              <li key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="text-lg text-[#E8FF47]">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  <b>{r.author_name}</b>
                  {r.author_city && <span className="text-[#888]">{r.author_city}</span>}
                  {r.verified ? (
                    <span className="rounded-full border border-[#E8FF47]/40 px-2 py-0.5 text-xs text-[#E8FF47]">
                      ✓ Покупець {r.order_number}
                    </span>
                  ) : r.phone ? (
                    <span className="text-xs text-[#888]">+{r.phone} — замовлень не знайдено</span>
                  ) : null}
                  <span className="ml-auto text-xs text-[#666]">
                    {new Date(r.created_at).toLocaleString("uk-UA", { timeZone: "Europe/Kyiv" })} · {r.locale}
                  </span>
                </div>
                <div className="mt-1 text-sm">
                  {subj.url ? (
                    <a href={subj.url} target="_blank" rel="noreferrer" className="text-[#E8FF47] hover:underline">
                      {subj.name}
                    </a>
                  ) : (
                    subj.name
                  )}
                </div>
                <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-white/85">{r.body}</p>
                {r.flags.length > 0 && <p className="mt-2 text-xs text-orange-300">⚠️ {r.flags.join(", ")}</p>}

                <div className="mt-4 flex flex-wrap gap-2">
                  {r.status !== "approved" && <ActionButton id={r.id} op="approve" label="✅ Опублікувати" />}
                  {r.status === "pending" && <ActionButton id={r.id} op="reject" label="❌ Відхилити" />}
                  {r.status === "approved" && <ActionButton id={r.id} op="reject" label="🙈 Зняти з публікації" />}
                  {r.status === "pending" && <ActionButton id={r.id} op="spam" label="🚫 Спам" />}
                  {(r.status === "rejected" || r.status === "spam") && (
                    <ActionButton id={r.id} op="pending" label="↩️ На модерацію" />
                  )}
                </div>

                {r.status !== "spam" && (
                  <form action={replyAction} className="mt-4 flex flex-col gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <textarea
                      name="reply"
                      defaultValue={r.reply_body ?? ""}
                      rows={2}
                      maxLength={3000}
                      placeholder="Відповідь магазину (порожньо — без відповіді)"
                      className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-[#E8FF47]/60"
                    />
                    <button
                      type="submit"
                      className="self-start rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/80 hover:bg-white/5"
                    >
                      💬 Зберегти відповідь
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </main>
    </AdminShell>
  );
}
