import Link from "next/link";
import { defaultLocale } from "@/i18n/config";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 pt-24 text-center">
      <div aria-hidden className="mb-6 text-7xl">
        🏓
      </div>
      <h1 className="mb-3 font-display text-4xl font-black uppercase tracking-tight">404</h1>
      <p className="mb-8 max-w-sm font-body text-base text-ink-muted">
        Page not found / Сторінку не знайдено
      </p>
      <Link
        href={`/${defaultLocale}`}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-6 font-display text-sm font-bold uppercase tracking-[0.08em] text-bg-base transition-colors hover:bg-accent/90"
      >
        ← Home
      </Link>
    </main>
  );
}
