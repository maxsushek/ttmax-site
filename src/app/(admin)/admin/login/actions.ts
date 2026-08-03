"use server";

import { getSupabaseSessionClient } from "@/lib/supabase/server";

export type SignInResult = { error?: string };

export async function signInAction(input: {
  email: string;
  password: string;
}): Promise<SignInResult> {
  const email = input.email?.trim();
  const password = input.password;

  if (!email || !password) {
    return { error: "Введите email и пароль" };
  }

  const supabase = await getSupabaseSessionClient();
  if (!supabase) {
    return { error: "Сервис временно недоступен" };
  }

  // 1. Логин
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user?.email) {
    // Не различаем «не найден» и «неверный пароль» — это правильная практика
    // чтобы не сливать инфу о существовании email-ов.
    return { error: "Неверный email или пароль" };
  }

  // 2. Проверка что пользователь — admin
  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");

  if (adminError || isAdmin !== true) {
    // Сессия создалась, но пользователь не админ — закрываем сессию
    await supabase.auth.signOut();
    return { error: "Этот аккаунт не имеет доступа к админке" };
  }

  // 3. Успех — сессия активна, middleware пропустит на admin-страницы
  return {};
}

/**
 * Завершение сессии. Используется на кнопке "Выйти" в админке.
 */
export async function signOutAction(): Promise<{ ok: true } | { error: string }> {
  const supabase = await getSupabaseSessionClient();
  if (!supabase) {
    return { error: "Сервис временно недоступен" };
  }
  await supabase.auth.signOut();
  return { ok: true };
}
