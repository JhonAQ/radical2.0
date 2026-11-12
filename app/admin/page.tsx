import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { BrandLogo } from "@/components/common/BrandLogo";
import { AdminDialog } from "./AdminDialog";
import {
  LayoutDashboard,
  UsersRound,
  WalletCards,
  ShieldCheck,
  Settings,
  ArrowUpRight,
  ClipboardCheck,
  LogOut,
  ChevronRight,
  Clock3,
  CircleDollarSign,
} from "lucide-react";
import {
  login,
  logout,
  requestPasswordReset,
  review,
  reviewPayment,
  setPassword,
  createAdmin,
  removeAdmin,
  grantExistingAdmin,
  resetAdminPassword,
} from "./actions";

export const metadata = {
  title: "Administración | Radical 2.0",
  robots: { index: false, follow: false },
};
type Registration = {
  id: string;
  user_id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  document: string;
  birth_date: string;
  gender: string;
  phone: string;
  email: string;
  emergency_name: string;
  emergency_relation: string;
  emergency_phone: string;
  plan: string;
  price: number;
  amount: number;
  payment_type: string;
  status: string;
  receipt_path: string;
  original_receipt_path: string | null;
  review_note: string | null;
};
const labels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Observado",
};
const errors: Record<string, string> = {
  login: "Correo o contraseña incorrectos.",
  reset: "Ingresa un correo válido.",
  reset_link:
    "El enlace de recuperación venció o ya fue utilizado. Solicita otro.",
  reset_service: "No se pudo enviar el enlace. Inténtalo más tarde.",
  reset_domain:
    "Solicita el enlace desde radical2-0.vercel.app para abrirlo en el mismo navegador.",
  access: "Esta cuenta no tiene acceso al panel.",
  review:
    "No se pudo actualizar la revisión. Revisa primero los abonos adicionales aprobados.",
  password: "Las contraseñas deben coincidir y tener al menos 12 caracteres.",
  admin_unverified:
    "La cuenta debe confirmar su correo antes de recibir acceso.",
  admin_not_found: "No encontramos una cuenta con ese correo.",
  admin_input:
    "Ingresa un correo válido y una contraseña de al menos 12 caracteres.",
  admin_create:
    "No se pudo crear el administrador. Comprueba que el correo no esté registrado.",
  configuration:
    "Falta configurar la clave de servidor de Supabase para gestionar administradores.",
  note: "Escribe una nota para explicar la observación al participante.",
  payment_review:
    "No se pudo actualizar el abono. Comprueba que no supere el saldo pendiente y que la inscripción esté aprobada.",
};
const successes: Record<string, string> = {
  reset_sent:
    "Si el correo tiene una cuenta, recibirá un enlace. Ábrelo en este mismo navegador para crear o restablecer tu contraseña.",
  review: "Revisión actualizada.",
  password: "Contraseña actualizada.",
  admin_existing: "Se concedió acceso a la cuenta existente.",
  admin_password: "Contraseña de la cuenta administradora actualizada.",
  admin: "Administrador creado. Comparte sus credenciales por un canal seguro.",
  removed: "Acceso de administrador retirado.",
};
const input =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#082e39] outline-none focus:border-[#00a7ad] focus:ring-2 focus:ring-[#00a7ad]/20";
const button =
  "inline-flex items-center justify-center rounded-xl bg-[#ffbc1f] px-5 py-3 text-sm font-bold text-[#082e39] transition hover:bg-[#ffca44]";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    selected?: string;
    view?: string;
    dialog?: string;
    status?: string;
    q?: string;
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
  const authorized = Boolean(user && membership);
  if (!authorized)
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f8f5e9] px-5 py-12 text-[#082e39]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,#bfe5df,transparent_40%),radial-gradient(circle_at_bottom_right,#ffe4a4,transparent_40%)]"
        />
        <div className="relative w-full max-w-md">
          <Link href="/" aria-label="Volver al inicio de Radical 2.0">
            <Image
              src="/assets/registration/corner-yellow-brush.webp"
              alt=""
              width={180}
              height={80}
              className="absolute -left-10 -top-16 w-56 opacity-60"
            />
          </Link>
          <section className="relative rounded-3xl border border-white bg-white/90 p-8 shadow-xl sm:p-10">
            <Link href="/" aria-label="Radical 2.0, inicio">
              <BrandLogo variant="secundario" width={130} />
            </Link>
            <p className="mb-3 mt-5 text-xs font-black uppercase tracking-[.2em] text-[#009ca5]">
              Radical 2.0 · Equipo
            </p>
            <h1 className="text-3xl font-black">Bienvenido al panel</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Ingresa con tu cuenta de administrador para gestionar las
              inscripciones.
            </p>
            {params.error && (
              <p
                role="alert"
                className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-800"
              >
                {errors[params.error] || "No pudimos completar la operación."}
              </p>
            )}
            {params.success && (
              <p
                role="status"
                className="mt-5 rounded-xl bg-teal-50 p-3 text-sm text-teal-900"
              >
                {successes[params.success]}
              </p>
            )}
            {user && (
              <p className="mt-4 text-sm text-slate-600">
                La sesión actual no tiene permisos de administrador.
              </p>
            )}
            <form action={login} className="mt-7 space-y-4">
              <label className="block text-sm font-bold">
                Correo
                <input
                  className={`${input} mt-2`}
                  type="email"
                  name="email"
                  required
                  autoComplete="username"
                />
              </label>
              <label className="block text-sm font-bold">
                Contraseña
                <input
                  className={`${input} mt-2`}
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                />
              </label>
              <button className={`${button} w-full`} type="submit">
                Entrar al panel →
              </button>
            </form>
            <details className="mt-5 text-sm">
              <summary className="cursor-pointer font-semibold text-[#008e98]">
                Crear o recuperar contraseña
              </summary>
              <form action={requestPasswordReset} className="mt-3 space-y-3">
                <label className="block font-semibold">
                  Correo de administrador
                  <input
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    className={`${input} mt-2`}
                  />
                </label>
                <button className="w-full rounded-xl border border-[#008e98] px-4 py-3 font-bold text-[#008e98]">
                  Enviar enlace de recuperación
                </button>
              </form>
            </details>
            <Link
              href="/login?next=admin"
              className="mt-5 block text-center text-sm font-semibold text-[#008e98]"
            >
              Activar acceso de la cuenta maestra con Google
            </Link>
            <Link
              href="/"
              className="mt-4 block text-center text-sm font-semibold text-slate-500"
            >
              ← Volver a Radical
            </Link>
          </section>
        </div>
      </main>
    );

  const rows: Registration[] = [];
  const payments: {
    id: string;
    registration_id: string;
    amount: number;
    status: string;
    kind: string;
    receipt_path: string;
    review_note: string | null;
    created_at: string;
  }[] = [];
  let loadError = false;
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id")
      .range(offset, offset + 999);
    if (error) {
      loadError = true;
      break;
    }
    rows.push(...(data as Registration[]));
    if (data.length < 1000) break;
  }
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client
      .from("registration_payments")
      .select(
        "id,registration_id,amount,status,kind,receipt_path,review_note,created_at",
      )
      .order("created_at", { ascending: false })
      .order("id")
      .range(offset, offset + 999);
    if (error) {
      loadError = true;
      break;
    }
    payments.push(...data);
    if (data.length < 1000) break;
  }
  const filtered = rows.filter(
    (r) =>
      (!params.status ||
        params.status === "all" ||
        r.status === params.status) &&
      (!params.q ||
        `${r.first_name} ${r.last_name} ${r.email} ${r.document}`
          .toLowerCase()
          .includes(params.q.toLowerCase())),
  );
  const selected = rows.find((r) => r.id === params.selected);
  const { data: receipt } = selected
    ? await client.storage
        .from("registration-receipts")
        .createSignedUrl(selected.receipt_path, 300)
    : { data: null };
  const { data: history } = selected
    ? await client
        .from("registration_review_events")
        .select("id,payment_id,created_at,old_status,new_status,note")
        .eq("registration_id", selected.id)
        .order("created_at", { ascending: false })
        .limit(30)
    : { data: [] };
  const { data: originalReceipt } =
    selected?.original_receipt_path &&
    selected.original_receipt_path !== selected.receipt_path
      ? await client.storage
          .from("registration-receipts")
          .createSignedUrl(selected.original_receipt_path, 300)
      : { data: null };
  const selectedPayments = await Promise.all(
    payments
      .filter((p) => p.registration_id === selected?.id)
      .map(async (p) => {
        const { data: url } = await client.storage
          .from("registration-receipts")
          .createSignedUrl(p.receipt_path, 300);
        return { ...p, signedUrl: url?.signedUrl };
      }),
  );
  const selectedPaid = selected
    ? selected.amount +
      payments
        .filter(
          (p) =>
            p.registration_id === selected.id &&
            p.kind === "additional" &&
            p.status === "approved",
        )
        .reduce((n, p) => n + p.amount, 0)
    : 0;
  const master = membership?.role === "master";
  const secret =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  let admins: { user_id: string; role: string; email: string }[] = [];
  if (
    master &&
    params.view === "team" &&
    secret &&
    process.env.NEXT_PUBLIC_SUPABASE_URL
  ) {
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
  const requestedView = params.view || "overview";
  const view =
    ["overview", "registrations", "payments", "team", "account"].includes(
      requestedView,
    ) &&
    (requestedView !== "team" || master)
      ? requestedView
      : "overview";
  const returnParams = new URLSearchParams({ view });
  if (params.q) returnParams.set("q", params.q);
  if (params.status) returnParams.set("status", params.status);
  const closeHref = `/admin?${returnParams.toString()}`;
  const detailHref = (id: string) =>
    `${closeHref}&selected=${encodeURIComponent(id)}`;
  const pendingRegistrations = rows.filter((r) => r.status === "pending");
  const pendingPayments = payments.filter((p) => p.status === "pending");
  const approvedTotal =
    rows
      .filter((r) => r.status === "approved")
      .reduce((n, r) => n + r.amount, 0) +
    payments
      .filter((p) => p.status === "approved" && p.kind === "additional")
      .reduce((n, p) => n + p.amount, 0);
  const nav = [
    { id: "overview", label: "Resumen", icon: LayoutDashboard },
    {
      id: "registrations",
      label: "Inscripciones",
      icon: UsersRound,
      badge: pendingRegistrations.length,
    },
    {
      id: "payments",
      label: "Pagos y comprobantes",
      icon: WalletCards,
      badge: pendingRegistrations.length + pendingPayments.length,
    },
    ...(master ? [{ id: "team", label: "Equipo", icon: ShieldCheck }] : []),
    { id: "account", label: "Mi cuenta", icon: Settings },
  ];
  const viewInfo: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: "Resumen general",
      subtitle: "Todo lo que sucede en tu campamento, en un solo lugar.",
    },
    registrations: {
      title: "Inscripciones",
      subtitle:
        "Consulta participantes, datos de contacto y estado de inscripción.",
    },
    payments: {
      title: "Pagos y comprobantes",
      subtitle: "Revisa los pagos recibidos y lleva el control de cada abono.",
    },
    team: {
      title: "Equipo administrador",
      subtitle: "Gestiona los accesos de las personas que trabajan contigo.",
    },
    account: {
      title: "Mi cuenta",
      subtitle: "Administra tus credenciales de acceso.",
    },
  };
  const paymentItems = [
    ...rows.map((r) => ({
      id: `initial-${r.id}`,
      registrationId: r.id,
      name: `${r.first_name} ${r.last_name}`,
      email: r.email,
      amount: r.amount,
      status: r.status,
      kind: "Abono inicial",
      date: r.created_at,
    })),
    ...payments
      .filter((p) => !(p.kind === "replacement" && p.status === "approved"))
      .map((p) => {
        const r = rows.find((item) => item.id === p.registration_id);
        return {
          id: p.id,
          registrationId: p.registration_id,
          name: r ? `${r.first_name} ${r.last_name}` : "Participante",
          email: r?.email || "",
          amount: p.amount,
          status: p.status,
          kind:
            p.kind === "replacement"
              ? "Comprobante corregido"
              : "Abono adicional",
          date: p.created_at,
        };
      }),
  ]
    .filter(
      (p) =>
        (!params.status ||
          params.status === "all" ||
          p.status === params.status) &&
        (!params.q ||
          `${p.name} ${p.email}`
            .toLowerCase()
            .includes(params.q.toLowerCase())),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <main className="min-h-screen bg-[#f4f6f2] text-[#10343d] lg:pl-[260px]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col bg-[#082f39] text-white lg:flex">
        <div className="relative overflow-hidden px-7 pb-8 pt-7">
          <div className="absolute -right-14 -top-20 h-44 w-44 rounded-full bg-[#06b5b0]/10 blur-3xl" />
          <Link href="/" aria-label="Radical 2.0, inicio">
            <BrandLogo variant="secundario" width={155} />
          </Link>
          <p className="mt-5 text-[10px] font-black uppercase tracking-[.22em] text-[#88c4c0]">
            Centro de operaciones
          </p>
        </div>
        <div className="px-5 text-[10px] font-bold uppercase tracking-[.2em] text-[#78a5a5]">
          Campamento
        </div>
        <nav
          aria-label="Navegación administrativa"
          className="mt-3 flex-1 space-y-1 px-3"
        >
          {nav.map(({ id, label, icon: Icon, badge }) => (
            <Link
              key={id}
              href={`/admin?view=${id}`}
              aria-current={view === id ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${view === id ? "bg-[#e9faf5] text-[#073b43] shadow-sm" : "text-[#bed7d3] hover:bg-white/10 hover:text-white"}`}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span className="flex-1">{label}</span>
              {Boolean(badge) && (
                <span
                  className={`rounded-md px-2 py-0.5 text-xs ${view === id ? "bg-[#c6ece3]" : "bg-[#18535a] text-[#b9ece4]"}`}
                >
                  {badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="m-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#ffbf24] text-sm font-black text-[#07333d]">
              {(user?.email || "R")[0].toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold">{user?.email}</p>
              <p className="mt-1 text-[11px] text-[#a0c9c4]">
                {master ? "Cuenta maestra" : "Administrador"}
              </p>
            </div>
          </div>
          <form action={logout} className="mt-4">
            <button className="flex items-center gap-2 text-xs font-semibold text-[#bad4cf] hover:text-white">
              <LogOut size={14} /> Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
      <header className="sticky top-0 z-20 border-b border-[#e3eae5] bg-[#fbfcf8]/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-3">
          <Link href="/" aria-label="Radical 2.0, inicio">
            <BrandLogo variant="secundario" width={115} />
          </Link>
          <form action={logout}>
            <button className="rounded-lg bg-[#e7f0ed] px-3 py-2 text-xs font-bold">
              Salir
            </button>
          </form>
        </div>
        <nav
          aria-label="Navegación administrativa"
          className="flex gap-1 overflow-x-auto px-3 pb-2"
        >
          {nav.map(({ id, label, icon: Icon, badge }) => (
            <Link
              key={id}
              href={`/admin?view=${id}`}
              aria-current={view === id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${view === id ? "bg-[#0b4248] text-white" : "text-[#52716f]"}`}
            >
              <Icon size={16} />
              {label}
              {Boolean(badge) && (
                <span className="rounded-full bg-[#ffc32b] px-1.5 text-[#10343d]">
                  {badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </header>
      <div className="mx-auto max-w-[1540px] px-4 pb-12 pt-7 sm:px-8 lg:px-10 lg:pt-9">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[.2em] text-[#009d9f]">
              Radical 2.0 <span className="mx-1 text-[#a6bab5]">/</span>{" "}
              Administración
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0a3039] sm:text-4xl">
              {viewInfo[view].title}
            </h1>
            <p className="mt-2 text-sm text-[#69827e]">
              {viewInfo[view].subtitle}
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[#dfe9e2] bg-white px-4 py-2 text-xs font-semibold text-[#55736e] sm:flex">
            <span className="size-2 rounded-full bg-[#14b8a6]" /> Campamento ·
            Mejía
          </div>
        </div>
        {(params.error || params.success || loadError) && (
          <div
            role="status"
            className={`mb-6 rounded-xl px-5 py-4 text-sm font-semibold ${params.error || loadError ? "bg-red-100 text-red-800" : "bg-teal-100 text-teal-900"}`}
          >
            {loadError
              ? "No se pudieron cargar todos los registros. Vuelve a intentarlo."
              : params.error
                ? errors[params.error] || "Ocurrió un error."
                : successes[params.success || ""]}
          </div>
        )}
        {view === "overview" && (
          <div className="space-y-6">
            <section className="relative overflow-hidden rounded-[24px] bg-[#0a4249] px-6 py-7 text-white sm:px-8">
              <div
                aria-hidden
                className="absolute -right-16 -top-36 h-72 w-72 rounded-full bg-[#06b9b2]/25 blur-3xl"
              />
              <div className="relative flex flex-wrap items-center justify-between gap-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#83e3d4]">
                    Panel de control
                  </p>
                  <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                    Bienvenido a Radical
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-[#c0ddda]">
                    Mantén las inscripciones y los pagos al día para preparar
                    una gran experiencia.
                  </p>
                </div>
                <Link
                  href="/admin?view=registrations"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#ffc32b] px-5 py-3 text-sm font-black text-[#07333d]"
                >
                  Ver inscripciones <ArrowUpRight size={17} />
                </Link>
              </div>
            </section>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                {
                  label: "Inscripciones",
                  value: rows.length,
                  icon: UsersRound,
                  tone: "bg-[#e2f5ef] text-[#008e86]",
                },
                {
                  label: "Inscripciones pendientes",
                  value: pendingRegistrations.length,
                  icon: ClipboardCheck,
                  tone: "bg-[#fff1ce] text-[#b97c00]",
                },
                {
                  label: "Abonos por revisar",
                  value: pendingRegistrations.length + pendingPayments.length,
                  icon: Clock3,
                  tone: "bg-[#ffecdf] text-[#db6e27]",
                },
                {
                  label: "Abonado aprobado",
                  value: `S/ ${approvedTotal}`,
                  icon: CircleDollarSign,
                  tone: "bg-[#e5f2f6] text-[#167d94]",
                },
              ].map(({ label, value, icon: Icon, tone }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-[#e3ebe5] bg-white p-5 shadow-[0_8px_30px_rgba(13,55,58,.035)]"
                >
                  <div
                    className={`grid size-10 place-items-center rounded-xl ${tone}`}
                  >
                    <Icon size={20} />
                  </div>
                  <p className="mt-4 text-2xl font-black sm:text-3xl">
                    {value}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#728a84]">
                    {label}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
              <section className="rounded-2xl border border-[#e3ebe5] bg-white p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black">
                      Inscripciones recientes
                    </h2>
                    <p className="mt-1 text-xs text-[#78918a]">
                      Las últimas personas registradas
                    </p>
                  </div>
                  <Link
                    href="/admin?view=registrations"
                    className="text-xs font-bold text-[#008e95]"
                  >
                    Ver todas →
                  </Link>
                </div>
                <div className="mt-5 divide-y divide-[#edf1ee]">
                  {rows.slice(0, 5).map((r) => (
                    <Link
                      key={r.id}
                      href={`/admin?view=overview&selected=${r.id}`}
                      className="flex items-center gap-3 py-3 hover:text-[#008e95]"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e6f5ef] text-sm font-black text-[#008e86]">
                        {r.first_name[0]?.toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block truncate text-sm">
                          {r.first_name} {r.last_name}
                        </b>
                        <span className="block truncate text-xs text-[#8a9f99]">
                          {r.email}
                        </span>
                      </span>
                      <span className="text-xs font-bold text-[#66837a]">
                        {labels[r.status]}
                      </span>
                      <ChevronRight size={16} />
                    </Link>
                  ))}
                  {!rows.length && (
                    <p className="py-10 text-center text-sm text-[#829992]">
                      Todavía no hay inscripciones registradas.
                    </p>
                  )}
                </div>
              </section>
              <section className="rounded-2xl border border-[#e3ebe5] bg-white p-6">
                <h2 className="text-lg font-black">Pendientes del equipo</h2>
                <p className="mt-1 text-xs text-[#78918a]">
                  Accesos rápidos para avanzar
                </p>
                <div className="mt-5 space-y-3">
                  <Link
                    href="/admin?view=registrations&status=pending"
                    className="flex items-center gap-3 rounded-xl bg-[#fff9e9] p-4"
                  >
                    <ClipboardCheck className="text-[#c48600]" size={20} />
                    <span className="flex-1 text-sm font-bold">
                      Inscripciones por revisar
                    </span>
                    <b>{pendingRegistrations.length}</b>
                    <ChevronRight size={16} />
                  </Link>
                  <Link
                    href="/admin?view=payments&status=pending"
                    className="flex items-center gap-3 rounded-xl bg-[#ecf8f5] p-4"
                  >
                    <WalletCards className="text-[#008e86]" size={20} />
                    <span className="flex-1 text-sm font-bold">
                      Abonos por revisar
                    </span>
                    <b>
                      {pendingRegistrations.length + pendingPayments.length}
                    </b>
                    <ChevronRight size={16} />
                  </Link>
                  <div className="rounded-xl border border-dashed border-[#dbe8df] p-4 text-xs leading-5 text-[#78918a]">
                    Los comprobantes se revisan individualmente y cada decisión
                    queda en el historial.
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
        {view === "registrations" && (
          <section className="rounded-2xl border border-[#e2e8e4] bg-white p-5 shadow-[0_8px_35px_rgba(13,55,58,0.04)] sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Participantes</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Revisa los datos y el comprobante de cada inscripción.
                </p>
              </div>
              <span className="rounded-full bg-[#e9f6f3] px-3 py-1 text-xs font-bold text-[#007f87]">
                {filtered.length} resultados
              </span>
            </div>
            <form className="mt-5 flex flex-wrap gap-2">
              <input type="hidden" name="view" value="registrations" />
              <input
                name="q"
                defaultValue={params.q}
                placeholder="Buscar por nombre, correo o documento"
                className={`${input} min-w-[200px] flex-1`}
              />
              <select
                name="status"
                defaultValue={params.status || "all"}
                className="rounded-xl border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="approved">Aprobados</option>
                <option value="rejected">Observados</option>
              </select>
              <button className={button}>Buscar</button>
            </form>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[570px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-3">Participante</th>
                    <th>Plan</th>
                    <th>Abonado</th>
                    <th>Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100">
                      <td className="py-4">
                        <b>
                          {r.first_name} {r.last_name}
                        </b>
                        <div className="text-xs text-slate-500">{r.email}</div>
                        {payments.some(
                          (p) =>
                            p.registration_id === r.id &&
                            p.status === "pending",
                        ) && (
                          <div className="mt-1 text-xs font-bold text-amber-700">
                            Comprobante adicional por revisar
                          </div>
                        )}
                      </td>
                      <td className="capitalize">{r.plan}</td>
                      <td>
                        S/{" "}
                        {r.amount +
                          payments
                            .filter(
                              (p) =>
                                p.registration_id === r.id &&
                                p.kind === "additional" &&
                                p.status === "approved",
                            )
                            .reduce((total, p) => total + p.amount, 0)}
                      </td>
                      <td>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${r.status === "approved" ? "bg-emerald-100 text-emerald-800" : r.status === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}
                        >
                          {labels[r.status]}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={detailHref(r.id)}
                          className="font-bold text-[#008b96] hover:underline"
                        >
                          Revisar →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className="py-10 text-center text-sm text-slate-500">
                  No hay inscripciones que coincidan con la búsqueda.
                </p>
              )}
            </div>
          </section>
        )}
        {view === "payments" && (
          <section className="rounded-2xl border border-[#e2e8e4] bg-white p-5 shadow-[0_8px_35px_rgba(13,55,58,.04)] sm:p-7">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">Movimientos</h2>
                <p className="mt-1 text-sm text-[#78918a]">
                  Abonos iniciales, adicionales y comprobantes corregidos.
                </p>
              </div>
              <span className="rounded-full bg-[#e9f6f3] px-3 py-1 text-xs font-bold text-[#007f87]">
                {paymentItems.length} resultados
              </span>
            </div>
            <form className="mt-5 flex flex-wrap gap-2">
              <input type="hidden" name="view" value="payments" />
              <input
                name="q"
                defaultValue={params.q}
                placeholder="Buscar participante o correo"
                className={`${input} min-w-[200px] flex-1`}
              />
              <select
                name="status"
                defaultValue={params.status || "all"}
                className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="approved">Aprobados</option>
                <option value="rejected">Observados</option>
              </select>
              <button className={button}>Buscar</button>
            </form>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-3">Participante</th>
                    <th>Movimiento</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {paymentItems.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100">
                      <td className="py-4">
                        <b>{p.name}</b>
                        <div className="text-xs text-slate-500">{p.email}</div>
                      </td>
                      <td>{p.kind}</td>
                      <td className="font-bold">S/ {p.amount}</td>
                      <td>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${p.status === "approved" ? "bg-emerald-100 text-emerald-800" : p.status === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}
                        >
                          {labels[p.status]}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`${detailHref(p.registrationId)}${p.id.startsWith("initial-") ? "" : `#payment-${p.id}`}`}
                          className="font-bold text-[#008b96]"
                        >
                          Revisar →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!paymentItems.length && (
                <p className="py-12 text-center text-sm text-slate-500">
                  No hay movimientos que coincidan con la búsqueda.
                </p>
              )}
            </div>
          </section>
        )}
        {view === "account" && (
          <div className="max-w-2xl">
            {" "}
            <section className="rounded-3xl border border-[#dce5df] bg-white p-6">
              <h2 className="text-xl font-black">Mi contraseña</h2>
              <p className="mt-2 text-sm text-slate-500">
                Crea o cambia tu contraseña para acceder con correo y
                contraseña.
              </p>
              <form action={setPassword} className="mt-4 space-y-3">
                <input
                  type="password"
                  name="password"
                  required
                  minLength={12}
                  autoComplete="new-password"
                  placeholder="Nueva contraseña (mínimo 12 caracteres)"
                  className={input}
                />
                <input
                  type="password"
                  name="confirm"
                  required
                  minLength={12}
                  autoComplete="new-password"
                  placeholder="Repite la contraseña"
                  className={input}
                />
                <button className={button}>Guardar contraseña</button>
              </form>
            </section>
          </div>
        )}
        {view === "team" && master && (
          <div className="max-w-3xl">
            {" "}
            <section className="rounded-3xl border border-[#dce5df] bg-white p-6">
              <h2 className="text-xl font-black">Equipo administrador</h2>
              <p className="mt-2 text-sm text-slate-500">
                Crea accesos para el equipo. La cuenta maestra administra los
                permisos.
              </p>
              <Link
                href="/admin?view=team&dialog=create"
                className={`${button} mt-5`}
              >
                + Agregar administrador
              </Link>
              <div className="mt-5 space-y-2">
                {admins.map((a) => (
                  <div
                    key={a.user_id}
                    className="rounded-xl bg-slate-50 px-3 py-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="break-all">
                        {a.email}{" "}
                        <small className="font-bold text-[#008e98]">
                          {a.role === "master" ? "· Maestra" : "· Admin"}
                        </small>
                      </span>
                      {a.role === "admin" && (
                        <form action={removeAdmin}>
                          <input type="hidden" name="id" value={a.user_id} />
                          <button className="font-bold text-red-700">
                            Quitar
                          </button>
                        </form>
                      )}
                    </div>
                    <details className="mt-2">
                      <summary className="cursor-pointer font-bold text-[#008e98]">
                        Asignar nueva contraseña
                      </summary>
                      <form
                        action={resetAdminPassword}
                        className="mt-3 space-y-2"
                      >
                        <input type="hidden" name="id" value={a.user_id} />
                        <input
                          type="password"
                          name="password"
                          minLength={12}
                          required
                          autoComplete="new-password"
                          placeholder="Nueva contraseña"
                          className={input}
                        />
                        <input
                          type="password"
                          name="confirm"
                          minLength={12}
                          required
                          autoComplete="new-password"
                          placeholder="Repite la contraseña"
                          className={input}
                        />
                        <button className={button}>
                          Actualizar contraseña
                        </button>
                      </form>
                    </details>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
        {view === "team" &&
          master &&
          params.dialog === "create" &&
          !selected && (
            <AdminDialog
              closeHref="/admin?view=team"
              title="Agregar administrador"
            >
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
                  href="/admin?view=team"
                  className="text-sm font-bold text-slate-500"
                >
                  Cerrar ×
                </Link>
              </div>
              <p className="text-sm leading-6 text-slate-500">
                Crea una cuenta nueva o concede acceso a una cuenta existente.
              </p>{" "}
              <form action={createAdmin} className="mt-4 space-y-3">
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Correo del administrador"
                  className={input}
                />
                <input
                  type="password"
                  name="password"
                  required
                  minLength={12}
                  autoComplete="new-password"
                  placeholder="Contraseña inicial (mínimo 12 caracteres)"
                  className={input}
                />
                <button className={button}>Crear administrador</button>
              </form>
              <details className="mt-5 text-sm">
                <summary className="cursor-pointer font-bold text-[#008e98]">
                  Dar acceso a una cuenta existente
                </summary>
                <form
                  action={grantExistingAdmin}
                  className="mt-3 flex flex-wrap gap-2"
                >
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="Correo de la cuenta existente"
                    className={`${input} min-w-[180px] flex-1`}
                  />
                  <button className={button}>Dar acceso</button>
                </form>
              </details>
            </AdminDialog>
          )}
        {selected && (
          <AdminDialog closeHref={closeHref} title="Detalle de inscripción">
            {(params.error || params.success) && (
              <p
                role="status"
                className={`mb-5 rounded-xl px-4 py-3 text-sm font-semibold ${params.error ? "bg-red-100 text-red-800" : "bg-teal-100 text-teal-900"}`}
              >
                {params.error
                  ? errors[params.error] || "Ocurrió un error."
                  : successes[params.success || ""]}
              </p>
            )}{" "}
            <>
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-[#009aa3]">
                    Detalle de inscripción
                  </p>
                  <h2 className="mt-2 text-2xl font-black">
                    {selected.first_name} {selected.last_name}
                  </h2>
                </div>
                <Link
                  href={closeHref}
                  className="text-sm font-bold text-slate-500"
                >
                  Cerrar ×
                </Link>
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                {[
                  ["Documento", selected.document],
                  ["Nacimiento", selected.birth_date],
                  ["Género", selected.gender],
                  ["WhatsApp", selected.phone],
                  ["Correo", selected.email],
                  [
                    "Emergencia",
                    `${selected.emergency_name} · ${selected.emergency_relation} · ${selected.emergency_phone}`,
                  ],
                  ["Plan", `${selected.plan} · S/ ${selected.price}`],
                  [
                    "Abono declarado",
                    `S/ ${selectedPaid} · saldo S/ ${Math.max(0, selected.price - selectedPaid)}`,
                  ],
                  ["Estado", labels[selected.status]],
                  [
                    "Fecha",
                    new Date(selected.created_at).toLocaleDateString("es-PE", {
                      dateStyle: "long",
                      timeZone: "America/Lima",
                    }),
                  ],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between gap-4 border-b border-slate-100 pb-2"
                  >
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="text-right font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
              <h3 className="mt-6 font-bold">Comprobante</h3>
              {originalReceipt?.signedUrl && (
                <a
                  className="mt-2 block text-sm font-bold text-[#008b96]"
                  href={originalReceipt.signedUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver comprobante original ↗
                </a>
              )}
              {receipt?.signedUrl ? (
                <a
                  href={receipt.signedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block"
                >
                  <Image
                    src={receipt.signedUrl}
                    alt="Comprobante de pago enviado"
                    width={600}
                    height={500}
                    unoptimized
                    className="max-h-72 w-full rounded-xl border border-slate-200 object-contain"
                  />
                  <span className="mt-2 block text-sm font-bold text-[#008b96]">
                    Abrir imagen ↗
                  </span>
                </a>
              ) : (
                <p className="mt-2 text-sm text-red-700">
                  No se pudo cargar el comprobante.
                </p>
              )}
              {selectedPayments.length > 0 && (
                <section className="mt-6 space-y-3">
                  <h3 className="font-black">Otros comprobantes</h3>
                  {selectedPayments.map((p) => (
                    <div
                      key={p.id}
                      id={`payment-${p.id}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
                    >
                      <div className="flex justify-between gap-2">
                        <strong>
                          {p.kind === "replacement"
                            ? "Reemplazo"
                            : "Abono adicional"}{" "}
                          · S/ {p.amount}
                        </strong>
                        <span>{labels[p.status]}</span>
                      </div>
                      {p.signedUrl && (
                        <a
                          href={p.signedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 block font-bold text-[#008b96]"
                        >
                          Ver comprobante ↗
                        </a>
                      )}
                      {p.review_note && (
                        <p className="mt-2 text-slate-600">{p.review_note}</p>
                      )}
                      <form action={reviewPayment} className="mt-3 space-y-2">
                        <input type="hidden" name="view" value={view} />
                        <input
                          type="hidden"
                          name="filter_q"
                          value={params.q || ""}
                        />
                        <input
                          type="hidden"
                          name="filter_status"
                          value={params.status || ""}
                        />
                        <input type="hidden" name="payment_id" value={p.id} />
                        <input
                          type="hidden"
                          name="registration_id"
                          value={selected.id}
                        />
                        <input
                          name="note"
                          defaultValue={p.review_note || ""}
                          maxLength={1000}
                          placeholder="Nota opcional"
                          className={input}
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            name="status"
                            value="approved"
                            className="rounded-lg bg-[#008e87] px-3 py-2 font-bold text-white"
                          >
                            Aprobar
                          </button>
                          <button
                            name="status"
                            value="rejected"
                            className="rounded-lg bg-red-100 px-3 py-2 font-bold text-red-800"
                          >
                            Observar
                          </button>
                          <button
                            name="status"
                            value="pending"
                            className="rounded-lg bg-slate-200 px-3 py-2 font-bold"
                          >
                            Pendiente
                          </button>
                        </div>
                      </form>
                    </div>
                  ))}
                </section>
              )}
              {history && history.length > 0 && (
                <details className="mt-5 rounded-xl bg-slate-50 p-4 text-sm">
                  <summary className="cursor-pointer font-bold">
                    Historial de revisiones
                  </summary>
                  <ul className="mt-3 space-y-3">
                    {history.map((event) => (
                      <li
                        key={event.id}
                        className="border-t border-slate-200 pt-2"
                      >
                        <strong>
                          {event.payment_id ? "Abono" : "Inscripción"}:{" "}
                          {labels[event.new_status] || event.new_status}
                        </strong>
                        <p className="text-xs text-slate-500">
                          {new Date(event.created_at).toLocaleString("es-PE", {
                            timeZone: "America/Lima",
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                        {event.note && <p className="mt-1">{event.note}</p>}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <form action={review} className="mt-6 space-y-3">
                <input type="hidden" name="view" value={view} />
                <input type="hidden" name="filter_q" value={params.q || ""} />
                <input
                  type="hidden"
                  name="filter_status"
                  value={params.status || ""}
                />
                <input type="hidden" name="id" value={selected.id} />
                <label className="block text-sm font-bold">
                  Nota de revisión
                  <textarea
                    name="note"
                    defaultValue={selected.review_note || ""}
                    maxLength={1000}
                    className={`${input} mt-2`}
                    rows={2}
                    placeholder="Opcional"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    name="status"
                    value="approved"
                    className="rounded-xl bg-[#008e87] px-4 py-3 text-sm font-bold text-white"
                  >
                    Aprobar
                  </button>
                  <button
                    name="status"
                    value="rejected"
                    className="rounded-xl bg-red-100 px-4 py-3 text-sm font-bold text-red-800"
                  >
                    Observar
                  </button>
                  <button
                    name="status"
                    value="pending"
                    className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold"
                  >
                    Pendiente
                  </button>
                </div>
              </form>
            </>
          </AdminDialog>
        )}
      </div>
    </main>
  );
}
