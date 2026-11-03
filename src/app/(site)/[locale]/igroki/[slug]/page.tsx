import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { clampDescription } from "@/lib/seo/meta-length";
import { buildBlogMetadata } from "@/lib/seo/blog-metadata";
import { siteConfig } from "@/config/site";
import { PLAYERS } from "@/data/players";
import { allProfiles, getProfile } from "@/data/playerProfiles";
import { PlayerProfileView } from "@/components/content/PlayerProfileView";

export function generateStaticParams() {
  return locales.flatMap((locale) => allProfiles().map((p) => ({ locale, slug: p.slug })));
}

/**
 * Title під запит «на чому грає <імʼя>». ⚠️ ≤ 60 символів (check:meta): довгі імена
 * не влазять у повну формулу — тоді коротша.
 */
function pageTitle(name: string, locale: Locale): string {
  const full = locale === "ua" ? `${name}: на чому грає, інвентар | TTMAX` : `${name}: на чём играет, инвентарь | TTMAX`;
  if (full.length <= 60) return full;
  return locale === "ua" ? `${name}: на чому грає | TTMAX` : `${name}: на чём играет | TTMAX`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: l, slug } = await params;
  if (!isLocale(l)) return {};
  const profile = getProfile(slug);
  if (!profile) return { robots: { index: false, follow: false } };
  const name = PLAYERS[profile.slug].name[l];
  const photo = PLAYERS[profile.slug].photo;
  return buildBlogMetadata({
    locale: l,
    pathname: `/igroki/${profile.slug}`,
    title: pageTitle(name, l),
    description: clampDescription(profile.summary[l]),
    image: photo ? `${siteConfig.url}${photo.src}` : undefined,
  });
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: l, slug } = await params;
  if (!isLocale(l)) notFound();
  const profile = getProfile(slug);
  if (!profile) notFound();
  return <PlayerProfileView profile={profile} locale={l} />;
}

export const dynamicParams = false;
