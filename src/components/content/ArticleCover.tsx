import { siteConfig } from "@/config/site";
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

/**
 * Фірмова обкладинка статті — рендериться сайтом (шрифт Barlow Condensed, токени, лого).
 * Єдиний шаблон для всіх статей → консистентний UI. Використовується, коли немає heroPublicId.
 * Пропорція ~1200×520 (близько до og 1.91:1). Тема — типографіка бренду, без стокових фото.
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

  return (
    <div
      className="relative isolate overflow-hidden rounded-2xl border border-border-subtle"
      style={{
        aspectRatio: "1200 / 520",
        background:
          "radial-gradient(120% 120% at 0% 0%, #16202b 0%, #0E1117 42%, #080A0E 100%)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
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

      <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-8 lg:p-10">
        <div className="flex items-start justify-between gap-4">
          <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
            {ui.eyebrow}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={siteConfig.logoUrl}
            alt={siteConfig.name}
            className="h-11 w-auto shrink-0 opacity-95 sm:h-14"
          />
        </div>

        <h2 className="max-w-[85%] font-display text-[clamp(1.6rem,4.6vw,3.1rem)] font-black uppercase leading-[0.98] tracking-[-0.01em] text-ink">
          {post.h1[locale]}
        </h2>

        <div className="flex items-center gap-2.5 font-body text-[12px] text-ink-muted sm:text-[13px]">
          <span className="h-[3px] w-8 rounded-full bg-accent" aria-hidden="true" />
          <span className="font-bold text-ink">{author.name[locale]}</span>
          <span className="text-ink-ghost">·</span>
          <span>{formatDate(post.datePublished)}</span>
          <span className="text-ink-ghost">·</span>
          <span>
            {readMinutes} {ui.min}
          </span>
        </div>
      </div>
    </div>
  );
}
