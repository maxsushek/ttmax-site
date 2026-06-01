// src/app/admin/media/page.tsx
import { requireAdmin } from "@/lib/auth/admin";
import { AdminTopBar } from "../admin-topbar";
import { MediaManager, type MediaEntity } from "@/components/admin/MediaManager";
import { catalogCategories, getActiveBrands, getAllProducts } from "@/data/catalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Медіа · Admin · TTMAX",
  robots: { index: false, follow: false },
};

export default async function MediaPage() {
  const admin = await requireAdmin();

  const categories: MediaEntity[] = [...catalogCategories]
    .sort((a, b) => a.sort - b.sort)
    .map((c) => ({ type: "category", slug: c.slug, label: c.name.uk, group: "Категорії" }));

  const brands: MediaEntity[] = getActiveBrands().map((b) => ({
    type: "brand",
    slug: b.slug,
    label: b.name,
    group: "Бренди",
  }));

  const products: MediaEntity[] = getAllProducts().map((p) => ({
    type: "product",
    slug: p.slug,
    label: p.model,
    group: p.base ? "Товари — основи" : "Товари — накладки",
  }));

  const entities = [...categories, ...brands, ...products];

  return (
    <>
      <AdminTopBar email={admin.email} />
      <main className="mx-auto max-w-[1100px] px-5 py-8">
        <h1 className="mb-1 text-2xl font-black">Медіа / фото</h1>
        <p className="mb-6 text-sm text-[#888]">
          Завантаження зображень для категорій, товарів і брендів. Зміни застосовуються без
          передеплою — фото з'являється на сайті за хвилину.
        </p>
        <MediaManager entities={entities} />
      </main>
    </>
  );
}
