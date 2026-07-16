import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Section";
import { cldUrl } from "@/lib/cloudinary/url";
import { siteConfig } from "@/config/site";
import { type Locale } from "@/i18n/config";
import { getAuthor } from "@/data/authors";
import { getAllPosts } from "@/data/blog";
import { CoverBackdrop } from "@/components/content/ArticleCover";

const UI: Record<Locale, { title: string; subtitle: string; empty: string }> = {
  ua: {
    title: "Блог",
    subtitle: "Гайди, правила та поради від гравця-практика — як обрати інвентар і грати краще.",
    empty: "Статті скоро з'являться.",
  },
  ru: {
    title: "Блог",
    subtitle: "Гайды, правила и советы от игрока-практика — как выбрать инвентарь и играть лучше.",
    empty: "Статьи скоро появятся.",
  },
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function BlogList({ locale }: { locale: Locale }) {
  const ui = UI[locale];
  const posts = getAllPosts();

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container className="max-w-4xl">
        <header className="mb-10 border-b border-border-subtle pb-6">
          <h1 className="font-display text-display-md font-black uppercase">{ui.title}</h1>
          <p className="mt-2 max-w-2xl font-body text-[15px] leading-relaxed text-ink-muted">{ui.subtitle}</p>
        </header>

        {posts.length === 0 ? (
          <p className="font-body text-[15px] text-ink-muted">{ui.empty}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((post) => {
              const author = getAuthor(post.author);
              const thumb = post.heroPublicId
                ? cldUrl(post.heroPublicId, { w: 640, h: 360, crop: "fill" })
                : "";
              return (
                <Link
                  key={post.slug}
                  href={`/${locale}/blog/${post.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-bg-raised transition-colors hover:border-border-strong"
                >
                  <div
                    className="relative aspect-[16/9] overflow-hidden"
                    style={{
                      background:
                        "radial-gradient(120% 130% at 0% 0%, #16202b 0%, #0E1117 44%, #080A0E 100%)",
                    }}
                  >
                    {post.coverSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.coverSrc}
                        alt={post.heroAlt[locale]}
                        className="absolute inset-0 h-full w-full object-cover object-right"
                      />
                    ) : thumb ? (
                      <Image
                        src={thumb}
                        alt={post.heroAlt[locale]}
                        width={640}
                        height={360}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <CoverBackdrop />
                    )}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(180deg,rgba(8,10,14,0.05) 0%,rgba(8,10,14,0.35) 52%,rgba(8,10,14,0.94) 100%)",
                      }}
                    />
                    <span className="absolute left-3 top-3 z-10 inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
                      Блог
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={siteConfig.logoUrl}
                      alt={siteConfig.name}
                      className="absolute right-3 top-3 z-10 h-8 w-auto rounded-md opacity-90"
                    />
                    <h2 className="absolute inset-x-0 bottom-0 z-10 line-clamp-2 p-4 font-display text-[17px] font-black uppercase leading-[1.05] text-balance text-ink group-hover:text-accent">
                      {post.h1[locale]}
                    </h2>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="mb-2 font-body text-[12px] uppercase tracking-[0.12em] text-ink-dim">
                      {formatDate(post.datePublished)}
                    </p>
                    <p className="mb-4 font-body text-[14px] leading-relaxed text-ink-muted">
                      {post.excerpt[locale]}
                    </p>
                    <p className="mt-auto font-body text-[12px] text-ink-dim">{author.name[locale]}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
