// Блок відгуків: підсумок (середня + розподіл), список і форма.
// Серверний компонент — відгуки в HTML одразу (їх бачить і покупець, і Google:
// розмітка Review/AggregateRating у Product мусить відповідати видимому).
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { PublicReview, ReviewSummary } from "@/lib/reviews/data";
import { Stars } from "./Stars";
import { ReviewForm } from "./ReviewForm";
import { REVIEW_T, fmtAvg, fmtDate } from "./strings";

export function ReviewSummaryCard({ summary, locale }: { summary: ReviewSummary; locale: Locale }) {
  const t = REVIEW_T[locale];
  const max = Math.max(1, ...summary.dist);
  return (
    <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-border-strong bg-white/[0.02] p-5">
      <div className="text-center">
        <div className="font-display text-5xl font-black leading-none text-ink">{fmtAvg(summary.avg)}</div>
        <Stars value={summary.avg} size={18} className="mt-2" label={`${fmtAvg(summary.avg)} ${t.ofFive}`} />
        <div className="mt-1.5 font-body text-[12px] text-ink-muted">{t.basedOn(summary.count)}</div>
      </div>
      <ul className="min-w-[180px] flex-1 space-y-1.5" aria-hidden>
        {summary.dist.map((n, i) => (
          <li key={i} className="flex items-center gap-2 font-body text-[12px] text-ink-muted">
            <span className="w-3 text-right">{5 - i}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <span className="block h-full rounded-full bg-accent" style={{ width: `${(n / max) * 100}%` }} />
            </span>
            <span className="w-6 text-right tabular-nums">{n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReviewItem({
  r,
  locale,
  productLink,
}: {
  r: PublicReview;
  locale: Locale;
  /** Для /vidguky: назва й адреса товару, про який відгук. */
  productLink?: { name: string; href: string } | null;
}) {
  const t = REVIEW_T[locale];
  return (
    <article className="border-b border-border-subtle py-5 last:border-b-0">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Stars value={r.rating} size={15} label={`${r.rating} ${t.ofFive}`} />
        <span className="font-display text-[15px] font-bold text-ink">{r.name}</span>
        {r.city && <span className="font-body text-[13px] text-ink-muted">{r.city}</span>}
        {r.verified && (
          <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/[0.08] px-2 py-0.5 font-body text-[11px] font-medium text-accent">
            ✓ {t.buyer}
          </span>
        )}
        <time dateTime={r.date} className="ml-auto font-body text-[12px] text-ink-dim">
          {fmtDate(r.date)}
        </time>
      </header>
      {productLink && (
        <Link
          href={productLink.href}
          className="mt-1.5 inline-block font-body text-[13px] text-accent hover:underline"
        >
          {productLink.name}
        </Link>
      )}
      <p className="mt-2 whitespace-pre-line font-body text-[15px] leading-relaxed text-white/85">{r.body}</p>
      {r.reply && (
        <div className="mt-3 rounded-xl border-l-2 border-accent/60 bg-white/[0.03] px-4 py-3">
          <div className="font-display text-[12px] font-bold uppercase tracking-[0.08em] text-accent">{t.reply}</div>
          <p className="mt-1 whitespace-pre-line font-body text-[14px] leading-relaxed text-white/80">{r.reply}</p>
        </div>
      )}
    </article>
  );
}

export function ReviewsSection({
  reviews,
  summary,
  locale,
  productSlug,
  acceptReviews = true,
}: {
  reviews: PublicReview[];
  summary: ReviewSummary;
  locale: Locale;
  productSlug: string;
  /** false — приймання вимкнене (немає REVIEWS_SECRET): показуємо лише відгуки, без форми. */
  acceptReviews?: boolean;
}) {
  const t = REVIEW_T[locale];
  return (
    <section id="reviews" className="mt-4 scroll-mt-24">
      <h2 className="mb-5 font-display text-lg font-bold uppercase tracking-[0.04em] text-ink">
        {t.title}
        {summary.count > 0 && <span className="ml-2 text-ink-muted">{summary.count}</span>}
      </h2>
      <div className={acceptReviews ? "grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]" : ""}>
        <div className="min-w-0">
          {summary.count > 0 ? (
            <>
              <ReviewSummaryCard summary={summary} locale={locale} />
              <div className="mt-2">
                {reviews.map((r) => (
                  <ReviewItem key={r.id} r={r} locale={locale} />
                ))}
              </div>
            </>
          ) : (
            <p className="max-w-[60ch] font-body text-[15px] leading-relaxed text-ink-muted">{t.empty}</p>
          )}
        </div>
        {acceptReviews && (
          <div className="rounded-2xl border border-border-strong bg-white/[0.02] p-5 lg:self-start">
            <h3 className="mb-4 font-display text-base font-bold uppercase tracking-[0.04em] text-ink">{t.write}</h3>
            <ReviewForm kind="product" productSlug={productSlug} locale={locale} />
          </div>
        )}
      </div>
    </section>
  );
}

/** Рядок під назвою товару: зірки + кількість (або запрошення залишити перший відгук). */
export function RatingBadge({ summary, locale }: { summary: ReviewSummary; locale: Locale }) {
  const t = REVIEW_T[locale];
  if (summary.count === 0) {
    return (
      <a href="#reviews" className="mt-2 inline-flex items-center gap-2 font-body text-[13px] text-ink-muted hover:text-accent">
        <Stars value={0} size={14} label={t.writeFirst} />
        {t.writeFirst}
      </a>
    );
  }
  return (
    <a href="#reviews" className="mt-2 inline-flex items-center gap-2 font-body text-[13px] text-ink-muted hover:text-accent">
      <Stars value={summary.avg} size={15} label={`${fmtAvg(summary.avg)} ${t.ofFive}`} />
      <span className="font-medium text-ink">{fmtAvg(summary.avg)}</span>
      <span>· {t.count(summary.count)}</span>
    </a>
  );
}
