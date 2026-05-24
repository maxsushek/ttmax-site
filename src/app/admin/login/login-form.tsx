"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signInAction } from "./actions";

export function LoginForm({
  next,
  initialError,
}: {
  next: string;
  initialError?: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>(initialError);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(undefined);

    if (!email.trim() || !password) {
      setError("Введите email и пароль");
      return;
    }

    startTransition(async () => {
      const result = await signInAction({
        email: email.trim(),
        password,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      router.push(next);
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#0E1117] border border-white/[0.08] rounded-2xl p-7"
    >
      <h1 className="text-xl font-bold text-white mb-5 tracking-tight">
        Вход в админку
      </h1>

      <label className="block mb-4">
        <span className="block text-[12px] font-medium text-[#666] mb-1.5 font-['Barlow',sans-serif]">
          Email
        </span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          disabled={isPending}
          placeholder="you@example.com"
          className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3.5 py-3 text-[15px] text-white outline-none transition-colors focus:border-[#E8FF47]/50 placeholder:text-[#3a3a3a] disabled:opacity-50 font-['Barlow',sans-serif]"
        />
      </label>

      <label className="block mb-4">
        <span className="block text-[12px] font-medium text-[#666] mb-1.5 font-['Barlow',sans-serif]">
          Пароль
        </span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          disabled={isPending}
          placeholder="••••••••"
          className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3.5 py-3 text-[15px] text-white outline-none transition-colors focus:border-[#E8FF47]/50 placeholder:text-[#3a3a3a] disabled:opacity-50 font-['Barlow',sans-serif]"
        />
      </label>

      {error && (
        <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-[#FF6B81]/[0.08] border border-[#FF6B81]/20 text-[#FF6B81] text-[13px] font-['Barlow',sans-serif] leading-snug">
          ⚠ {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#E8FF47] text-[#080A0E] font-black text-[15px] tracking-[0.08em] uppercase rounded-xl py-3.5 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Вход..." : "Войти →"}
      </button>
    </form>
  );
}
