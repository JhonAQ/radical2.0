import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { setPassword } from "../../actions";
import {
  adminInputClass,
  adminButtonClass,
  errorMessages,
  successMessages,
} from "../../types";
import { KeyRound, ShieldCheck } from "lucide-react";

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

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header Info */}
      <div>
        <p className="text-[11px] font-black uppercase tracking-[.2em] text-[#009d9f]">
          Radical 2.0 <span className="mx-1 text-[#a6bab5]">/</span> Perfil
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0a3039] sm:text-4xl">
          Mi cuenta
        </h1>
        <p className="mt-2 text-sm text-[#69827e]">
          Administra tus credenciales de acceso para el panel.
        </p>
      </div>

      {/* Notifications */}
      {(params.error || params.success) && (
        <div
          role="status"
          className={`rounded-xl px-5 py-4 text-sm font-semibold ${
            params.error
              ? "bg-red-100 text-red-800"
              : "bg-teal-100 text-teal-900"
          }`}
        >
          {params.error
            ? errorMessages[params.error] || "Ocurrió un error."
            : successMessages[params.success || ""]}
        </div>
      )}

      {/* Account Info Card */}
      <section className="rounded-3xl border border-[#dce5df] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#ffbf24] text-lg font-black text-[#07333d]">
            {(user?.email || "R")[0].toUpperCase()}
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">{user?.email}</h2>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck size={14} className="text-[#008e98]" />
              <span>Sesión administrativa activa</span>
            </div>
          </div>
        </div>
      </section>

      {/* Change Password Card */}
      <section className="rounded-3xl border border-[#dce5df] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <KeyRound size={20} className="text-[#008e98]" />
          <h2 className="text-xl font-black">Cambiar contraseña</h2>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Crea o actualiza tu contraseña para acceder directamente con correo y
          contraseña.
        </p>

        <form action={setPassword} className="mt-5 space-y-4">
          <label className="block text-sm font-bold text-slate-700">
            Nueva contraseña
            <input
              type="password"
              name="password"
              required
              minLength={12}
              autoComplete="new-password"
              placeholder="Mínimo 12 caracteres"
              className={`${adminInputClass} mt-1`}
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Repite la contraseña
            <input
              type="password"
              name="confirm"
              required
              minLength={12}
              autoComplete="new-password"
              placeholder="Repite la nueva contraseña"
              className={`${adminInputClass} mt-1`}
            />
          </label>
          <button type="submit" className={adminButtonClass}>
            Guardar contraseña
          </button>
        </form>
      </section>
    </div>
  );
}
