import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("container-page", className)}>{children}</div>;
}

export function Section({
  children,
  className,
  id,
  as: As = "section",
  ariaLabelledBy,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  as?: "section" | "div" | "article";
  ariaLabelledBy?: string;
}) {
  return (
    <As
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={cn("py-16 sm:py-20 lg:py-24", className)}
    >
      {children}
    </As>
  );
}

export function SectionKicker({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  id,
  className,
}: {
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <h2
      id={id}
      className={cn(
        "font-display text-display-lg font-black uppercase text-balance",
        className,
      )}
    >
      {children}
    </h2>
  );
}
