import Link from "next/link";
import { Container, Section, SectionKicker, SectionTitle } from "@/components/ui/Section";
import { featuredProducts } from "@/data/products";
import { formatPrice } from "@/utils/format";
import { AddToCartButton } from "./AddToCartButton";
import type { Messages } from "@/i18n/messages/types";
import type { Locale } from "@/i18n/config";
import type { Product } from "@/types";

export function Products({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages;
}) {
  const m = messages.products;

  return (
    <Section id="products" className="pt-0 lg:pt-0" ariaLabelledBy="products-title">
      <Container>
        <div className="mb-11 flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionKicker>{m.kicker}</SectionKicker>
            <SectionTitle id="products-title">
              <span className="text-white/60">{m.titleMuted} </span>
              <span className="text-gradient-accent">{m.titleAccent}</span>
            </SectionTitle>
          </div>
          <Link
            href={`/${locale}/catalog`}
            className="nav-link font-display text-[13px] font-bold uppercase tracking-[0.1em] text-accent"
          >
            {m.seeAll} →
          </Link>
        </div>

        <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
          {featuredProducts.map((p) => (
            <ProductCard key={p.id} product={p} messages={messages} />
          ))}
        </ul>
      </Container>
    </Section>
  );
}

function ProductCard({ product, messages }: { product: Product; messages: Messages }) {
  const m = messages.products;
  const categoryLabel = m.categories[product.category];
  const badgeLabel = product.badge ? m.badges[product.badge] : null;

  return (
    <li
      className="group flex flex-col overflow-hidden rounded-[18px] border border-border-strong bg-bg-raised transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
      style={{ ["--product-accent" as string]: product.accentColor }}
    >
      <div
        aria-hidden
        className="h-0.5"
        style={{
          background: `linear-gradient(90deg,${product.accentColor},transparent)`,
        }}
      />
      <div className="relative border-b border-white/[0.08] bg-white/[0.02] py-6">
        {badgeLabel && (
          <span
            className="absolute right-3 top-3 rounded-md px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-bg-base"
            style={{ backgroundColor: product.accentColor }}
          >
            {badgeLabel}
          </span>
        )}
        <div
          aria-hidden
          className="flex h-[120px] items-center justify-center text-5xl transition-transform duration-500 group-hover:-rotate-[5deg] group-hover:scale-[1.14]"
        >
          {product.emoji}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.13em] text-ink-ghost">
          {product.brand} · {categoryLabel}
        </div>
        <div className="font-display text-[17px] font-extrabold leading-tight tracking-tight">
          {product.model}
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
          <span className="font-display text-xl font-black text-accent">
            {formatPrice(product.price)}
          </span>
          <AddToCartButton product={product} labels={{ add: m.addToCart, added: m.added }} />
        </div>
      </div>
    </li>
  );
}
