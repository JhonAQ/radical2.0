import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { setPassword } from "../actions";

export const metadata = {
  title: "Crear contraseña | Radical 2.0",
  robots: { index: false, follow: false },
};

export default async function ResetPage() {
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
  return (
    <main className="grid min-h-screen place-items-center bg-[#f8f5e9] px-5 py-12 text-[#082e39]">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <p className="text-xs font-black uppercase tracking-widest text-[#009ca5]">
          Radical 2.0 · Equipo
        </p>
        <h1 className="mt-3 text-3xl font-black">Crear contraseña</h1>
        {membership ? (
          <>
            <p className="mt-3 text-sm text-slate-600">
              Elige una contraseña de al menos 12 caracteres para {user?.email}.
            </p>
            <form action={setPassword} className="mt-6 space-y-4">
              <input
                aria-label="Nueva contraseña"
                name="password"
                type="password"
                minLength={12}
                required
                autoComplete="new-password"
                placeholder="Nueva contraseña"
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
              <input
                aria-label="Repite la contraseña"
                name="confirm"
                type="password"
                minLength={12}
                required
                autoComplete="new-password"
                placeholder="Repite la contraseña"
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
              <button className="w-full rounded-xl bg-[#ffbc1f] px-5 py-3 font-bold">
                Guardar contraseña
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="mt-4 text-sm text-slate-600">
              El enlace ya no es válido o esta cuenta no tiene acceso al panel.
              Solicita otro enlace de recuperación.
            </p>
            <Link
              className="mt-5 inline-block font-bold text-[#008e98]"
              href="/admin"
            >
              Volver al acceso
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
