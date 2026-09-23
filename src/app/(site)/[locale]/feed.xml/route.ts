// /{locale}/feed.xml — Atom 1.0 стрічка блогу.
//
// ⚠️ Саме Atom, а не RSS 2.0: нам потрібні ОБИДВІ дати — публікації й останньої зміни.
// У RSS 2.0 другої немає, тож агрегатор і ШІ-краулер не бачать, що статтю оновили.
//
// Окрема стрічка на кожну мову: в українських і російських статей різні адреси,
// заголовки й описи, і змішувати їх в одній стрічці означало б віддавати дублі.
import { locales, localeToLang, type Locale } from "@/i18n/config";
import { siteConfig } from "@/config/site";
import { getAllPosts } from "@/data/blog";
import { getAuthor } from "@/data/authors";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Atom вимагає RFC 3339 з часом; у даних лише дата — беремо полудень UTC. */
const rfc3339 = (d: string) => `${d}T12:00:00Z`;

export async function GET(_req: Request, ctx: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await ctx.params;
  const locale = (locales as readonly string[]).includes(raw) ? (raw as Locale) : locales[0];
  const posts = getAllPosts().sort((a, b) => b.dateModified.localeCompare(a.dateModified));
  const self = `${siteConfig.url}/${locale}/feed.xml`;
  const updated = posts[0] ? rfc3339(posts[0].dateModified) : rfc3339("2026-01-01");

  const entries = posts
    .map((p) => {
      const url = `${siteConfig.url}/${locale}/blog/${p.slug}`;
      const author = getAuthor(p.author);
      return `  <entry>
    <title>${esc(p.h1[locale])}</title>
    <link rel="alternate" type="text/html" href="${url}"/>
    <id>${url}</id>
    <published>${rfc3339(p.datePublished)}</published>
    <updated>${rfc3339(p.dateModified)}</updated>
    <author><name>${esc(author?.name[locale] ?? siteConfig.name)}</name></author>
    <summary type="text">${esc(p.excerpt[locale])}</summary>
  </entry>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${localeToLang[locale]}">
  <title>${esc(siteConfig.name)} — блог про настільний теніс</title>
  <link rel="self" type="application/atom+xml" href="${self}"/>
  <link rel="alternate" type="text/html" href="${siteConfig.url}/${locale}/blog"/>
  <id>${self}</id>
  <updated>${updated}</updated>
${entries}
</feed>
`;
  return new Response(xml, {
    headers: { "content-type": "application/atom+xml; charset=utf-8" },
  });
}
