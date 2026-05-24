"use client";

import { useTransition } from "react";
import { signOutAction } from "./actions";

export function AdminTopBar({ email }: { email: string }) {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    if (isPending) return;
    if (!confirm("Точно выйти из админки?")) return;
    startTransition(() => signOutAction());
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0A0C12]/95 backdrop-blur border-b border-white/[0.06]">
      <div className="max-w-[1400px] mx-auto px-5 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-[#E8FF47] rounded-lg flex items-center justify-center text-base shrink-0">
            🏓
          </div>
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="font-black text-base tracking-wider whitespace-nowrap">
              TT<span className="text-[#E8FF47]">MAX</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#555]">
              Admin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[12px] text-[#777] font-['Barlow',sans-serif] truncate max-w-[200px]">
            {email}
          </span>
          <button
            onClick={handleSignOut}
            disabled={isPending}
            className="text-[12px] font-bold tracking-[0.08em] uppercase text-[#888] hover:text-white border border-white/10 hover:border-white/25 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            {isPending ? "Выход..." : "Выйти →"}
          </button>
        </div>
      </div>
    </header>
  );
}
