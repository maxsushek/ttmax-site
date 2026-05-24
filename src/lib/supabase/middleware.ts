import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";

/**
 * Обновляет auth-сессию (рефреш токенов) и возвращает текущего пользователя
 * + флаг is_admin. Вызывается из главного middleware для /admin/* путей.
 *
 *  response — ОБЯЗАТЕЛЬНО возвращается из middleware (хранит свежие куки)
 *  user     — Supabase user или null
 *  isAdmin  — true если email в public.admins
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return { response: supabaseResponse, user: null, isAdmin: false };
  }

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data, error } = await supabase.rpc("is_admin");
    if (!error && data === true) isAdmin = true;
  }

  return { response: supabaseResponse, user, isAdmin };
}
