// src/app/admin/content/page.tsx
import { requireAdmin } from "@/lib/auth/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAllProducts, getActiveBrands, catalogCategories, catalogSeries } from "@/data/catalog";
import { ContentEditor } from "@/components/admin/ContentEditor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Описи · Admin · TTMAX",
  robots: { index: false, follow: false },
};

type ExistingRow = {
  entity_type: string;
  slug: string;
  locale: string;
  meta_title: string | null;
  updated_at: string;
};

export default async function AdminContentPage() {
  const admin = await requireAdmin();

  let existing: ExistingRow[] = [];
  const client = getSupabaseServerClient({ useServiceRole: true });
  if (client) {
    const db = client as unknown as SupabaseClient;
    const { data } = await db
      .from("content_blocks")
      .select("entity_type, slug, locale, meta_title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(500);
    if (data) existing = data as ExistingRow[];
  }

  const products = getAllProducts();
  const activeBrands = getActiveBrands();
  const suggestions: Record<string, { slug: string; label: string }[]> = {
    product: products.map((p) => ({ slug: p.slug, label: `${p.name.uk} (${p.brandSlug})` })),
    category: catalogCategories.map((c) => ({ slug: c.slug, label: c.name.uk })),
    brand: activeBrands.map((b) => ({ slug: b.slug, label: b.name })),
    brandCategory: activeBrands.flatMap((b) =>
      catalogCategories.map((c) => ({
        slug: `${b.slug}/${c.slug}`,
        label: `${b.name} · ${c.name.uk}`,
      })),
    ),
    series: catalogSeries.map((s) => ({ slug: s.slug, label: `${s.name} (${s.brandSlug})` })),
    facet: [],
  };

  return (
    <AdminShell email={admin.email}>
      <main className="mx-auto max-w-[1100px] px-5 py-8">
        <h1 className="mb-1 text-2xl font-black uppercase tracking-tight">Описи товарів</h1>
        <p className="mb-6 text-sm text-[#888]">
          SEO-контент по сутностях і мовах: meta, вступ, текст (markdown), FAQ, порівняння.
          Підхоплюється сайтом без передеплою. Порожні поля не виводяться на сайті.
        </p>
        <ContentEditor suggestions={suggestions} existing={existing} />
      </main>
    </AdminShell>
  );
}
