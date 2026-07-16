import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cldUrl } from "@/lib/cloudinary/url";
import { type Locale } from "@/i18n/config";
import { getAuthor } from "@/data/authors";
import type { BlogPost } from "@/data/blog";

const UI: Record<Locale, { eyebrow: string; min: string }> = {
  ua: { eyebrow: "Блог · TTMAX", min: "хв" },
  ru: { eyebrow: "Блог · TTMAX", min: "мин" },
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

/** Фонові декорації бренду (лінії + світіння). Спільні для hero й картки списку. */
export function CoverBackdrop() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, rgba(232,255,71,0.06) 0 1px, transparent 1px 46px)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(232,255,71,0.16) 0%, transparent 70%)" }}
      />
    </>
  );
}

/**
 * Фірмовий hero-заголовок статті — рендерить САЙТ (шрифт Barlow Condensed, токени, лого).
 * Єдиний шаблон для всіх статей. Гнучка висота: заголовок будь-якої довжини вміщується.
 * Містить H1 — тому в BlogArticle окремого <header> з H1 у цій гілці немає (без дублю).
 */
export function ArticleCover({
  post,
  locale,
  readMinutes,
}: {
  post: BlogPost;
  locale: Locale;
  readMinutes: number;
}) {
  const ui = UI[locale];
  const author = getAuthor(post.author);
  const initials = author.name[locale]
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  const hasImage = Boolean(post.coverSrc);

  return (
    <div
      className={`relative isolate flex overflow-hidden rounded-2xl border border-border-subtle ${
        hasImage ? "min-h-[300px] sm:min-h-[400px] lg:min-h-[440px]" : ""
      }`}
      style={{
        background: "radial-gradient(120% 130% at 0% 0%, #16202b 0%, #0E1117 44%, #080A0E 100%)",
      }}
    >
      {hasImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverSrc}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-right"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg,#080A0E 0%,rgba(8,10,14,0.92) 34%,rgba(8,10,14,0.5) 64%,rgba(8,10,14,0.1) 100%)",
            }}
          />
        </>
      ) : (
        <CoverBackdrop />
      )}

      <div className="relative z-10 flex w-full flex-col justify-between p-6 sm:p-9 lg:p-11">
        <div className="mb-7 flex items-start justify-between gap-4 sm:mb-9">
          <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
            {ui.eyebrow}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={siteConfig.logoUrl}
            alt={siteConfig.name}
            className="h-11 w-auto shrink-0 rounded-md opacity-95 sm:h-14"
          />
        </div>

        <h1 className="max-w-[88%] font-display text-[clamp(1.45rem,3.2vw,2.4rem)] font-black uppercase leading-[1.06] tracking-[-0.01em] text-balance text-ink sm:max-w-[62%]">
          {post.h1[locale]}
        </h1>

        <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 sm:mt-9">
          <span className="h-[3px] w-8 shrink-0 rounded-full bg-accent" aria-hidden="true" />
          <Link href={`/${locale}/author/${author.slug}`} className="flex items-center gap-2 group">
            {author.photoPublicId ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cldUrl(author.photoPublicId, { w: 56, h: 56, crop: "fill" })}
                alt=""
                aria-hidden="true"
                className="h-7 w-7 rounded-full border border-border-subtle object-cover"
              />
            ) : (
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 font-display text-[11px] font-bold text-accent"
                aria-hidden="true"
              >
                {initials}
              </span>
            )}
            <span className="font-body text-[13px] font-bold text-ink group-hover:text-accent">
              {author.name[locale]}
            </span>
          </Link>
          <span className="text-ink-ghost">·</span>
          <span className="font-body text-[13px] text-ink-muted">{formatDate(post.datePublished)}</span>
          <span className="text-ink-ghost">·</span>
          <span className="font-body text-[13px] text-ink-muted">
            {readMinutes} {ui.min}
          </span>
        </div>
      </div>
    </div>
  );
}
