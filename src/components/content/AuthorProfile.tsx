import Link from "next/link";
import { Container } from "@/components/ui/Section";
import { personJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { cldUrl } from "@/lib/cloudinary/url";
import { siteConfig } from "@/config/site";
import { type Locale } from "@/i18n/config";
import type { Author } from "@/data/authors";
import { getAllPosts } from "@/data/blog";

const UI = {
  ua: { home: "Головна", blog: "Блог", articles: "Статті автора", profiles: "Профілі" },
  ru: { home: "Главная", blog: "Блог", articles: "Статьи автора", profiles: "Профили" },
} satisfies Record<Locale, Record<string, string>>;

export function AuthorProfile({ author, locale }: { author: Author; locale: Locale }) {
  const ui = UI[locale];
  const authorPath = `/author/${author.slug}`;
  const authorUrl = `${siteConfig.url}/${locale}${authorPath}`;
  const photo = author.photoPublicId
    ? cldUrl(author.photoPublicId, { w: 240, h: 240, crop: "thumb", gravity: "face", z: 1.2 })
    : "";
  const initials = author.name[locale]
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  const posts = getAllPosts().filter((p) => p.author === author.slug);

  const person = personJsonLd({
    name: author.name[locale],
    url: authorUrl,
    jobTitle: author.jobTitle[locale],
    description: author.description[locale],
    image: photo || undefined,
    knowsAbout: author.knowsAbout.map((k) => k[locale]),
    sameAs: author.sameAs,
  });
  const breadcrumb = breadcrumbJsonLd(
    [
      { name: ui.home, path: "/" },
      { name: ui.blog, path: "/blog" },
      { name: author.name[locale], path: authorPath },
    ],
    locale,
  );

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Container className="max-w-3xl">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={author.name[locale]}
              width={96}
              height={96}
              className="h-24 w-24 rounded-full border border-border-subtle object-cover"
            />
          ) : (
            <span
              className="flex items-center justify-center rounded-full bg-accent/15 font-display text-2xl font-bold text-accent"
              style={{ width: 96, height: 96 }}
              aria-hidden="true"
            >
              {initials}
            </span>
          )}
          <div>
            <h1 className="font-display text-display-md font-black uppercase">{author.name[locale]}</h1>
            <p className="mt-1 font-body text-[14px] text-ink-muted">{author.jobTitle[locale]}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {author.stats.map((st, i) => (
                <span
                  key={i}
                  className="rounded-full border border-border-subtle px-2.5 py-0.5 font-body text-[12px] text-ink-muted"
                >
                  {st.value} · {st.label[locale]}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-6 font-body text-[15px] leading-relaxed text-ink-muted">{author.description[locale]}</p>

        {author.sameAs.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 font-display text-[12px] font-bold uppercase tracking-[0.12em] text-ink-dim">
              {ui.profiles}
            </p>
            <div className="flex flex-wrap gap-3">
              {author.sameAs.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="font-body text-[13px] text-accent hover:underline"
                >
                  {new URL(url).hostname.replace(/^www\./, "")}
                </a>
              ))}
            </div>
          </div>
        )}

        {posts.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 font-display text-lg font-bold uppercase tracking-wide text-ink">{ui.articles}</h2>
            <ul className="flex flex-col gap-2">
              {posts.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/${locale}/blog/${p.slug}`}
                    className="block rounded-lg border border-border-subtle px-4 py-3 font-body text-[14px] text-ink hover:border-border-strong hover:text-accent"
                  >
                    {p.h1[locale]}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Container>
    </div>
  );
}
