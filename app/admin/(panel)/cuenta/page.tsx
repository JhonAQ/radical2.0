import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { logout, setPassword } from "../../actions";
import { adminInputClass, adminButtonClass } from "../../types";
import { KeyRound, LogOut } from "lucide-react";
import { FlashMessage } from "../../components/FlashMessage";
import { PendingFieldset } from "../../components/PendingFieldset";
import { PageHeader } from "../../components/PageHeader";

export default async function AdminCuentaPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
}) {
  const params = await searchParams;
  const client = createClient(await cookies());

  const {
    data: { user },
  } = await client.auth.getUser();
  const { data: membership } = user
    ? await client.from("admin_users").select("role").eq("user_id", user.id).maybeSingle()
    : { data: null };

  return (
    <div className="max-w-2xl space-y-4 lg:space-y-6">
      <PageHeader title="Mi cuenta" description="Tu acceso al panel." />

      <FlashMessage error={params.error} success={params.success} />

      <section className="rounded-2xl border border-[#e2e8e4] bg-white">
        <div className="flex items-center gap-3 p-4 sm:p-5">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#ffbf24] text-lg font-black text-[#07333d]">
            {(user?.email || "R")[0].toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-[#0a3039]">{user?.email}</p>
            <p className="text-sm text-[#5f7a75]">{membership?.role === "master" ? "Cuenta maestra" : "Administrador"}</p>
          </div>
        </div>

        <div className="border-t border-[#eef2ef] p-4 sm:p-5">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#0a3039]">
            <KeyRound size={18} className="text-[#0a524a]" aria-hidden />
            Cambiar contraseña
          </h2>
          <p className="mt-0.5 text-sm text-[#5f7a75]">Para entrar con tu correo y contraseña, además de Google.</p>
          <form action={setPassword} className="mt-4 grid max-w-md gap-3">
            <PendingFieldset className="contents">
              <label className="block text-sm font-semibold text-[#2c4a47]">
                Nueva contraseña
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  className={`${adminInputClass} mt-1`}
                />
              </label>
              <label className="block text-sm font-semibold text-[#2c4a47]">
                Repite la contraseña
                <input
                  type="password"
                  name="confirm"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Repite la nueva contraseña"
                  className={`${adminInputClass} mt-1`}
                />
              </label>
              <button type="submit" className={`${adminButtonClass} min-h-12 w-full sm:w-auto`}>
                Guardar contraseña
              </button>
            </PendingFieldset>
          </form>
        </div>

        <form action={logout} className="border-t border-[#eef2ef] p-4 sm:p-5">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
          >
            <LogOut size={16} aria-hidden />
            Cerrar sesión
          </button>
        </form>
      </section>
    </div>
  );
}
