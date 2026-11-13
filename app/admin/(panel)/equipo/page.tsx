import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { AdminDialog } from "../../AdminDialog";
import {
  adminInputClass,
  adminButtonClass,
  errorMessages,
  successMessages,
  type AdminUser,
} from "../../types";
import {
  createAdmin,
  removeAdmin,
  grantExistingAdmin,
  resetAdminPassword,
} from "../../actions";
import { UserPlus, Shield, Trash2, KeyRound } from "lucide-react";

export default async function AdminEquipoPage({
  searchParams,
}: {
  searchParams: Promise<{
    dialog?: string;
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
    ? await client
        .from("admin_users")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  if (membership?.role !== "master") {
    redirect("/admin");
  }

  const secret =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  let admins: AdminUser[] = [];
  if (secret && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const service = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      secret,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: memberships } = await service
      .from("admin_users")
      .select("user_id,role");

    admins = await Promise.all(
      (memberships || []).map(async (m) => {
        const { data } = await service.auth.admin.getUserById(m.user_id);
        return { ...m, email: data.user?.email ?? m.user_id };
      }),
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header Info */}
      <div>
        <p className="text-[11px] font-black uppercase tracking-[.2em] text-[#009d9f]">
          Radical 2.0 <span className="mx-1 text-[#a6bab5]">/</span> Equipo
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0a3039] sm:text-4xl">
          Equipo administrador
        </h1>
        <p className="mt-2 text-sm text-[#69827e]">
          Gestiona los accesos y roles del equipo que trabaja en el campamento.
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

      {/* Team Card */}
      <section className="rounded-3xl border border-[#dce5df] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black">Miembros autorizados</h2>
            <p className="mt-1 text-sm text-slate-500">
              La cuenta maestra tiene permisos para crear y remover administradores.
            </p>
          </div>
          <Link
            href="/admin/equipo?dialog=create"
            className={`${adminButtonClass} gap-2`}
          >
            <UserPlus size={16} />
            <span>Agregar administrador</span>
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {admins.map((a) => (
            <div
              key={a.user_id}
              className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition hover:bg-slate-50"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Shield
                    size={16}
                    className={
                      a.role === "master" ? "text-amber-500" : "text-[#008e98]"
                    }
                  />
                  <span className="font-semibold text-slate-900">{a.email}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      a.role === "master"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-teal-100 text-teal-800"
                    }`}
                  >
                    {a.role === "master" ? "Maestra" : "Admin"}
                  </span>
                </div>
                {a.role === "admin" && (
                  <form action={removeAdmin}>
                    <input type="hidden" name="id" value={a.user_id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 text-xs font-bold text-red-700 hover:underline"
                    >
                      <Trash2 size={13} />
                      <span>Quitar</span>
                    </button>
                  </form>
                )}
              </div>

              <details className="mt-3 text-xs">
                <summary className="cursor-pointer font-bold text-[#008e98]">
                  Asignar nueva contraseña
                </summary>
                <form action={resetAdminPassword} className="mt-3 space-y-2">
                  <input type="hidden" name="id" value={a.user_id} />
                  <input
                    type="password"
                    name="password"
                    minLength={12}
                    required
                    autoComplete="new-password"
                    placeholder="Nueva contraseña (mínimo 12 caracteres)"
                    className={adminInputClass}
                  />
                  <input
                    type="password"
                    name="confirm"
                    minLength={12}
                    required
                    autoComplete="new-password"
                    placeholder="Repite la contraseña"
                    className={adminInputClass}
                  />
                  <button type="submit" className={`${adminButtonClass} text-xs py-2`}>
                    Actualizar contraseña
                  </button>
                </form>
              </details>
            </div>
          ))}
        </div>
      </section>

      {/* Create Admin Dialog */}
      {params.dialog === "create" && (
        <AdminDialog closeHref="/admin/equipo" title="Agregar administrador">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#009aa3]">
                Equipo Radical
              </p>
              <h2 className="mt-2 text-2xl font-black">
                Agregar administrador
              </h2>
            </div>
            <Link
              href="/admin/equipo"
              className="text-sm font-bold text-slate-500 hover:text-slate-800"
            >
              Cerrar ×
            </Link>
          </div>

          <p className="text-sm leading-6 text-slate-500">
            Crea una cuenta nueva con contraseña inicial o concede acceso a una
            cuenta existente de Google.
          </p>

          <form action={createAdmin} className="mt-5 space-y-3">
            <label className="block text-sm font-bold text-slate-700">
              Correo electrónico
              <input
                type="email"
                name="email"
                required
                placeholder="correo@ejemplo.com"
                className={`${adminInputClass} mt-1`}
              />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Contraseña inicial
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
            <button type="submit" className={`${adminButtonClass} w-full`}>
              Crear administrador
            </button>
          </form>

          <details className="mt-6 border-t border-slate-200 pt-4 text-sm">
            <summary className="cursor-pointer font-bold text-[#008e98]">
              O dar acceso a una cuenta existente
            </summary>
            <form action={grantExistingAdmin} className="mt-3 flex flex-wrap gap-2">
              <input
                type="email"
                name="email"
                required
                placeholder="Correo ya registrado"
                className={`${adminInputClass} min-w-[200px] flex-1`}
              />
              <button type="submit" className={adminButtonClass}>
                Dar acceso
              </button>
            </form>
          </details>
        </AdminDialog>
      )}
    </div>
  );
}
