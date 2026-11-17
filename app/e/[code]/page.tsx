import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/common/BrandLogo";
import { createClient } from "@/utils/supabase/server";
import { normalizeTicketCode } from "@/utils/ticket";

export const metadata: Metadata = {
  title: "Entrada | Radical 2.0",
  robots: { index: false, follow: false },
};

/**
 * Destino del QR de la entrada.
 * - Admin con sesión: va directo a la ficha rápida del escáner.
 * - Cualquier otra persona: página genérica, sin datos ni confirmación de que el código exista.
 */
export default async function TicketLandingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await params;
  const code = normalizeTicketCode(decodeURIComponent(rawCode));

  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && code) {
    const { data: admin } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
    if (admin) {
      redirect(`/admin/escaner?c=${code}`);
    }
  }

  return (
    <main className="grid min-h-svh place-items-center bg-[#f8f4e9] px-4 py-10 text-[#0b2d36]">
      <div className="w-full max-w-sm text-center">
        <BrandLogo variant="principal" width={220} className="mx-auto" priority />
        <h1 className="mt-6 text-2xl font-extrabold">Entrada de Radical 2.0</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#46605f]">
          Este código es una entrada personal al campamento. El equipo la valida al llegar.
        </p>
        <div className="mt-6 grid gap-2">
          <Link
            href="/mi-inscripcion"
            className="rounded-xl bg-[#0b2d36] px-4 py-3 text-sm font-bold text-[#f8f4e9]"
          >
            Ver mi inscripción
          </Link>
          <Link href="/" className="rounded-xl px-4 py-3 text-sm font-bold text-[#0b2d36] underline-offset-4 hover:underline">
            Ir a la página del campamento
          </Link>
        </div>
      </div>
    </main>
  );
}
