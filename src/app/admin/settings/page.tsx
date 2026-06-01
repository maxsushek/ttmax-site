// src/app/admin/settings/page.tsx
import { requireAdmin } from "@/lib/auth/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSettings, settingString } from "@/lib/settings/get";
import { COUNTER_KEYS } from "@/lib/analytics/ids";
import { CountersForm } from "@/components/admin/CountersForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Лічильники · Admin · TTMAX",
  robots: { index: false, follow: false },
};

export default async function SettingsCountersPage() {
  const admin = await requireAdmin();
  const settings = await getSettings();

  const initial: Record<string, string> = {
    [COUNTER_KEYS.gtm]: settingString(settings, COUNTER_KEYS.gtm),
    [COUNTER_KEYS.ga]: settingString(settings, COUNTER_KEYS.ga),
    [COUNTER_KEYS.adsId]: settingString(settings, COUNTER_KEYS.adsId),
    [COUNTER_KEYS.adsLabel]: settingString(settings, COUNTER_KEYS.adsLabel),
    [COUNTER_KEYS.pixel]: settingString(settings, COUNTER_KEYS.pixel),
  };

  return (
    <AdminShell email={admin.email}>
      <main className="mx-auto max-w-[760px] px-5 py-8">
        <h1 className="mb-1 text-2xl font-black uppercase tracking-tight">Лічильники</h1>
        <p className="mb-6 text-sm text-[#888]">
          ID систем аналітики. Зберігаються в базі й підхоплюються сайтом без передеплою. Якщо поле
          порожнэ — використовується значення зі змінних оточення (env).
        </p>
        <CountersForm initial={initial} />
      </main>
    </AdminShell>
  );
}
