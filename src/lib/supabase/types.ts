import { redirect } from "next/navigation";
import { getSupabaseSessionClient } from "@/lib/supabase/server";

export type AdminUser = {
  id: string;
  email: string;
};

/**
 * Возвращает текущего admin'а, если пользователь залогинен И есть в public.admins.
 * Иначе null. Используется в Server Components где нужна гибкая логика.
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const supabase = await getSupabaseSessionClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || isAdmin !== true) return null;

  return { id: user.id, email: user.email };
}

/**
 * Используется в начале каждой защищённой admin-страницы.
 * Если не admin — редиректит на /admin/login.
 * Если admin — возвращает объект с id/email для использования в странице.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }
  return admin;
}
