// src/app/api/admin/revalidate-media/route.ts
// Ручний скид кешу фото вітрини (revalidateTag MEDIA_TAG). Тільки для адміна.
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { MEDIA_TAG } from "@/lib/media/get";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  revalidateTag(MEDIA_TAG);
  return NextResponse.json({ ok: true, revalidated: MEDIA_TAG, at: Date.now() });
}
