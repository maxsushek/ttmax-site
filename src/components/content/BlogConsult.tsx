// «Не впевнені, що обрати?» — пропозиція підбору посеред статті-порівняння.
//
// НАВІЩО: статті «ALC чи ZLC», «Версії основ», «Як вибрати ракетку» читають ті, хто обирає,
// а єдиний шлях далі був — самому розібратись у таблицях. Тут людина лишає номер, і заявка
// (source="blog-consult", з назвою статті) іде в CRM і Telegram, як швидке замовлення.
//
// ⚠️ Правило формату блогу (skill ttmax-blog): у статті немає цін і кнопок «Купити».
// Це не кнопка покупки, а консультація — правило не порушує. Ставиться на статтю полем
// BlogPost.consultAfter (id розділу, після якого показати), не частіше одного разу.
import { QuickOrder } from "@/components/catalog/QuickOrder";
import type { Locale } from "@/i18n/config";

const T = {
  ua: {
    title: "Не впевнені, що обрати?",
    text: "Залиште номер — порадимо основу й накладки під ваш рівень і стиль гри. Безкоштовно, без зобовʼязань.",
  },
  ru: {
    title: "Не уверены, что выбрать?",
    text: "Оставьте номер — подскажем основание и накладки под ваш уровень и стиль игры. Бесплатно, без обязательств.",
  },
} as const;

export function BlogConsult({
  locale,
  slug,
  topic,
}: {
  locale: Locale;
  slug: string;
  topic: string;
}) {
  const t = T[locale];
  return (
    <aside className="rounded-2xl border border-accent/30 bg-accent/[0.05] p-5">
      <p className="font-display text-base font-bold uppercase tracking-wide text-ink">{t.title}</p>
      <p className="mb-4 mt-1.5 font-body text-[14px] leading-relaxed text-ink-muted">{t.text}</p>
      <QuickOrder locale={locale} productName={topic} productSlug={`blog:${slug}`} consult />
    </aside>
  );
}
