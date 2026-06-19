// src/app/admin/media/page.tsx
import { requireAdmin } from "@/lib/auth/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { MediaManager, type MediaEntity } from "@/components/admin/MediaManager";
import { catalogCategories, getActiveBrands, getAllProducts } from "@/data/catalog";
import { SITE_ASSETS } from "@/lib/media/site-assets";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Медіа · Admin · TTMAX",
  robots: { index: false, follow: false },
};

export default async function MediaPage() {
  const admin = await requireAdmin();

  const categories: MediaEntity[] = [...catalogCategories]
    .sort((a, b) => a.sort - b.sort)
    .map((c) => ({ type: "category", slug: c.slug, label: c.name.ua, group: "Категорії" }));

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

  // Загальносайтові слоти (logo / hero / favicon) живуть в entity_media
  // як type="category" із зарезервованими slug — окрема міграція не потрібна.
  const site: MediaEntity[] = [
    { type: "category", slug: SITE_ASSETS.logo, label: "Логотип", group: "Сайт" },
    { type: "category", slug: SITE_ASSETS.hero, label: "Hero — головне фото", group: "Сайт" },
    { type: "category", slug: SITE_ASSETS.favicon, label: "Favicon", group: "Сайт" },
  ];

  const entities = [...site, ...categories, ...brands, ...products];

  return (
    <AdminShell email={admin.email}>
      <main className="mx-auto max-w-[1100px] px-5 py-8">
        <h1 className="mb-1 text-2xl font-black">Медіа / фото</h1>
        <p className="mb-6 text-sm text-[#888]">
          Завантаження зображень для категорій, товарів і брендів, а також загальносайтових слотів
          (група «Сайт»: логотип, банер, фавікон — береться перше зображення). Зміни застосовуються
          без передеплою — оновлюється на сайті за хвилину.
        </p>
        <MediaManager entities={entities} />
      </main>
    </AdminShell>
  );
}
