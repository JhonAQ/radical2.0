import { cookies } from "next/headers";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { ChevronRight, Search } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { serviceClient } from "@/utils/supabase/service";
import { adminInputClass } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";

export const metadata = { title: "Cuentas | Radical 2.0" };

type View = "todos" | "sin" | "con";

type Row = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  provider: string;
  createdAt: string;
  lastSignInAt: string | null;
  role: string | null;
  registration: { id: string; status: string } | null;
};

const dateFmt = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "numeric", month: "short", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

const fold = (s: string) => s.toLocaleLowerCase("es").normalize("NFD").replace(/\p{M}/gu, "");

/** Todas las cuentas de Auth (la API pagina de a 1000 como máximo). */
async function listAllUsers(admin: NonNullable<ReturnType<typeof serviceClient>>) {
  const users: User[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return users;
}

function meta(u: User, key: string) {
  const v = u.user_metadata?.[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function RegistrationChip({ row }: { row: Row }) {
  if (!row.registration) return <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Sin inscripción</span>;
  return <StatusBadge status={row.registration.status} />;
}

function Tags({ row }: { row: Row }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <RegistrationChip row={row} />
      {row.role && (
        <span className="rounded-md bg-[#e3f1f4] px-2 py-0.5 text-[11px] font-semibold text-[#0a5562]">
          {row.role === "master" ? "Maestra" : "Admin"}
        </span>
      )}
    </div>
  );
}

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string; q?: string }>;
}) {
  const params = await searchParams;
  const view: View = params.ver === "sin" || params.ver === "con" ? params.ver : "todos";
  const q = (params.q ?? "").trim();

  // El layout ya protege el panel, pero esta página usa la clave secreta: se vuelve a verificar.
  const client = createClient(await cookies());
  const {
    data: { user },
  } = await client.auth.getUser();
  const { data: membership } = user
    ? await client.from("admin_users").select("role").eq("user_id", user.id).maybeSingle()
    : { data: null };
  if (!user || !membership) return null;

  const admin = serviceClient();
  if (!admin) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Falta configurar <code>SUPABASE_SECRET_KEY</code> en el servidor para listar usuarios.
      </p>
    );
  }

  const [users, { data: regs }, { data: admins }] = await Promise.all([
    listAllUsers(admin),
    admin.from("registrations").select("id, user_id, status"),
    admin.from("admin_users").select("user_id, role"),
  ]);
  const regByUser = new Map((regs ?? []).map((r) => [r.user_id, { id: r.id, status: r.status }]));
  const roleByUser = new Map((admins ?? []).map((a) => [a.user_id, a.role]));

  const all: Row[] = users
    .map((u) => ({
      id: u.id,
      email: u.email ?? "",
      name: meta(u, "full_name") ?? meta(u, "name") ?? "",
      avatar: meta(u, "avatar_url") ?? meta(u, "picture"),
      provider: u.app_metadata?.provider === "google" ? "Google" : u.app_metadata?.provider === "email" ? "Correo" : (u.app_metadata?.provider ?? "—"),
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
      role: roleByUser.get(u.id) ?? null,
      registration: regByUser.get(u.id) ?? null,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Campistas = cuentas que no son del equipo (o que, siéndolo, se inscribieron). Así Cuentas = Inscritos + Sin inscribir.
  const campers = all.filter((r) => !r.role || r.registration);
  const withReg = campers.filter((r) => r.registration);
  const withoutReg = campers.filter((r) => !r.registration);

  const base = view === "sin" ? withoutReg : view === "con" ? withReg : campers;
  const needle = fold(q);
  const rows = needle ? base.filter((r) => fold(`${r.name} ${r.email}`).includes(needle)) : base;

  const titles: Record<View, { title: string; description: string }> = {
    todos: { title: "Todas las cuentas", description: "Todas las cuentas que entraron a la página, se hayan inscrito o no. No incluye al equipo administrador." },
    con: { title: "Cuentas con inscripción", description: "Cuentas que ya enviaron el formulario de inscripción." },
    sin: {
      title: "Sin inscribir",
      description: "Entraron con su cuenta pero no enviaron el formulario. Útil para escribirles y ayudarles a terminar.",
    },
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0a3039] sm:text-3xl">{titles[view].title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#5f7a75]">{titles[view].description}</p>
      </div>

      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: "Cuentas", value: campers.length, hint: "Sin contar al equipo administrador" },
          { label: "Inscritos", value: withReg.length, hint: "Enviaron el formulario" },
          { label: "Sin inscribir", value: withoutReg.length, hint: "Entraron y no se inscribieron" },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-[#e2e8e4] bg-white p-3 shadow-sm sm:p-4">
            <p className="text-xs font-medium text-[#657d77]">{c.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-[#0a3039] sm:mt-2 sm:text-3xl">{c.value}</p>
            <p className="mt-1 hidden text-[11px] text-[#7d948f] sm:block">{c.hint}</p>
          </div>
        ))}
      </section>

      <div className="flex">
        <form className="flex w-full gap-2 sm:w-96" action="/admin/usuarios">
          <input type="hidden" name="ver" value={view} />
          <label className="sr-only" htmlFor="usuarios-q">Buscar</label>
          <input id="usuarios-q" name="q" defaultValue={q} placeholder="Nombre o correo" className={`${adminInputClass} py-2`} />
          <button type="submit" aria-label="Buscar" className="rounded-xl bg-[#e7f0ed] px-3 text-[#07333d] hover:bg-[#d7e8e3]">
            <Search size={16} aria-hidden />
          </button>
        </form>
      </div>

      <section className="overflow-hidden rounded-xl border border-[#e2e8e4] bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#edf1ee] bg-[#fafcfb] text-[11px] uppercase tracking-wider text-[#78918a]">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Usuario</th>
              <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Inscripción</th>
              <th className="hidden px-4 py-2.5 font-semibold md:table-cell">Cuenta creada</th>
              <th className="hidden px-4 py-2.5 font-semibold lg:table-cell">Último ingreso</th>
              <th className="w-8" aria-hidden />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf1ee]">
            {rows.map((r) => (
              <tr key={r.id} className={`relative transition ${r.registration ? "hover:bg-[#fafcfb]" : ""}`}>
                <td className="w-full max-w-0 px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    {r.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element -- avatar externo de Google, pequeño
                      <img src={r.avatar} alt="" width={32} height={32} referrerPolicy="no-referrer" className="size-8 shrink-0 rounded-full bg-[#e7f0ed] object-cover" />
                    ) : (
                      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e7f0ed] text-xs font-bold uppercase text-[#3d6863]">
                        {(r.name || r.email).charAt(0)}
                      </span>
                    )}
                    <div className="min-w-0">
                      {r.registration ? (
                        <Link href={`/admin/inscripciones/${r.registration.id}`} className="after:absolute after:inset-0">
                          <span className="block truncate font-semibold text-[#0a3039]">{r.name || r.email}</span>
                        </Link>
                      ) : (
                        <span className="block truncate font-semibold text-[#0a3039]">{r.name || r.email}</span>
                      )}
                      <span className="block truncate text-xs text-[#7d948f]">
                        {r.email}
                        <span className="ml-1.5 text-[#a3b6b1]">· {r.provider}</span>
                      </span>
                      <div className="mt-1.5 sm:hidden">
                        <Tags row={r} />
                      </div>
                    </div>
                  </div>
                </td>
                <td className="hidden whitespace-nowrap px-4 py-2.5 sm:table-cell">
                  <Tags row={r} />
                </td>
                <td className="hidden px-4 py-2.5 text-xs text-[#52716f] md:table-cell">{dateFmt.format(new Date(r.createdAt))}</td>
                <td className="hidden px-4 py-2.5 text-xs text-[#52716f] lg:table-cell">
                  {r.lastSignInAt ? timeFmt.format(new Date(r.lastSignInAt)) : "—"}
                </td>
                <td className="pr-3 text-[#9cb2ac]">{r.registration && <ChevronRight size={15} aria-hidden />}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="py-10 text-center text-sm text-[#829992]">{q ? "Nadie coincide con la búsqueda." : "No hay usuarios en esta lista."}</p>
        )}
      </section>
    </div>
  );
}
