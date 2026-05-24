"use server";

import { redirect } from "next/navigation";
import { getSupabaseSessionClient } from "@/lib/supabase/server";

export async function signOutAction(): Promise<void> {
  const supabase = await getSupabaseSessionClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/admin/login?error=signed_out");
}
