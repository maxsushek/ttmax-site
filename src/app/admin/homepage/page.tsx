// src/app/admin/homepage/page.tsx
import { requireAdmin } from "@/lib/auth/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSettings, settingString } from "@/lib/settings/get";
import { HomepageEditor } from "@/components/admin/HomepageEditor";
import { resolveHitSlugs, homeDefaults } from "@/lib/homepage/home";
import { HOME_TEXT_BASES, homeKey } from "@/lib/homepage/keys";
import { CONTACT_KEYS, contactDefaults } from "@/lib/contact/get";
import { getAllProducts, getBrandBySlug } from "@/data/catalog";
import type { Locale } from "@/i18n/config";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Головна · Admin · TTMAX",
  robots: { index: false, follow: false },
};

// Контактні поля, доступні прямо з редактора головної (футер показуэ їх на всіх сторінках).
const CONTACT_FIELD_KEYS: string[] = [
  CONTACT_KEYS.phone,
  CONTACT_KEYS.phoneDisplay,
  CONTACT_KEYS.email,
  CONTACT_KEYS.telegram,
  CONTACT_KEYS.youtube,
  CONTACT_KEYS.facebook,
];

export default async function AdminHomepagePage() {
  const admin = await requireAdmin();
  const settings = await getSettings();

  const products = getAllProducts()
    .map((p) => ({
      slug: p.slug,
      label: `${getBrandBySlug(p.brandSlug)?.name ?? p.brandSlug} ${p.model}`.trim(),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "ua"));

  // Дефолти всіх редагованих ключів (тексти головної UA/RU + контакти).
  const defaults: Record<string, string> = {};
  const langPairs: Array<["uk" | "ru", Locale]> = [
    ["uk", "ua"],
    ["ru", "ru"],
  ];
  for (const [lang, loc] of langPairs) {
    const d = homeDefaults(loc);
    for (const base of HOME_TEXT_BASES) defaults[homeKey(base, lang)] = d[base] ?? "";
  }
  const cd = contactDefaults();
  for (const key of CONTACT_FIELD_KEYS) defaults[key] = cd[key] ?? "";

  // Значення для полів: збережене переопределення або дефолт (щоб поле не було порожнім).
  const values: Record<string, string> = {};
  const overridden: string[] = [];
  for (const key of Object.keys(defaults)) {
    const override = settingString(settings, key);
    values[key] = override || defaults[key] || "";
    if (override) overridden.push(key);
  }

  const initial = { values, defaults, overridden, hits: resolveHitSlugs(settings) };

  return (
    <AdminShell email={admin.email}>
      <main className="mx-auto max-w-[860px] px-5 py-8">
        <h1 className="mb-1 text-2xl font-black uppercase tracking-tight">Головна сторінка</h1>
        <p className="mb-6 text-sm text-[#888]">
          Усі тексти головної (Hero, секції, тристрічка довіри, форма-CTA, FAQ), блок «Хіти» та
          контакти у футері (телефон, email, соцмережі). Поля показують поточні значення —
          змінюйте будь-яке. Зберігається лише змінене; «↺» повертає поле до стандартного. Усе
          застосовується без передеплою.
        </p>
        <HomepageEditor initial={initial} products={products} />
      </main>
    </AdminShell>
  );
}
