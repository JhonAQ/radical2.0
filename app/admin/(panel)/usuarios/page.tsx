import { cookies } from "next/headers";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { ChevronRight, Mail, Search, Trash2, X } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { serviceClient } from "@/utils/supabase/service";
import { StatusBadge } from "../../components/StatusBadge";
import { FlashMessage } from "../../components/FlashMessage";
import { PageHeader } from "../../components/PageHeader";
import { ConfirmSubmitButton } from "../../components/ConfirmSubmitButton";
import { deleteAccount } from "../../actions";

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
  searchParams: Promise<{ ver?: string; q?: string; error?: string; success?: string }>;
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
  const isMaster = membership.role === "master";
  const returnTo = `/admin/usuarios?${new URLSearchParams({ ...(view !== "todos" ? { ver: view } : {}), ...(q ? { q } : {}) }).toString()}`;

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
    <div className="space-y-4">
      <PageHeader
        title={titles[view].title}
        description={titles[view].description}
        mobileDescription={view === "sin" ? titles.sin.description : undefined}
      />
      <FlashMessage error={params.error} success={params.success} />

      <form className="relative" action="/admin/usuarios" role="search">
        <input type="hidden" name="ver" value={view} />
        <label className="sr-only" htmlFor="usuarios-q">
          Buscar por nombre o correo
        </label>
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7d948f]" aria-hidden />
        <input
          id="usuarios-q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Buscar por nombre o correo"
          autoComplete="off"
          enterKeyHint="search"
          className="min-h-12 w-full rounded-xl border border-[#cfdcd7] bg-white pl-11 pr-11 text-base text-[#082e39] outline-none placeholder:text-[#7d948f] focus:border-[#00a7ad] focus:ring-2 focus:ring-[#00a7ad]/20 sm:max-w-md sm:text-sm"
        />
        {q && (
          <Link
            href={`/admin/usuarios${view === "todos" ? "" : `?ver=${view}`}`}
            aria-label="Borrar búsqueda"
            className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-[#5f7a75] hover:bg-[#eef3f1] sm:left-[calc(28rem-2.75rem)] sm:right-auto"
          >
            <X size={17} aria-hidden />
          </Link>
        )}
      </form>

      <p className="text-xs text-[#5f7a75]">
        {rows.length === 1 ? "1 cuenta" : `${rows.length} cuentas`}
        {view === "todos" && ` · ${withReg.length} inscritas, ${withoutReg.length} sin inscribir`} · no incluye al equipo administrador
      </p>

      <section className="-mx-4 overflow-hidden border-y border-[#e2e8e4] bg-white sm:mx-0 sm:rounded-2xl sm:border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#edf1ee] bg-[#fafcfb] text-[11px] uppercase tracking-wider text-[#78918a] max-sm:hidden">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Usuario</th>
              <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Inscripción</th>
              <th className="hidden px-4 py-2.5 font-semibold md:table-cell">Cuenta creada</th>
              <th className="hidden px-4 py-2.5 font-semibold lg:table-cell">Último ingreso</th>
              <th className="w-10"><span className="sr-only">Acciones</span></th>
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
                <td className="px-1 py-2.5">
                    {!r.registration && r.email && (
                      <a
                        href={`mailto:${r.email}?subject=${encodeURIComponent("Tu inscripción a Radical 2.0")}`}
                        aria-label={`Escribir a ${r.email}`}
                        className="relative z-10 mb-1 grid size-10 place-items-center rounded-lg text-[#5f7a75] hover:bg-[#eef3f1] hover:text-[#0a3039]"
                      >
                        <Mail size={16} aria-hidden />
                      </a>
                    )}
                    {isMaster && !r.role && r.id !== user.id && (
                      <form action={deleteAccount} className="relative z-10">
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="return_to" value={returnTo} />
                        <ConfirmSubmitButton
                          ariaLabel={`Eliminar la cuenta de ${r.name || r.email}`}
                          message={
                            r.registration
                              ? `¿Eliminar la cuenta ${r.email}? También se borra su inscripción con sus abonos e historial. No se puede deshacer.`
                              : `¿Eliminar la cuenta ${r.email}? No se puede deshacer.`
                          }
                          className="grid size-10 place-items-center rounded-lg text-[#9cb2ac] hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 size={15} aria-hidden />
                        </ConfirmSubmitButton>
                      </form>
                    )}
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
