import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { BrandLogo } from "@/components/common/BrandLogo";
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
  if (master && secret && process.env.NEXT_PUBLIC_SUPABASE_URL) {
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
    <main className="min-h-screen bg-[#f5f3e9] text-[#092f39]">
      <header className="bg-[#08343d] text-white">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-5 py-5 lg:px-10">
          <div>
            <Link href="/" aria-label="Radical 2.0, inicio">
              <BrandLogo variant="secundario" width={115} />
            </Link>
            <p className="mt-2 text-xs font-black uppercase tracking-[.22em] text-[#ffc42b]">
              Radical 2.0
            </p>
            <h1 className="mt-1 text-2xl font-black">Centro de operaciones</h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden sm:inline">
              {user?.email} · {master ? "Cuenta maestra" : "Administrador"}
            </span>
            <form action={logout}>
              <button className="rounded-lg border border-white/30 px-4 py-2 font-bold hover:bg-white/10">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1500px] space-y-6 px-5 py-8 lg:px-10">
        {(params.error || params.success || loadError) && (
          <div
            role="status"
            className={`rounded-xl px-5 py-4 text-sm font-semibold ${params.error || loadError ? "bg-red-100 text-red-800" : "bg-teal-100 text-teal-900"}`}
          >
            {loadError
              ? "No se pudieron cargar todos los registros. Los resultados pueden estar incompletos; vuelve a intentarlo."
              : params.error
                ? errors[params.error] || "Ocurrió un error."
                : successes[params.success || ""]}
          </div>
        )}
        <section>
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#008e98]">
              Resumen del campamento
            </p>
            <h2 className="mt-1 text-3xl font-black">Inscripciones</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[
              ["Total", rows.length],
              [
                "Inscripciones por revisar",
                rows.filter((r) => r.status === "pending").length,
              ],
              [
                "Abonos por revisar",
                payments.filter((p) => p.status === "pending").length,
              ],
              ["Aprobadas", rows.filter((r) => r.status === "approved").length],
              [
                "Abonado aprobado",
                `S/ ${rows.filter((r) => r.status === "approved").reduce((n, r) => n + r.amount, 0) + payments.filter((p) => p.status === "approved" && p.kind === "additional").reduce((n, p) => n + p.amount, 0)}`,
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-[#dce5df] bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-black">{value}</p>
              </div>
            ))}
          </div>
        </section>
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
          <section className="rounded-3xl border border-[#dce5df] bg-white p-5 shadow-sm sm:p-7">
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
                    <th>Abono</th>
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
                      <td>S/ {r.amount}</td>
                      <td>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${r.status === "approved" ? "bg-emerald-100 text-emerald-800" : r.status === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}
                        >
                          {labels[r.status]}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/admin?selected=${r.id}`}
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
          <aside className="rounded-3xl border border-[#dce5df] bg-white p-6 shadow-sm">
            {selected ? (
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
                    href="/admin"
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
                      new Date(selected.created_at).toLocaleDateString(
                        "es-PE",
                        { dateStyle: "long", timeZone: "America/Lima" },
                      ),
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
                            {new Date(event.created_at).toLocaleString(
                              "es-PE",
                              {
                                timeZone: "America/Lima",
                                dateStyle: "medium",
                                timeStyle: "short",
                              },
                            )}
                          </p>
                          {event.note && <p className="mt-1">{event.note}</p>}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                <form action={review} className="mt-6 space-y-3">
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
            ) : (
              <div className="py-12 text-center">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#e5f7f3] text-3xl">
                  ✓
                </div>
                <h2 className="mt-5 text-xl font-black">Todo bajo control</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Selecciona una inscripción para consultar sus datos y revisar
                  su comprobante.
                </p>
              </div>
            )}
          </aside>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-[#dce5df] bg-white p-6">
            <h2 className="text-xl font-black">Mi contraseña</h2>
            <p className="mt-2 text-sm text-slate-500">
              Crea o cambia tu contraseña para acceder con correo y contraseña.
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
          {master && (
            <section className="rounded-3xl border border-[#dce5df] bg-white p-6">
              <h2 className="text-xl font-black">Equipo administrador</h2>
              <p className="mt-2 text-sm text-slate-500">
                Crea accesos para el equipo. La cuenta maestra administra los
                permisos.
              </p>
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
          )}
        </div>
      </div>
    </main>
  );
}
