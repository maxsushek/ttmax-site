// src/app/admin/content/page.tsx
import { requireAdmin } from "@/lib/auth/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAllProducts, getActiveBrands, catalogCategories, catalogSeries } from "@/data/catalog";
import { findTokensDeep } from "@/lib/content/token-catalog";
import { ContentImport } from "@/components/admin/ContentImport";
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
  /** Токени-формули, знайдені в БУДЬ-ЯКОМУ полі цього опису (для огляду в адмінці). */
  tokens: string[];
};

export default async function AdminContentPage() {
  const admin = await requireAdmin();

  let existing: ExistingRow[] = [];
  const client = getSupabaseServerClient({ useServiceRole: true });
  if (client) {
    const db = client as unknown as SupabaseClient;
    const { data } = await db
      .from("content_blocks")
      .select(
        "entity_type, slug, locale, meta_title, meta_description, intro, body, faq, comparison, updated_at",
      )
      .order("updated_at", { ascending: false })
      .limit(500);
    if (data) {
      existing = (data as Record<string, unknown>[]).map((r) => ({
        entity_type: String(r.entity_type),
        slug: String(r.slug),
        locale: String(r.locale),
        meta_title: (r.meta_title as string | null) ?? null,
        updated_at: String(r.updated_at),
        tokens: findTokensDeep({
          meta_title: r.meta_title,
          meta_description: r.meta_description,
          intro: r.intro,
          body: r.body,
          faq: r.faq,
          comparison: r.comparison,
        }),
      }));
    }
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
        <div className="mb-6">
          <ContentImport />
        </div>
        <ContentEditor suggestions={suggestions} existing={existing} />
      </main>
    </AdminShell>
  );
}
