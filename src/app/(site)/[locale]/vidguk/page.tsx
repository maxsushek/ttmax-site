// /ua/vidguk?t=… — сторінка відгуку за персональним посиланням із замовлення.
// Посилання видає бот (кнопка «⭐ Посилання на відгук» під замовленням або /link TT-…),
// менеджер пересилає його клієнту. Тут — товари з ЦЬОГО замовлення, по формі на кожен,
// і форма про магазин. Відгуки звідси одразу «Покупець» (source=invite).
//
// Сторінка персональна: noindex, у sitemap її немає, рендер — на кожен запит.
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { Container, Section } from "@/components/ui/Section";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { verifyInvite } from "@/lib/reviews/secret";
import { findInviteRef } from "@/lib/reviews/purchase";
import { getProductBySlug } from "@/data/catalog";
import { getMediaMap, pickPrimary } from "@/lib/media/get";
import { cldUrl } from "@/lib/cloudinary/url";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { REVIEW_T } from "@/components/reviews/strings";

export const dynamic = "force-dynamic";

const T = {
  ua: {
    title: "Ваш відгук — TTMAX",
    h1: "Як вам покупка?",
    lead: (n: string | null) => `${n ? `Замовлення ${n}. ` : ""}Оцініть товари й магазин — кілька слів допоможуть іншим гравцям із вибором. Відгуки публікуємо після перевірки.`,
    product: "Відгук про товар",
    store: "Відгук про магазин",
    done: "Відгук уже надіслано — дякуємо!",
    bad: "Посилання недійсне або термін його дії минув. Напишіть нам — надішлемо нове.",
    toShop: "До каталогу",
  },
  ru: {
    title: "Ваш отзыв — TTMAX",
    h1: "Как вам покупка?",
    lead: (n: string | null) => `${n ? `Заказ ${n}. ` : ""}Оцените товары и магазин — несколько слов помогут другим игрокам с выбором. Отзывы публикуем после проверки.`,
    product: "Отзыв о товаре",
    store: "Отзыв о магазине",
    done: "Отзыв уже отправлен — спасибо!",
    bad: "Ссылка недействительна или срок её действия истёк. Напишите нам — пришлём новую.",
    toShop: "В каталог",
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: l } = await params;
  if (!isLocale(l)) return {};
  return { title: T[l].title, robots: { index: false, follow: false } };
}

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale: Locale = l;
  const tx = T[locale];
  const { t: token } = await searchParams;

  const orderNumber = verifyInvite(token);
  const sb = getSupabaseServerClient({ useServiceRole: true });
  const order = orderNumber && sb ? await findInviteRef(sb, orderNumber) : null;

  if (!order || !token) {
    return (
      <Section as="div" className="pt-10">
        <Container>
          <h1 className="font-display text-3xl font-black uppercase tracking-tight">{tx.h1}</h1>
          <p className="mt-4 max-w-[60ch] font-body text-[15px] text-ink-muted">{tx.bad}</p>
          <Link href={`/${locale}/nakladki`} className="mt-6 inline-block font-body text-accent hover:underline">
            {tx.toShop} →
          </Link>
        </Container>
      </Section>
    );
  }

  // Що вже оцінено з цього замовлення — щоб не просити вдруге.
  const { data: existing } = await sb!
    .from("reviews")
    .select("kind, product_slug, status")
    .eq("order_number", order.orderNumber);
  const done = new Set(
    (existing ?? [])
      .filter((r) => r.status !== "rejected" && r.status !== "spam")
      .map((r) => (r.kind === "store" ? "store" : (r.product_slug ?? ""))),
  );

  const media = await getMediaMap();
  const products = order.slugs
    .map((s) => getProductBySlug(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <Section as="div" className="pt-10">
      <Container>
        <h1 className="font-display text-3xl font-black uppercase leading-[1.05] tracking-tight sm:text-4xl">{tx.h1}</h1>
        <p className="mt-4 max-w-[70ch] font-body text-[15px] leading-relaxed text-ink-muted">{tx.lead(order.orderNumber.startsWith("L-") ? null : order.orderNumber)}</p>

        <div className="mt-8 flex max-w-3xl flex-col gap-6">
          {products.map((p) => {
            const im = pickPrimary(media, "product", p.slug);
            return (
              <div key={p.slug} className="rounded-2xl border border-border-strong bg-white/[0.02] p-5">
                <div className="mb-4 flex items-center gap-4">
                  {im && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cldUrl(im.publicId, { w: 160, h: 160 })}
                      alt={p.name[locale]}
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-xl bg-white object-contain"
                    />
                  )}
                  <div>
                    <div className="font-body text-[12px] uppercase tracking-[0.08em] text-ink-muted">{tx.product}</div>
                    <Link
                      href={`/${locale}/${p.brandSlug}/${p.categorySlug}/${p.slug}`}
                      className="font-display text-lg font-bold text-ink hover:text-accent"
                    >
                      {p.name[locale]}
                    </Link>
                  </div>
                </div>
                {done.has(p.slug) ? (
                  <p className="font-body text-[14px] text-accent">✓ {tx.done}</p>
                ) : (
                  <ReviewForm kind="product" productSlug={p.slug} locale={locale} token={token} compact />
                )}
              </div>
            );
          })}

          <div className="rounded-2xl border border-border-strong bg-white/[0.02] p-5">
            <div className="mb-4 font-display text-lg font-bold text-ink">{tx.store}</div>
            {done.has("store") ? (
              <p className="font-body text-[14px] text-accent">✓ {tx.done}</p>
            ) : (
              <ReviewForm kind="store" locale={locale} token={token} compact />
            )}
          </div>
        </div>
        <p className="mt-6 font-body text-[12px] text-ink-dim">{REVIEW_T[locale].note}</p>
      </Container>
    </Section>
  );
}
