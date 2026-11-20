import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import {
  adminInputClass,
  adminButtonClass,
  type AdminUser,
} from "../../types";
import {
  createAdmin,
  removeAdmin,
  grantExistingAdmin,
  resetAdminPassword,
} from "../../actions";
import { ChevronDown, KeyRound, Shield, Trash2, UserPlus } from "lucide-react";
import { FlashMessage } from "../../components/FlashMessage";
import { PendingFieldset } from "../../components/PendingFieldset";
import { PageHeader } from "../../components/PageHeader";
import { ConfirmSubmitButton } from "../../components/ConfirmSubmitButton";

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

  const card = "rounded-2xl border border-[#e2e8e4] bg-white";
  const summaryRow =
    "flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-semibold text-[#0a524a] [&::-webkit-details-marker]:hidden";

  return (
    <div className="max-w-3xl space-y-4 lg:space-y-6">
      <PageHeader title="Equipo" description="Quién tiene acceso al panel y con qué permisos." />

      <FlashMessage error={params.error} success={params.success} />

      <section aria-labelledby="miembros" className={card}>
        <div className="px-4 pt-4 sm:px-5">
          <h2 id="miembros" className="text-base font-bold text-[#0a3039]">
            {admins.length === 1 ? "1 persona con acceso" : `${admins.length} personas con acceso`}
          </h2>
          <p className="mt-0.5 text-sm text-[#5f7a75]">La cuenta maestra puede agregar y quitar administradores.</p>
        </div>
        <ul className="mt-2 divide-y divide-[#eef2ef] border-t border-[#eef2ef]">
          {admins.map((a) => (
            <li key={a.user_id} className="px-4 py-3 sm:px-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eaf3f0] text-sm font-black text-[#0a524a]">
                  {(a.email || "?")[0].toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#0a3039]">{a.email}</p>
                  <p className="flex items-center gap-1 text-xs text-[#5f7a75]">
                    <Shield size={12} className={a.role === "master" ? "text-amber-600" : "text-[#008e98]"} aria-hidden />
                    {a.role === "master" ? "Cuenta maestra" : "Administrador"}
                  </p>
                </div>
              </div>
              <div className="mt-1 flex flex-wrap items-start justify-between gap-x-4">
                <details className="group min-w-0 flex-1">
                  <summary className={summaryRow}>
                    <KeyRound size={15} aria-hidden />
                    Asignar nueva contraseña
                    <ChevronDown size={15} className="transition group-open:rotate-180" aria-hidden />
                  </summary>
                  <form action={resetAdminPassword} className="grid max-w-sm gap-2 pb-2">
                    <PendingFieldset className="contents">
                      <input type="hidden" name="id" value={a.user_id} />
                      <input
                        type="password"
                        name="password"
                        minLength={6}
                        required
                        autoComplete="new-password"
                        placeholder="Nueva contraseña (mínimo 6 caracteres)"
                        aria-label="Nueva contraseña"
                        className={adminInputClass}
                      />
                      <input
                        type="password"
                        name="confirm"
                        minLength={6}
                        required
                        autoComplete="new-password"
                        placeholder="Repite la contraseña"
                        aria-label="Repite la contraseña"
                        className={adminInputClass}
                      />
                      <button type="submit" className={`${adminButtonClass} min-h-11`}>
                        Actualizar contraseña
                      </button>
                    </PendingFieldset>
                  </form>
                </details>
                {a.role === "admin" && (
                  <form action={removeAdmin}>
                    <input type="hidden" name="id" value={a.user_id} />
                    <ConfirmSubmitButton
                      message={`¿Quitarle el acceso al panel a ${a.email}? Su cuenta sigue existiendo.`}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                    >
                      <Trash2 size={15} aria-hidden />
                      Quitar acceso
                    </ConfirmSubmitButton>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="agregar" className={`${card} p-4 sm:p-5`}>
        <h2 id="agregar" className="flex items-center gap-2 text-base font-bold text-[#0a3039]">
          <UserPlus size={18} className="text-[#0a524a]" aria-hidden />
          Agregar administrador
        </h2>
        <p className="mt-0.5 text-sm text-[#5f7a75]">Crea una cuenta con contraseña inicial. Comparte la contraseña por un canal seguro.</p>
        <form action={createAdmin} className="mt-4 grid max-w-md gap-3">
          <PendingFieldset className="contents">
            <label className="block text-sm font-semibold text-[#2c4a47]">
              Correo electrónico
              <input type="email" name="email" required placeholder="correo@ejemplo.com" autoComplete="off" className={`${adminInputClass} mt-1`} />
            </label>
            <label className="block text-sm font-semibold text-[#2c4a47]">
              Contraseña inicial
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
            <button type="submit" className={`${adminButtonClass} min-h-12 w-full sm:w-auto`}>
              Crear administrador
            </button>
          </PendingFieldset>
        </form>

        <details className="group mt-4 border-t border-[#eef2ef] pt-1">
          <summary className={summaryRow}>
            O dar acceso a una cuenta que ya existe
            <ChevronDown size={15} className="transition group-open:rotate-180" aria-hidden />
          </summary>
          <p className="text-sm text-[#5f7a75]">Por ejemplo, alguien que ya entró con Google. Debe tener el correo verificado.</p>
          <form action={grantExistingAdmin} className="mt-3 grid max-w-md gap-2 sm:flex">
            <PendingFieldset className="contents">
              <input type="email" name="email" required placeholder="Correo ya registrado" aria-label="Correo ya registrado" className={`${adminInputClass} sm:flex-1`} />
              <button type="submit" className={`${adminButtonClass} min-h-12`}>
                Dar acceso
              </button>
            </PendingFieldset>
          </form>
        </details>
      </section>
    </div>
  );
}
