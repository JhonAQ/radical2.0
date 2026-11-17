import { cookies } from "next/headers";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  Clock3,
  DoorOpen,
  IdCard,
  Phone,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { emailsForUsers } from "@/utils/supabase/service";
import { loadCheckInCounts } from "@/utils/check-in-roster";
import { ageAtCamp, isMinorAtCamp } from "@/utils/minors";
import { computeBalance, formatTicketCode, normalizeTicketCode } from "@/utils/ticket";
import { checkInRegistration } from "../../actions";
import { CashPaymentForm } from "../../components/CashPaymentForm";
import { TicketScanner } from "../../components/TicketScanner";
import { errorMessages, successMessages, type Registration } from "../../types";

export const metadata = { title: "Escáner de entradas | Radical 2.0" };

const timeFmt = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

type Tone = "ok" | "due" | "stop";
const toneClass: Record<Tone, string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-900",
  due: "border-amber-200 bg-amber-50 text-amber-900",
  stop: "border-rose-200 bg-rose-50 text-rose-900",
};
const toneIcon = { ok: BadgeCheck, due: AlertTriangle, stop: CircleAlert };

export default async function EscanerPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; q?: string; error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const client = createClient(await cookies());
  const {
    data: { user },
  } = await client.auth.getUser();
  const { data: membership } = user
    ? await client.from("admin_users").select("role").eq("user_id", user.id).maybeSingle()
    : { data: null };
  // El layout ya muestra el login; esto evita consultar nada si no es admin.
  if (!user || !membership) return null;

  const code = params.c ? normalizeTicketCode(params.c) : null;
  const query = params.q?.replace(/[,()"\\%_*]/g, " ").trim().replace(/\s+/g, " ") ?? "";

  const counts = await loadCheckInCounts(client);

  // Ficha rápida
  let registration: (Registration & { ticket_code: string }) | null = null;
  let balance = { totalPaid: 0, pendingAmount: 0, remaining: 0 };
  let checkIns: { id: number; created_at: string; actor_id: string | null; note: string | null }[] = [];
  let actorEmails = new Map<string, string>();
  let notFoundCode = false;

  if (code) {
    const { data } = await client.from("registrations").select("*").eq("ticket_code", code).maybeSingle();
    if (data) {
      registration = data as Registration & { ticket_code: string };
      const [{ data: payments }, { data: rows }] = await Promise.all([
        client.from("registration_payments").select("amount,kind,status").eq("registration_id", data.id),
        client
          .from("registration_check_ins")
          .select("id,created_at,actor_id,note")
          .eq("registration_id", data.id)
          .eq("kind", "ingreso")
          .order("created_at", { ascending: false }),
      ]);
      balance = computeBalance(registration, payments ?? []);
      checkIns = rows ?? [];
      actorEmails = await emailsForUsers(checkIns.flatMap((c) => (c.actor_id ? [c.actor_id] : [])));
    } else {
      notFoundCode = true;
    }
  }

  // Búsqueda manual por nombre o DNI
  const results = query
    ? (
        await client
          .from("registrations")
          .select("id,first_name,last_name,document,status,ticket_code")
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,document.ilike.%${query}%`)
          .order("last_name")
          .limit(8)
      ).data ?? []
    : [];

  const errorKey = notFoundCode ? "ticket" : params.error;
  const errorMessage = errorKey ? errorMessages[errorKey] : null;
  const successMessage = params.success ? successMessages[params.success] : null;

  let tone: Tone = "ok";
  let headline = "";
  let detail = "";
  if (registration) {
    if (registration.status === "rejected") {
      tone = "stop";
      headline = "Comprobante observado";
      detail = "Su pago inicial no está validado. Puedes cobrarle en efectivo aquí mismo.";
    } else if (registration.status !== "approved") {
      tone = "stop";
      headline = "Pago inicial sin validar";
      detail = "Revisa su comprobante en Validar comprobantes o cóbrale en efectivo.";
    } else if (balance.remaining > 0) {
      tone = "due";
      headline = `Debe S/ ${balance.remaining}`;
      detail =
        balance.pendingAmount > 0
          ? `Tiene S/ ${balance.pendingAmount} en comprobantes por revisar.`
          : "Puede ingresar; cobra el saldo si lo trae.";
    } else {
      tone = "ok";
      headline = "Pagado completo";
      detail = "Todo en orden.";
    }
  }
  const ToneIcon = toneIcon[tone];
  const lastCheckIn = checkIns[0];
  const age = registration ? ageAtCamp(registration.birth_date) : null;
  const actorLabel = (id: string | null) =>
    !id ? "un admin" : id === user.id ? "ti" : (actorEmails.get(id) ?? "otro admin");

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#082e39]">Escáner de entradas</h1>
          <p className="mt-0.5 text-sm text-slate-500">Escanea el QR o busca por código, nombre o DNI.</p>
        </div>
        <Link href="/admin/ingresos" className="shrink-0 rounded-xl px-2 py-1 text-right transition hover:bg-white">
          <p className="text-2xl font-black tabular-nums text-[#082e39]">
            {counts.checkedIn}
            <span className="text-base font-bold text-slate-400">/{counts.total}</span>
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#007b80]">ingresaron ›</p>
        </Link>
      </header>

      {errorMessage && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {errorMessage}
        </p>
      )}
      {successMessage && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {successMessage}
        </p>
      )}

      <TicketScanner key={code ?? "scan"} autoStart={!registration && !query} />

      {query && (
        <section className="rounded-2xl border border-[#dfe7e2] bg-white shadow-sm">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-[#082e39]">
            {results.length ? `Resultados para “${query}”` : `Sin resultados para “${query}”`}
          </h2>
          <ul className="divide-y divide-slate-100">
            {results.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/escaner?c=${r.ticket_code}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[#082e39]">
                      {r.first_name} {r.last_name}
                    </span>
                    <span className="text-xs text-slate-500">DNI {r.document}</span>
                  </span>
                  <ArrowRight size={16} className="shrink-0 text-slate-400" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {registration && (
        <>
          <section className={`rounded-2xl border p-4 ${toneClass[tone]}`}>
            <div className="flex items-start gap-3">
              <ToneIcon size={26} className="mt-0.5 shrink-0" aria-hidden />
              <div>
                <p className="text-xl font-black leading-tight">{headline}</p>
                <p className="mt-0.5 text-sm">{detail}</p>
              </div>
            </div>
            {lastCheckIn && (
              <p className="mt-3 flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-sm font-semibold text-[#082e39]">
                <Clock3 size={16} className="shrink-0" aria-hidden />
                Ya ingresó: {timeFmt.format(new Date(lastCheckIn.created_at))}, registrado por {actorLabel(lastCheckIn.actor_id)}.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-[#dfe7e2] bg-white p-4 shadow-sm">
            <p className="font-mono text-xs font-bold tracking-widest text-slate-400">
              {formatTicketCode(registration.ticket_code)}
            </p>
            <h2 className="mt-1 text-2xl font-black leading-tight text-[#082e39]">
              {registration.first_name} {registration.last_name}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              DNI {registration.document}
              {age !== null && age > 0 && ` · ${age} años`} · <span className="capitalize">{registration.plan}</span> S/ {registration.price}
            </p>

            {isMinorAtCamp(registration.birth_date) && (
              <p className="mt-3 flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-900">
                <ShieldAlert size={17} className="shrink-0" aria-hidden />
                Menor de edad: pedir permiso notarial de viaje.
              </p>
            )}

            <dl className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-slate-500">
                  <Phone size={15} aria-hidden /> Celular
                </dt>
                <dd>
                  <a href={`tel:${registration.phone}`} className="font-bold text-[#007b80] underline-offset-2 hover:underline">
                    {registration.phone}
                  </a>
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-2 text-slate-500">
                  <UserRound size={15} aria-hidden /> Emergencia
                </dt>
                <dd className="text-right">
                  <span className="block font-bold text-[#082e39]">
                    {registration.emergency_name} <span className="font-normal text-slate-500">({registration.emergency_relation})</span>
                  </span>
                  <a href={`tel:${registration.emergency_phone}`} className="font-bold text-[#007b80] underline-offset-2 hover:underline">
                    {registration.emergency_phone}
                  </a>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-slate-500">
                  <IdCard size={15} aria-hidden /> Pagado
                </dt>
                <dd className="font-bold tabular-nums text-[#082e39]">
                  S/ {balance.totalPaid} de S/ {registration.price}
                </dd>
              </div>
            </dl>
          </section>

          <form action={checkInRegistration}>
            <input type="hidden" name="id" value={registration.id} />
            <input type="hidden" name="scanner_code" value={registration.ticket_code} />
            <button
              type="submit"
              className={`inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-4 text-base font-bold shadow-sm transition ${
                lastCheckIn
                  ? "border border-slate-300 bg-white text-[#082e39] hover:bg-slate-50"
                  : "bg-[#082f39] text-white hover:bg-[#0b4248]"
              }`}
            >
              <DoorOpen size={20} aria-hidden />
              {lastCheckIn ? "Registrar ingreso otra vez" : "Registrar ingreso"}
            </button>
          </form>

          <CashPaymentForm
            registrationId={registration.id}
            approved={registration.status === "approved"}
            remaining={balance.remaining}
            price={registration.price}
            scannerCode={registration.ticket_code}
          />

          {checkIns.length > 1 && (
            <section className="rounded-2xl border border-[#dfe7e2] bg-white p-4 text-sm shadow-sm">
              <h3 className="font-bold text-[#082e39]">Ingresos registrados</h3>
              <ul className="mt-2 space-y-1 text-slate-600">
                {checkIns.map((c) => (
                  <li key={c.id}>
                    {timeFmt.format(new Date(c.created_at))} · por {actorLabel(c.actor_id)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Link
            href={`/admin/inscripciones/${registration.id}`}
            className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-[#007b80] underline-offset-4 hover:underline"
          >
            Ver ficha completa e historial
            <ArrowRight size={15} aria-hidden />
          </Link>
        </>
      )}
    </div>
  );
}
