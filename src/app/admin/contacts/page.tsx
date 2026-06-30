// src/app/admin/contacts/page.tsx
import { requireAdmin } from "@/lib/auth/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSettings, settingString } from "@/lib/settings/get";
import { CONTACT_KEYS, contactDefaults } from "@/lib/contact/get";
import { ContactsForm } from "@/components/admin/ContactsForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Контакти й доставка · Admin · TTMAX",
  robots: { index: false, follow: false },
};

export default async function AdminContactsPage() {
  const admin = await requireAdmin();
  const settings = await getSettings();

  const defaults = contactDefaults();
  const initial: Record<string, string> = {};
  const overridden: string[] = [];
  for (const key of Object.values(CONTACT_KEYS)) {
    const override = settingString(settings, key);
    initial[key] = override || (defaults[key] ?? "");
    if (override) overridden.push(key);
  }

  return (
    <AdminShell email={admin.email}>
      <main className="mx-auto max-w-[640px] px-5 py-8">
        <h1 className="mb-1 text-2xl font-black uppercase tracking-tight">Контакти й доставка</h1>
        <p className="mb-6 text-sm text-[#888]">
          Телефон, email, соцмережі, адреса та параметри доставки. Поля показують поточні значення;
          зберігається лише змінене, «↺» повертає до стандартного. Застосовується без передеплою.
        </p>
        <ContactsForm initial={initial} defaults={defaults} overridden={overridden} />
      </main>
    </AdminShell>
  );
}
