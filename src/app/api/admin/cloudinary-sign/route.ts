// src/app/api/admin/cloudinary-sign/route.ts
// Выдаёт подпись для прямой загрузки браузер → Cloudinary. Только для админа.
import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { signUpload } from "@/lib/cloudinary/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES = new Set(["product", "category", "brand"]);
const SLUG_RE = /^[a-z0-9-]{1,80}$/;

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = String((body as { type?: unknown })?.type ?? "");
  const slug = String((body as { slug?: unknown })?.slug ?? "");
  if (!TYPES.has(type) || !SLUG_RE.test(slug)) {
    return NextResponse.json({ error: "Bad params" }, { status: 400 });
  }

  const signed = signUpload(`ttmax/${type}/${slug}`);
  if (!signed) {
    return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500 });
  }
  return NextResponse.json(signed);
}
