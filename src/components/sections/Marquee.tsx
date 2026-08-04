import { brands } from "@/data/brands";

export function Marquee() {
  // 3x for seamless loop
  const items = [...brands, ...brands, ...brands];
  return (
    <div
      aria-hidden
      className="overflow-hidden border-y border-white/[0.04] bg-accent/[0.018] py-3"
    >
      <div className="flex gap-[52px] whitespace-nowrap animate-marquee">
        {items.map((b, i) => (
          <span
            key={`${b.id}-${i}`}
            className="flex shrink-0 items-center gap-2.5 font-display text-xs font-bold uppercase tracking-[0.13em] text-ink-ghost"
          >
            <span className="emoji">{b.flag}</span>
            {b.name}
            {/* Роздільник намальовано CSS, а не символом ◆: цих ромбів на головній 18, і вони
                робили кандидатом підмножину «symbols» у Roboto (18 КБ), якої немає серед
                префетчених шрифтів. Квадрат, повернутий на 45°, виглядає так само. */}
            <span aria-hidden className="h-[5px] w-[5px] rotate-45 bg-accent" />
          </span>
        ))}
      </div>
    </div>
  );
}
