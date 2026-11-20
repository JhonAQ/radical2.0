import { cookies } from "next/headers";
import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  ChevronRight,
  CircleAlert,
  Clock3,
  DoorOpen,
  Phone,
  ScanLine,
  ShieldAlert,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { emailsForUsers } from "@/utils/supabase/service";
import { loadCheckInCounts } from "@/utils/check-in-roster";
import { ageAtCamp, isMinorAtCamp } from "@/utils/minors";
import { computeBalance, formatTicketCode, normalizeTicketCode } from "@/utils/ticket";
import { checkInRegistration } from "../../actions";
import { CashPaymentForm } from "../../components/CashPaymentForm";
import { TicketScanner } from "../../components/TicketScanner";
import { PageHeader } from "../../components/PageHeader";
import { errorMessages, successMessages, type Registration } from "../../types";
import { PendingFieldset } from "../../components/PendingFieldset";

export const metadata = { title: "Escáner de entradas | Radical 2.0" };

const timeFmt = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});
const hourFmt = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", hour: "numeric", minute: "2-digit" });

type Tone = "ok" | "due" | "stop";
const bandClass: Record<Tone, string> = {
  ok: "bg-emerald-50 text-emerald-900 border-emerald-200",
  due: "bg-amber-50 text-amber-900 border-amber-200",
  stop: "bg-rose-50 text-rose-900 border-rose-200",
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
    ? ((
        await client
          .from("registrations")
          .select("id,first_name,last_name,document,status,ticket_code")
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,document.ilike.%${query}%`)
          .order("last_name")
          .limit(8)
      ).data ?? [])
    : [];

  const errorKey = notFoundCode ? "ticket" : params.error;
  const errorMessage = errorKey ? errorMessages[errorKey] : null;
  const lastCheckIn = checkIns[0];
  // Recién registrado: la tarjeta lo confirma y el siguiente paso es escanear a la próxima persona.
  const justCheckedIn = params.success === "checkin" && Boolean(lastCheckIn);
  const successMessage = params.success && params.success !== "checkin" ? successMessages[params.success] : null;

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
      detail = "Revisa su comprobante en Validar o cóbrale en efectivo aquí mismo.";
    } else if (balance.remaining > 0) {
      tone = "due";
      headline = `Debe S/ ${balance.remaining}`;
      detail =
        balance.pendingAmount > 0
          ? `Tiene S/ ${balance.pendingAmount} en comprobantes por validar. Puede ingresar.`
          : "Puede ingresar; cóbrale el saldo si lo trae.";
    } else {
      tone = "ok";
      headline = "Pagado completo";
      detail = "Todo en orden: puede ingresar.";
    }
  }
  const ToneIcon = justCheckedIn ? BadgeCheck : toneIcon[tone];
  const age = registration ? ageAtCamp(registration.birth_date) : null;
  const actorLabel = (id: string | null) => (!id ? "un admin" : id === user.id ? "ti" : (actorEmails.get(id) ?? "otro admin"));

  const primaryButton =
    "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#082f39] px-4 text-base font-bold text-white shadow-sm transition hover:bg-[#0b4248] active:bg-[#06242c]";
  const secondaryButton =
    "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#cfdcd7] bg-white px-4 text-base font-semibold text-[#082e39] transition hover:bg-[#f3f7f5]";
  const callButton =
    "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[#d8e3df] bg-white px-3 text-sm font-semibold text-[#2c4a47] transition hover:bg-[#f3f7f5]";

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader title="Escáner de entradas" description="Escanea el QR o busca por código, nombre o DNI." />

      <Link
        href="/admin/ingresos"
        className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-[#e2e8e4] bg-white px-4 text-sm transition hover:border-[#008e95]/40"
      >
        <span className="text-[#2c4a47]">
          Ingresaron <strong className="tabular-nums text-[#0a3039]">{counts.checkedIn}</strong> de{" "}
          <span className="tabular-nums">{counts.total}</span>
          <span className="text-[#6b8580]"> · faltan {counts.total - counts.checkedIn}</span>
        </span>
        <span className="inline-flex items-center gap-0.5 font-semibold text-[#007b80]">
          Lista
          <ChevronRight size={15} aria-hidden />
        </span>
      </Link>

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

      {/* Sin entrada abierta: la cámara es lo principal */}
      {!registration && <TicketScanner key={code ?? "scan"} autoStart={!query} />}

      {query && !registration && (
        <section aria-labelledby="resultados" className="overflow-hidden rounded-2xl border border-[#e2e8e4] bg-white">
          <h2 id="resultados" className="border-b border-[#eef2ef] px-4 py-3 text-sm font-bold text-[#082e39]">
            {results.length ? `Resultados para “${query}”` : `Sin resultados para “${query}”`}
          </h2>
          <ul className="divide-y divide-[#eef2ef]">
            {results.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/escaner?c=${r.ticket_code}`} className="flex min-h-14 items-center justify-between gap-3 px-4 py-2 transition hover:bg-[#fafcfb]">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#082e39]">
                      {r.first_name} {r.last_name}
                    </span>
                    <span className="text-xs text-[#5f7a75]">DNI {r.document}</span>
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-[#a9bab5]" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {registration && (
        <>
          {/* Veredicto + persona + acción: todo en la primera pantalla */}
          <section aria-live="polite" className="overflow-hidden rounded-2xl border border-[#e2e8e4] bg-white">
            <div className={`flex items-start gap-3 border-b px-4 py-3 ${bandClass[justCheckedIn ? "ok" : tone]}`}>
              <ToneIcon size={24} className="mt-0.5 shrink-0" aria-hidden />
              <div className="min-w-0">
                <p className="text-xl font-black leading-tight">{justCheckedIn ? "Ingreso registrado" : headline}</p>
                <p className="mt-0.5 text-sm">
                  {justCheckedIn
                    ? `A las ${hourFmt.format(new Date(lastCheckIn.created_at))}.${tone === "ok" ? " Pagado completo." : ` ${headline}.`}`
                    : detail}
                </p>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <div>
                <p className="text-2xl font-black leading-tight text-[#082e39]">
                  {registration.first_name} {registration.last_name}
                </p>
                <p className="mt-1 text-sm text-[#4d6a64]">
                  DNI {registration.document}
                  {age !== null && age > 0 && ` · ${age} años`} · <span className="capitalize">{registration.plan}</span>
                </p>
                <p className="mt-0.5 font-mono text-xs font-bold tracking-widest text-[#7d948f]">{formatTicketCode(registration.ticket_code)}</p>
              </div>

              {isMinorAtCamp(registration.birth_date) && (
                <p className="flex items-center gap-2 rounded-xl bg-amber-100 px-3 py-2 text-sm font-bold text-amber-900">
                  <ShieldAlert size={17} className="shrink-0" aria-hidden />
                  Menor de edad: pide el permiso notarial de viaje.
                </p>
              )}

              {lastCheckIn && !justCheckedIn && (
                <p className="flex items-start gap-2 rounded-xl bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-900">
                  <Clock3 size={16} className="mt-0.5 shrink-0" aria-hidden />
                  Ya ingresó: {timeFmt.format(new Date(lastCheckIn.created_at))}, registrado por {actorLabel(lastCheckIn.actor_id)}.
                </p>
              )}

              {justCheckedIn ? (
                <Link href="/admin/escaner" className={primaryButton}>
                  <ScanLine size={20} aria-hidden />
                  Escanear siguiente entrada
                </Link>
              ) : (
                <form action={checkInRegistration}>
                  <PendingFieldset className="contents">
                    <input type="hidden" name="id" value={registration.id} />
                    <input type="hidden" name="scanner_code" value={registration.ticket_code} />
                    <button type="submit" className={lastCheckIn || tone === "stop" ? secondaryButton : primaryButton}>
                      <DoorOpen size={20} aria-hidden />
                      {lastCheckIn ? "Registrar ingreso otra vez" : tone === "stop" ? "Registrar ingreso de todos modos" : "Registrar ingreso"}
                    </button>
                  </PendingFieldset>
                </form>
              )}
            </div>
          </section>

          <CashPaymentForm
            registrationId={registration.id}
            approved={registration.status === "approved"}
            remaining={balance.remaining}
            price={registration.price}
            scannerCode={registration.ticket_code}
          />

          <section aria-labelledby="contacto" className="rounded-2xl border border-[#e2e8e4] bg-white p-4">
            <h2 id="contacto" className="text-base font-bold text-[#0a3039]">
              Contacto
            </h2>
            <dl className="mt-1 divide-y divide-[#eef2ef] text-sm">
              <div className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <dt className="text-xs text-[#5f7a75]">Celular</dt>
                  <dd className="font-semibold text-[#0a3039]">{registration.phone}</dd>
                </div>
                <a href={`tel:${registration.phone}`} className={callButton}>
                  <Phone size={15} aria-hidden />
                  Llamar
                </a>
              </div>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <dt className="text-xs text-[#5f7a75]">Emergencia</dt>
                  <dd className="font-semibold text-[#0a3039]">
                    {registration.emergency_name} <span className="font-normal capitalize text-[#5f7a75]">({registration.emergency_relation})</span>
                    <span className="block">{registration.emergency_phone}</span>
                  </dd>
                </div>
                <a href={`tel:${registration.emergency_phone}`} className={callButton}>
                  <Phone size={15} aria-hidden />
                  Llamar
                </a>
              </div>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-xs text-[#5f7a75]">Pagado</dt>
                <dd className="font-semibold tabular-nums text-[#0a3039]">
                  S/ {balance.totalPaid} de S/ {registration.price}
                </dd>
              </div>
            </dl>
            {checkIns.length > 1 && (
              <div className="border-t border-[#eef2ef] pt-2.5 text-sm">
                <p className="text-xs text-[#5f7a75]">Ingresos registrados</p>
                <ul className="mt-1 space-y-0.5 text-[#2c4a47]">
                  {checkIns.map((c) => (
                    <li key={c.id}>
                      {timeFmt.format(new Date(c.created_at))} · por {actorLabel(c.actor_id)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Link
              href={`/admin/inscripciones/${registration.id}`}
              className="mt-2 flex min-h-11 items-center justify-center gap-1 rounded-xl text-sm font-semibold text-[#007b80] transition hover:bg-[#f3f7f5]"
            >
              Ver ficha completa
              <ChevronRight size={15} aria-hidden />
            </Link>
          </section>

          {!justCheckedIn && (
            <Link href="/admin/escaner" className={secondaryButton}>
              <ScanLine size={19} aria-hidden />
              Escanear otra entrada
            </Link>
          )}
        </>
      )}
    </div>
  );
}
