import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Section";
import { breadcrumbJsonLd, blogPostingJsonLd, faqJsonLd } from "@/lib/seo/jsonld";
import { cldUrl } from "@/lib/cloudinary/url";
import { siteConfig } from "@/config/site";
import { localeToLang, type Locale } from "@/i18n/config";
import { getAuthor } from "@/data/authors";
import type { BlogPost } from "@/data/blog";
import { getRelatedPosts } from "@/data/blog";
import { PlayStyleQuiz } from "@/components/content/PlayStyleQuiz";
import { RacketPickerQuiz } from "@/components/content/RacketPickerQuiz";
import { ArticleCover } from "@/components/content/ArticleCover";

const UI = {
  ua: {
    home: "Головна",
    blog: "Блог",
    contents: "Зміст",
    opinion: "Думка магазину",
    faqHeading: "Часті запитання",
    linksHeading: "Корисне в каталозі",
    relatedHeading: "Читайте також",
    minRead: "хв читання",
    author: "Автор",
    profiles: "Профілі",
    published: "Опубліковано",
    updated: "Оновлено",
  },
  ru: {
    home: "Главная",
    blog: "Блог",
    contents: "Содержание",
    opinion: "Мнение магазина",
    faqHeading: "Частые вопросы",
    linksHeading: "Полезное в каталоге",
    relatedHeading: "Читайте также",
    minRead: "мин чтения",
    author: "Автор",
    profiles: "Профили",
    published: "Опубликовано",
    updated: "Обновлено",
  },
} satisfies Record<Locale, Record<string, string>>;

/** YYYY-MM-DD → DD.MM.YYYY */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function readingMinutes(post: BlogPost, locale: Locale): number {
  const text: string[] = [
    ...(post.intro[locale] ?? []),
    ...post.sections.flatMap((s) => s.p[locale] ?? []),
  ];
  const words = text.join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 180));
}

function AuthorAvatar({
  initials,
  size,
  photoUrl,
  name,
}: {
  initials: string;
  size: number;
  photoUrl?: string;
  name?: string;
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name ?? ""}
        className="shrink-0 rounded-full border border-border-subtle object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-accent/15 font-display font-bold text-accent"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

/** Гарна назва профілю за хостом (для карток sameAs). */
function profileLabel(url: string): string {
  const host = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  })();
  if (host.includes("uttf")) return "UTTF";
  if (host.includes("ttwrating")) return "TTW Rating";
  if (host.includes("tt-kharkiv")) return "TT Kharkiv";
  return host;
}

export function BlogArticle({ post, locale }: { post: BlogPost; locale: Locale }) {
  const ui = UI[locale];
  const author = getAuthor(post.author);
  const authorPath = `/author/${author.slug}`;
  const authorUrl = `${siteConfig.url}/${locale}${authorPath}`;
  const pageUrl = `${siteConfig.url}/${locale}/blog/${post.slug}`;
  const initials = author.name[locale]
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  const authorPhoto = author.photoPublicId
    ? cldUrl(author.photoPublicId, { w: 120, h: 120, crop: "fill" })
    : "";
  const heroUrl = post.heroPublicId
    ? cldUrl(post.heroPublicId, { w: 1200, h: 630, crop: "fill" })
    : "";
  const related = getRelatedPosts(post);

  const breadcrumb = breadcrumbJsonLd(
    [
      { name: ui.home, path: "/" },
      { name: ui.blog, path: "/blog" },
      { name: post.h1[locale], path: `/blog/${post.slug}` },
    ],
    locale,
  );
  const blogLd = blogPostingJsonLd({
    url: pageUrl,
    headline: post.h1[locale],
    description: post.metaDescription[locale],
    images: heroUrl ? [heroUrl] : undefined,
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    authorName: author.name[locale],
    authorUrl,
    inLanguage: localeToLang[locale],
  });
  const faqLd =
    post.faq && post.faq.length > 0
      ? faqJsonLd(post.faq.map((f) => ({ q: f.q[locale], a: f.a[locale] })))
      : null;
  const readMin = readingMinutes(post, locale);

  return (
    <article className="py-12 sm:py-16 lg:py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogLd) }} />
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      )}

      <Container className="max-w-3xl">
        <nav className="mb-6 font-body text-[12px] uppercase tracking-[0.12em] text-ink-dim" aria-label="breadcrumb">
          <Link href={`/${locale}`} className="hover:text-ink">
            {ui.home}
          </Link>
          <span className="mx-1.5 text-ink-ghost">/</span>
          <Link href={`/${locale}/blog`} className="hover:text-ink">
            {ui.blog}
          </Link>
          <span className="mx-1.5 text-ink-ghost">/</span>
          <span className="text-ink-muted">{post.h1[locale]}</span>
        </nav>

        {heroUrl ? (
          <>
            <header className="mb-6">
              <h1 className="font-display text-display-md font-black uppercase text-balance">
                {post.h1[locale]}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <Link href={`/${locale}${authorPath}`} className="flex items-center gap-2.5 group">
                  <AuthorAvatar initials={initials} size={34} photoUrl={authorPhoto} name={author.name[locale]} />
                  <span className="font-body text-[13px] leading-tight">
                    <span className="font-bold text-ink group-hover:text-accent">{author.name[locale]}</span>
                    <span className="block text-ink-muted">{author.jobTitle[locale]}</span>
                  </span>
                </Link>
                <span className="ml-auto font-body text-[12px] text-ink-muted">
                  {formatDate(post.datePublished)} · {readMin} {ui.minRead}
                </span>
              </div>
            </header>
            <figure className="mb-8">
              <Image
                src={heroUrl}
                alt={post.heroAlt[locale]}
                width={1200}
                height={630}
                priority
                className="w-full rounded-2xl border border-border-subtle"
              />
              {post.heroCaption && (
                <figcaption className="mt-2 font-body text-[12px] italic text-ink-dim">
                  {post.heroCaption[locale]}
                </figcaption>
              )}
            </figure>
          </>
        ) : (
          <div className="mb-8">
            <ArticleCover post={post} locale={locale} readMinutes={readMin} />
          </div>
        )}

        {post.intro[locale].map((para, i) => (
          <p key={i} className="mb-4 font-body text-[16px] leading-relaxed text-ink-muted">
            {para}
          </p>
        ))}

        {post.sections.length > 1 && (
          <nav className="my-8 rounded-2xl border border-border-subtle bg-bg-raised p-5" aria-label={ui.contents}>
            <p className="mb-3 font-display text-[12px] font-bold uppercase tracking-[0.12em] text-ink-muted">
              {ui.contents}
            </p>
            <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {post.sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="font-body text-[14px] text-accent hover:underline">
                    {s.h[locale]}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="flex flex-col gap-8">
          {post.sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="mb-3 font-display text-lg font-bold uppercase tracking-wide text-ink">
                {s.h[locale]}
              </h2>
              <div className="flex flex-col gap-2.5">
                {s.p[locale].map((para, j) => (
                  <p key={j} className="font-body text-[15px] leading-relaxed text-ink-muted">
                    {para}
                  </p>
                ))}
              </div>
              {s.table && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full border-collapse font-body text-[14px]">
                    <thead>
                      <tr>
                        {s.table.columns.map((c, ci) => (
                          <th
                            key={ci}
                            scope="col"
                            className="border-b border-border-strong px-3 py-2 text-left font-bold uppercase tracking-wide text-ink-muted"
                          >
                            {c[locale]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.table.rows.map((row, ri) => (
                        <tr key={ri}>
                          {row.map((cell, cj) => (
                            <td
                              key={cj}
                              className="border-b border-border-subtle px-3 py-2 text-ink"
                            >
                              {cell[locale]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {s.links && s.links.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {s.links.map((l, i) => (
                    <Link
                      key={i}
                      href={`/${locale}${l.href}`}
                      className="rounded-full border border-accent/40 px-3 py-1 font-body text-[13px] text-accent hover:bg-accent/10"
                    >
                      {l.label[locale]}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        {post.opinion && (
          <aside className="my-9 rounded-r-2xl border-l-[3px] border-accent bg-accent/10 px-5 py-4">
            <p className="mb-1.5 font-display text-[12px] font-bold uppercase tracking-[0.1em] text-accent">
              {ui.opinion}
            </p>
            <p className="font-body text-[15px] italic leading-relaxed text-ink">{post.opinion.body[locale]}</p>
            <p className="mt-2 font-body text-[12px] text-ink-muted">— {author.name[locale]}</p>
          </aside>
        )}

        {post.interactive === "playStyle" && <PlayStyleQuiz locale={locale} />}
        {post.interactive === "racketPicker" && <RacketPickerQuiz locale={locale} />}

        {post.faq && post.faq.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 font-display text-lg font-bold uppercase tracking-wide text-ink">
              {ui.faqHeading}
            </h2>
            <div className="flex flex-col">
              {post.faq.map((f, i) => (
                <div key={i} className="border-t border-border-subtle py-3.5 last:border-b">
                  <p className="mb-1 font-body text-[15px] font-bold text-ink">{f.q[locale]}</p>
                  <p className="font-body text-[14px] leading-relaxed text-ink-muted">{f.a[locale]}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {post.officialSource && (
          <p className="mt-8 rounded-xl border border-border-subtle bg-bg-raised px-4 py-3 font-body text-[14px] text-ink-muted">
            <a
              href={post.officialSource.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-accent hover:underline"
            >
              {post.officialSource.label[locale]} ↗
            </a>
          </p>
        )}

        {(post.relatedProducts?.length || related.length > 0) && (
          <section className="mt-10 rounded-2xl border border-border-subtle bg-bg-raised p-5">
            {post.relatedProducts && post.relatedProducts.length > 0 && (
              <div className="mb-4">
                <p className="mb-2.5 font-display text-[12px] font-bold uppercase tracking-[0.1em] text-ink-muted">
                  {ui.linksHeading}
                </p>
                <div className="flex flex-wrap gap-2">
                  {post.relatedProducts.map((l, i) => (
                    <Link
                      key={i}
                      href={`/${locale}${l.href}`}
                      className="rounded-full border border-accent/40 px-3 py-1 font-body text-[13px] text-accent hover:bg-accent/10"
                    >
                      {l.label[locale]}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {related.length > 0 && (
              <div>
                <p className="mb-2.5 font-display text-[12px] font-bold uppercase tracking-[0.1em] text-ink-muted">
                  {ui.relatedHeading}
                </p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {related.map((r) => (
                    <li key={r.slug}>
                      <Link
                        href={`/${locale}/blog/${r.slug}`}
                        className="block rounded-lg border border-border-subtle px-3 py-2 font-body text-[13px] text-ink hover:border-border-strong hover:text-accent"
                      >
                        {r.h1[locale]}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <footer className="mt-10 flex items-start gap-4 rounded-2xl border border-border-subtle bg-bg-raised p-5">
          <AuthorAvatar initials={initials} size={48} photoUrl={authorPhoto} name={author.name[locale]} />
          <div className="min-w-0">
            <Link href={`/${locale}${authorPath}`} className="font-display text-[14px] font-bold text-ink hover:text-accent">
              {author.name[locale]}
            </Link>
            <p className="mt-1 font-body text-[13px] leading-relaxed text-ink-muted">{author.bio[locale]}</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {author.stats.map((st, i) => (
                <span
                  key={i}
                  className="rounded-full border border-border-subtle px-2.5 py-0.5 font-body text-[12px] text-ink-muted"
                >
                  {st.value} · {st.label[locale]}
                </span>
              ))}
            </div>
            {author.sameAs.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="font-body text-[11px] uppercase tracking-[0.12em] text-ink-dim">
                  {ui.profiles}
                </span>
                {author.sameAs.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1 font-body text-[12px] text-accent hover:underline"
                  >
                    {profileLabel(url)}
                    <span aria-hidden="true">↗</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </footer>
      </Container>
    </article>
  );
}
