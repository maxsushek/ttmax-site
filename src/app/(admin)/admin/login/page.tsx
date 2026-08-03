import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Admin · TTMAX",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  // Если уже залогинен и admin — сразу в /admin/leads.
  // Middleware тоже это делает, но дублируем на всякий случай (Server Action → revalidate path).
  const admin = await getCurrentAdmin();
  if (admin) {
    redirect("/admin/leads");
  }

  const params = await searchParams;

  // Відкритий редирект: ?next= підставлявся в router.push() без перевірки, тож посилання
  // /admin/login?next=https://evil.example відправляло адміна на чужий сайт ОДРАЗУ ПІСЛЯ
  // успішного входу — ідеальна обгортка для фішингу («сесія злетіла, увійдіть ще раз»).
  // Пускаємо лише внутрішні шляхи всередині адмінки:
  //   /admin…            — ок
  //   //evil.com         — ні (protocol-relative)
  //   /\evil.com         — ні (деякі браузери трактують \ як /)
  //   https://evil.com   — ні
  const rawNext = params.next ?? "";
  const safeNext =
    rawNext.startsWith("/admin") && !rawNext.startsWith("//") && !rawNext.startsWith("/\\")
      ? rawNext
      : "/admin/leads";

  let initialError: string | undefined;
  if (params.error === "not_admin") {
    initialError = "Этот аккаунт не имеет доступа к админке";
  } else if (params.error === "signed_out") {
    initialError = "Вы вышли из админки";
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#080A0E] p-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-[#E8FF47] rounded-lg flex items-center justify-center text-xl">
              🏓
            </div>
            <span className="text-2xl font-black tracking-wider text-white">
              TT<span className="text-[#E8FF47]">MAX</span>
            </span>
          </div>
          <div className="text-xs uppercase tracking-[0.16em] text-[#666] font-bold">
            Admin Panel
          </div>
        </div>

        <LoginForm next={safeNext} initialError={initialError} />

        <div className="mt-6 text-center text-[11px] text-[#3a3a3a] font-['Barlow',sans-serif]">
          🔒 Только для авторизованных администраторов
        </div>
      </div>
    </main>
  );
}
