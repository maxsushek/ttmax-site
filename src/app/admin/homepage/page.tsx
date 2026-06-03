// src/app/admin/homepage/page.tsx
import { requireAdmin } from "@/lib/auth/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSettings, settingString } from "@/lib/settings/get";
import { HomepageForm } from "@/components/admin/HomepageForm";
import { HOME_KEYS, resolveHitSlugs } from "@/lib/homepage/home";
import { getAllProducts, getBrandBySlug } from "@/data/catalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Головна · Admin · TTMAX",
  robots: { index: false, follow: false },
};

export default async function AdminHomepagePage() {
  const admin = await requireAdmin();
  const settings = await getSettings();

  const products = getAllProducts()
    .map((p) => ({
      slug: p.slug,
      label: `${getBrandBySlug(p.brandSlug)?.name ?? p.brandSlug} ${p.model}`.trim(),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "uk"));

  const initial = {
    heroUk: settingString(settings, HOME_KEYS.heroTitleUk),
    heroRu: settingString(settings, HOME_KEYS.heroTitleRu),
    brandsUk: settingString(settings, HOME_KEYS.brandsTitleUk),
    brandsRu: settingString(settings, HOME_KEYS.brandsTitleRu),
    hits: resolveHitSlugs(settings),
  };

  return (
    <AdminShell email={admin.email}>
      <main className="mx-auto max-w-[860px] px-5 py-8">
        <h1 className="mb-1 text-2xl font-black uppercase tracking-tight">Головна сторінка</h1>
        <p className="mb-6 text-sm text-[#888]">
          Заголовки головної та блок «Хіти». Зберігаються в базі й застосовуються без передеплою.
        </p>
        <HomepageForm initial={initial} products={products} />
      </main>
    </AdminShell>
  );
}
