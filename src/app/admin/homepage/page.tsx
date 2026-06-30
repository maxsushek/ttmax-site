// src/app/admin/homepage/page.tsx
import { requireAdmin } from "@/lib/auth/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSettings, settingString } from "@/lib/settings/get";
import { HomepageEditor } from "@/components/admin/HomepageEditor";
import { resolveHitSlugs } from "@/lib/homepage/home";
import { HOME_TEXT_KEYS } from "@/lib/homepage/keys";
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
    .sort((a, b) => a.label.localeCompare(b.label, "ua"));

  const texts: Record<string, string> = {};
  for (const key of HOME_TEXT_KEYS) texts[key] = settingString(settings, key);

  const initial = { texts, hits: resolveHitSlugs(settings) };

  return (
    <AdminShell email={admin.email}>
      <main className="mx-auto max-w-[860px] px-5 py-8">
        <h1 className="mb-1 text-2xl font-black uppercase tracking-tight">Головна сторінка</h1>
        <p className="mb-6 text-sm text-[#888]">
          Усі тексти головної (Hero, секції, тристрічка довіри, форма-CTA, FAQ) і блок «Хіти».
          Порожнэ поле — використовується стандартний текст із коду. Зберігається в базі й
          застосовується без передеплою.
        </p>
        <HomepageEditor initial={initial} products={products} />
      </main>
    </AdminShell>
  );
}
