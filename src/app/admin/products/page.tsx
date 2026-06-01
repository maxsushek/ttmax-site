// src/app/admin/products/page.tsx
import { requireAdmin } from "@/lib/auth/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAllProducts, getMinPrice } from "@/data/catalog";
import { getOverrides } from "@/lib/catalog/overrides";
import { PriceStockManager, type PriceStockRow } from "@/components/admin/PriceStockManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ціни та наявність · Admin · TTMAX",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  const admin = await requireAdmin();
  const overrides = await getOverrides();

  // codePrice — ціна з коду (RAW товар, без накладення), для довідки в рядку.
  const rows: PriceStockRow[] = getAllProducts()
    .map((p) => ({
      slug: p.slug,
      model: p.model,
      category: p.categorySlug,
      codePrice: getMinPrice(p) ?? null,
    }))
    .sort((a, b) => a.category.localeCompare(b.category) || a.model.localeCompare(b.model));

  // У формі показуємо лише товар-рівень (ключі без "__").
  const initial: Record<string, { price: number | null; inStock: boolean | null }> = {};
  for (const [key, ov] of Object.entries(overrides)) {
    if (key.includes("__")) continue;
    initial[key] = {
      price: typeof ov.price === "number" ? ov.price : null,
      inStock: typeof ov.inStock === "boolean" ? ov.inStock : null,
    };
  }

  return (
    <AdminShell email={admin.email}>
      <main className="mx-auto max-w-[860px] px-5 py-8">
        <h1 className="mb-1 text-2xl font-black uppercase tracking-tight">Ціни та наявність</h1>
        <p className="mb-6 text-sm text-[#888]">
          Перекриває ціну й наявність поверх коду. Порожня ціна = ціна з коду; статус «Авто» —
          наявність з коду. Зміни застосовуються на сайті без передеплою.
        </p>
        <PriceStockManager rows={rows} initial={initial} />
      </main>
    </AdminShell>
  );
}
