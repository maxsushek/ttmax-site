// Зірки й кількість відгуків у картці каталогу. Без хуків — однаково працює і в серверній
// картці (фолбек сітки), і в клієнтському CatalogFilters: розмітка в обох мусить збігатися.
import type { Locale } from "@/i18n/config";
import { Stars } from "./Stars";
import { REVIEW_T, fmtAvg } from "./strings";

export function CardRating({
  rating,
  locale,
}: {
  rating: { avg: number; count: number } | null | undefined;
  locale: Locale;
}) {
  // Без відгуків нічого не малюємо: п'ять порожніх зірок у сітці читаються як «погано».
  if (!rating || rating.count === 0) return null;
  const t = REVIEW_T[locale];
  return (
    <div className="mt-1.5 flex items-center gap-1.5 font-body text-[11px] text-ink-muted">
      <Stars
        value={rating.avg}
        size={12}
        label={`${fmtAvg(rating.avg)} ${t.ofFive}, ${t.count(rating.count)}`}
      />
      <span aria-hidden className="tabular-nums">
        <span className="font-medium text-ink">{fmtAvg(rating.avg)}</span> ({rating.count})
      </span>
    </div>
  );
}
