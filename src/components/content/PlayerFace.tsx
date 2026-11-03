// Аватарка гравця: фото з Wikimedia Commons (players.ts) або ініціали. Спільна для
// сторінок гравців і блоку «Хто грає» на картці товару.
import type { Locale } from "@/i18n/config";
import { PLAYERS, playerInitials, type PlayerSlug } from "@/data/players";

export function PlayerFace({ slug, locale, size }: { slug: PlayerSlug; locale: Locale; size: number }) {
  const player = PLAYERS[slug];
  if (player.photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={player.photo.src}
        alt={
          locale === "ua"
            ? `${player.name.ua} — гравець у настільний теніс, фото`
            : `${player.name.ru} — игрок в настольный теннис, фото`
        }
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
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
      {playerInitials(slug, locale)}
    </span>
  );
}
