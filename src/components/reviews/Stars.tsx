// Зірки рейтингу (лише показ). Дробові значення — частковим заповненням останньої зірки.
import { cn } from "@/utils/cn";

const PATH =
  "M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5z";

export function Stars({
  value,
  size = 16,
  className,
  label,
}: {
  value: number;
  size?: number;
  className?: string;
  /** Текст для читачів екрана, напр. «4,8 з 5». */
  label?: string;
}) {
  const v = Math.max(0, Math.min(5, value));
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={label ?? `${v} / 5`}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, v - i));
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
            <path d={PATH} fill="currentColor" className="text-white/15" />
            {fill > 0 && (
              <path
                d={PATH}
                fill="currentColor"
                className="text-accent"
                style={fill < 1 ? { clipPath: `inset(0 ${100 - fill * 100}% 0 0)` } : undefined}
              />
            )}
          </svg>
        );
      })}
    </span>
  );
}
