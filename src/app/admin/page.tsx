// src/app/admin/page.tsx
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Дашборд · Admin · TTMAX",
  robots: { index: false, follow: false },
};

const PLACEHOLDERS = [
  { label: "Замовлень сьогодні", hint: "Етап 2" },
  { label: "Виручка за місяць", hint: "Етап 4" },
  { label: "Нових заявок", hint: "Етап 2" },
  { label: "Конверсія", hint: "Етап 2" },
];

const SHORTCUTS = [
  {
    href: "/admin/leads",
    title: "Заявки →",
    desc: "CRM: статуси, цінність, нотатки, джерела.",
  },
  {
    href: "/admin/media",
    title: "Медіа / фото →",
    desc: "Логотип, банер, фавікон, фото товарів і категорій.",
  },
];

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  return (
    <AdminShell email={admin.email}>
      <main className="mx-auto max-w-[1100px] px-5 py-8">
        <h1 className="mb-1 text-2xl font-black uppercase tracking-tight">Дашборд</h1>
        <p className="mb-6 text-sm text-[#888]">
          Каркас панелі. Цифри підключимо на наступних етапах — поки тут лише навігація та швидкі
          переходи.
        </p>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {PLACEHOLDERS.map((c) => (
            <div
              key={c.label}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4"
            >
              <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#666]">
                {c.label}
              </div>
              <div className="mt-2 text-3xl font-black text-[#3a3a3a]">—</div>
              <div className="mt-1 text-[11px] text-[#555]">{c.hint}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {SHORTCUTS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition-colors hover:border-[#E8FF47]/40"
            >
              <div className="text-sm font-black uppercase tracking-wide text-white">{s.title}</div>
              <div className="mt-1 text-[13px] text-[#888]">{s.desc}</div>
            </Link>
          ))}
        </div>
      </main>
    </AdminShell>
  );
}
