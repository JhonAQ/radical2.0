import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/utils/supabase/server";
import { emailsForUsers } from "@/utils/supabase/service";
import { isMinorAtCamp } from "@/utils/minors";
import { formatTicketCode, ticketState, ticketUrl } from "@/utils/ticket";
import { CamperReceiptModal } from "../../../components/CamperReceiptModal";
import { RegistrationDataForm } from "../../../components/RegistrationDataForm";
import { CashPaymentForm } from "../../../components/CashPaymentForm";
import { ReviewResolutionForm } from "../../../components/ReviewResolutionForm";
import { deleteRegistration, review, reviewPayment } from "../../../actions";
import { ConfirmSubmitButton } from "../../../components/ConfirmSubmitButton";
import {
  statusLabels,
  type Registration,
  type RegistrationPayment,
  type ReviewEvent,
} from "../../../types";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DoorOpen,
  MessageCircle,
  Phone,
  ScanLine,
  ShieldAlert,
} from "lucide-react";
import { FlashMessage } from "../../../components/FlashMessage";
import { StatusBadge } from "../../../components/StatusBadge";

const dateTimeFmt = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Lima",
});

export default async function AdminInscripcionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const client = createClient(await cookies());
  const {
    data: { user: viewer },
  } = await client.auth.getUser();
  const { data: viewerRole } = viewer
    ? await client.from("admin_users").select("role").eq("user_id", viewer.id).maybeSingle()
    : { data: null };
  // Un pago ya aprobado solo lo cambia la cuenta maestra.
  const isMaster = viewerRole?.role === "master";

  const { data: rawRegistration, error: regError } = await client
    .from("registrations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (regError || !rawRegistration) {
    notFound();
  }

  const registration = rawRegistration as Registration & { ticket_code: string | null };
  const selfUrl = `/admin/inscripciones/${registration.id}`;

  const [
    { data: rawPayments },
    { data: rawHistory },
    { data: rawCheckIns },
    { data: prevReg },
    { data: nextReg },
  ] = await Promise.all([
    client
      .from("registration_payments")
      .select("*")
      .eq("registration_id", id)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true }),
    client
      .from("registration_review_events")
      .select("id,payment_id,created_at,old_status,new_status,note")
      .eq("registration_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
    client
      .from("registration_check_ins")
      .select("id,created_at,actor_id")
      .eq("registration_id", id)
      .order("created_at", { ascending: false }),
    client
      .from("registrations")
      .select("id,first_name,last_name")
      .lt("created_at", registration.created_at)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from("registrations")
      .select("id,first_name,last_name")
      .gt("created_at", registration.created_at)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const payments = (rawPayments as RegistrationPayment[]) || [];
  const history = (rawHistory as ReviewEvent[]) || [];
  const checkIns = rawCheckIns ?? [];
  const actorEmails = await emailsForUsers(checkIns.flatMap((c) => (c.actor_id ? [c.actor_id] : [])));

  const paymentLabels = new Map<string, string>();
  let additionalNumber = 0;
  let cashNumber = 0;
  for (const payment of payments) {
    if (payment.kind === "replacement") {
      paymentLabels.set(payment.id, "Comprobante corregido");
    } else if (payment.method === "efectivo") {
      cashNumber += 1;
      paymentLabels.set(payment.id, `Pago en efectivo #${cashNumber}`);
    } else {
      additionalNumber += 1;
      paymentLabels.set(payment.id, `Abono adicional #${additionalNumber}`);
    }
  }

  // URLs firmadas de todos los comprobantes (el visor permite pasar de uno a otro)
  const receiptsList: Array<{
    id: string;
    label: string;
    url: string;
    amount?: number;
    kind?: string;
    status?: string;
  }> = [];

  if (registration.receipt_path) {
    const { data } = await client.storage
      .from("registration-receipts")
      .createSignedUrl(registration.receipt_path, 600);
    if (data?.signedUrl) {
      receiptsList.push({
        id: "main-receipt",
        label: "Comprobante inicial",
        url: data.signedUrl,
        amount: registration.amount,
        status: registration.status,
      });
    }
  }

  if (
    registration.original_receipt_path &&
    registration.original_receipt_path !== registration.receipt_path
  ) {
    const { data } = await client.storage
      .from("registration-receipts")
      .createSignedUrl(registration.original_receipt_path, 600);
    if (data?.signedUrl) {
      receiptsList.push({
        id: "original-receipt",
        label: "Voucher original (reemplazado)",
        url: data.signedUrl,
      });
    }
  }

  for (const p of payments) {
    if (!p.receipt_path) continue;
    const { data } = await client.storage
      .from("registration-receipts")
      .createSignedUrl(p.receipt_path, 600);
    if (data?.signedUrl) {
      receiptsList.push({
        id: p.id,
        label: paymentLabels.get(p.id) ?? `Abono S/ ${p.amount}`,
        url: data.signedUrl,
        amount: p.amount,
        kind: p.kind,
        status: p.status,
      });
    }
  }
  const hasReceipt = (receiptId: string) => receiptsList.some((r) => r.id === receiptId);

  // Estado de cuenta
  const totalApproved =
    registration.amount +
    payments
      .filter((p) => p.kind === "additional" && p.status === "approved")
      .reduce((n, p) => n + p.amount, 0);
  const pendingPayments = payments.filter((p) => p.status === "pending");
  const pendingAmount = pendingPayments
    .filter((p) => p.kind === "additional")
    .reduce((n, p) => n + p.amount, 0);
  const remainingBalance = Math.max(0, registration.price - totalApproved);
  const isApproved = registration.status === "approved";
  // Si observaron el pago inicial y la persona subió uno corregido, lo que se revisa es el corregido.
  const hasPendingReplacement = pendingPayments.some((p) => p.kind === "replacement");
  const initialNeedsReview = registration.status === "pending" || (registration.status === "rejected" && !hasPendingReplacement);
  const canReviewPayment = (p: RegistrationPayment) =>
    p.kind === "replacement" ? registration.status === "rejected" : isApproved;
  const hasWork = initialNeedsReview || pendingPayments.length > 0;
  const isCashInitial = registration.payment_method === "efectivo";

  // Entrada
  const ticket = registration.ticket_code
    ? {
        code: registration.ticket_code,
        state: ticketState(registration.status),
        svg: await QRCode.toString(ticketUrl(registration.ticket_code), {
          type: "svg",
          margin: 0,
          errorCorrectionLevel: "M",
          color: { dark: "#0b2d36", light: "#00000000" },
        }),
      }
    : null;
  const lastCheckIn = checkIns[0];
  const actorLabel = (actorId: string | null) => (actorId && actorEmails.get(actorId)) || "un admin";

  const cleanPhone = registration.phone.replace(/\D/g, "");
  const waNumber = cleanPhone.length === 9 ? `51${cleanPhone}` : cleanPhone;
  const waMessage = encodeURIComponent(
    `Hola ${registration.first_name}, te escribimos del equipo del campamento Radical 2.0 respecto a tu inscripción.`,
  );
  const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

  const navButton =
    "inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50";
  const navButtonDisabled =
    "inline-flex min-h-9 cursor-not-allowed items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-2.5 text-xs font-semibold text-slate-300";

  return (
    <div className="space-y-6">
      {/* ── Encabezado ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-3.5">
          <Link
            href="/admin/inscripciones"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft size={14} />
            <span>Campistas</span>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold text-[#082e39] sm:text-2xl">
                {registration.first_name} {registration.last_name}
              </h1>
              <StatusBadge status={registration.status} size="md" />
              {isMinorAtCamp(registration.birth_date) && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                  <ShieldAlert size={12} aria-hidden />
                  Menor de edad
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              DNI {registration.document} · Plan <span className="capitalize">{registration.plan}</span> · Inscrito el{" "}
              {new Date(registration.created_at).toLocaleDateString("es-PE", {
                dateStyle: "medium",
                timeZone: "America/Lima",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#25D366] px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#20ba59]"
          >
            <MessageCircle size={14} />
            <span className="hidden sm:inline">Escribir por WhatsApp</span>
            <span className="sm:hidden">WhatsApp</span>
          </a>

          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            {prevReg ? (
              <Link href={`/admin/inscripciones/${prevReg.id}`} title={`Anterior: ${prevReg.first_name}`} className={navButton}>
                <ChevronLeft size={14} />
                <span className="hidden sm:inline">Anterior</span>
              </Link>
            ) : (
              <span className={navButtonDisabled}>
                <ChevronLeft size={14} />
              </span>
            )}
            {nextReg ? (
              <Link href={`/admin/inscripciones/${nextReg.id}`} title={`Siguiente: ${nextReg.first_name}`} className={navButton}>
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight size={14} />
              </Link>
            ) : (
              <span className={navButtonDisabled}>
                <ChevronRight size={14} />
              </span>
            )}
          </div>
        </div>
      </div>

      <FlashMessage error={search.error} success={search.success} />

      {/* ── Por resolver: todo lo que espera una decisión, arriba y con sus botones ── */}
      {hasWork && (
        <section className="rounded-xl border-2 border-amber-200 bg-amber-50/40 p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-bold text-[#082e39]">Por resolver</h2>
          <p className="mt-0.5 text-xs text-slate-600">
            Revisa el comprobante y aprueba, u observa con una nota para avisarle por WhatsApp.
          </p>

          <div className="mt-4 space-y-4">
            {initialNeedsReview && (
              <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_1.1fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {isCashInitial ? "Pago inicial en efectivo" : "Pago inicial de la inscripción"}
                    </span>
                    <StatusBadge status={registration.status} />
                  </div>
                  <p className="mt-1 text-2xl font-black tabular-nums text-[#082e39]">S/ {registration.amount}</p>
                  <p className="text-xs text-slate-500">Enviado el {dateTimeFmt.format(new Date(registration.created_at))}</p>
                  {registration.review_note && (
                    <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-900">
                      Observación anterior: {registration.review_note}
                    </p>
                  )}
                  <div className="mt-3">
                    {hasReceipt("main-receipt") ? (
                      <CamperReceiptModal receipts={receiptsList} initialReceiptId="main-receipt" triggerLabel="Ver comprobante" />
                    ) : (
                      <span className="text-xs font-semibold text-slate-500">Sin foto de comprobante</span>
                    )}
                  </div>
                </div>
                <ReviewResolutionForm
                  action={review}
                  isInitial
                  id={registration.id}
                  currentStatus={registration.status}
                  initialNote={registration.review_note || ""}
                  view="registrations"
                  returnTo={selfUrl}
                  entityType="inscripcion"
                  participantPhone={registration.phone}
                  participantFirstName={registration.first_name}
                />
              </div>
            )}

            {pendingPayments.map((p) => (
              <div key={p.id} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_1.1fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{paymentLabels.get(p.id) ?? "Abono adicional"}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="mt-1 text-2xl font-black tabular-nums text-[#082e39]">S/ {p.amount}</p>
                  <p className="text-xs text-slate-500">Enviado el {dateTimeFmt.format(new Date(p.created_at))}</p>
                  <div className="mt-3">
                    {hasReceipt(p.id) ? (
                      <CamperReceiptModal receipts={receiptsList} initialReceiptId={p.id} triggerLabel="Ver comprobante" />
                    ) : (
                      <span className="text-xs font-semibold text-slate-500">Sin foto de comprobante</span>
                    )}
                  </div>
                </div>
                {canReviewPayment(p) ? (
                  <ReviewResolutionForm
                    action={reviewPayment}
                    isInitial={false}
                    id={p.id}
                    registrationId={registration.id}
                    currentStatus={p.status}
                    initialNote={p.review_note || ""}
                    view="payments"
                    returnTo={selfUrl}
                    entityType="comprobante"
                    participantPhone={registration.phone}
                    participantFirstName={registration.first_name}
                  />
                ) : (
                  <p className="self-center rounded-lg bg-slate-50 p-3 text-xs font-semibold text-slate-600">
                    Primero resuelve el pago inicial. Este abono se puede validar cuando la inscripción esté aprobada.
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* ── Columna izquierda: pagos y datos ── */}
        <div className="space-y-6">
          <section className="rounded-xl border border-[#e2e8e4] bg-white p-5 shadow-sm sm:p-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#082e39]">Pagos</h2>
              <p className="mt-0.5 text-xs text-slate-500">Todo lo que ha pagado, en orden.</p>
            </div>

            <ul className="mt-4 space-y-3">
              <li className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 bg-[#fafcfb] p-3.5 text-xs sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {isCashInitial ? "Pago inicial en efectivo" : "Pago inicial de la inscripción"}
                    </span>
                    <StatusBadge status={registration.status} />
                  </div>
                  <p className="mt-1 text-slate-500">
                    <strong className="text-slate-800">S/ {registration.amount}</strong> · {dateTimeFmt.format(new Date(registration.created_at))}
                  </p>
                </div>
                {hasReceipt("main-receipt") && (
                  <CamperReceiptModal receipts={receiptsList} initialReceiptId="main-receipt" triggerLabel="Ver comprobante" />
                )}
              </li>

              {payments.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 bg-[#fafcfb] p-3.5 text-xs sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{paymentLabels.get(p.id) ?? "Abono adicional"}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="mt-1 text-slate-500">
                      <strong className="text-slate-800">S/ {p.amount}</strong> · {dateTimeFmt.format(new Date(p.created_at))}
                    </p>
                    {p.review_note && (
                      <p className="mt-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-900">Nota: {p.review_note}</p>
                    )}
                  </div>
                  {hasReceipt(p.id) && (
                    <CamperReceiptModal receipts={receiptsList} initialReceiptId={p.id} triggerLabel="Ver comprobante" />
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-[#e2e8e4] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-bold text-[#082e39]">Datos del participante</h2>
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3.5 text-xs sm:grid-cols-2">
              <div className="border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Documento de identidad</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-900">{registration.document}</dd>
              </div>
              <div className="border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Fecha de nacimiento</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-900">{registration.birth_date}</dd>
              </div>
              <div className="border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Género</dt>
                <dd className="mt-0.5 text-sm font-semibold capitalize text-slate-900">{registration.gender}</dd>
              </div>
              <div className="border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Correo electrónico</dt>
                <dd className="mt-0.5 truncate text-sm font-semibold text-slate-900">
                  <a href={`mailto:${registration.email}`} className="hover:text-[#008e95] hover:underline">
                    {registration.email}
                  </a>
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 sm:col-span-2">
                <div>
                  <dt className="text-slate-500">Celular</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-slate-900">{registration.phone}</dd>
                </div>
                <a
                  href={`tel:${registration.phone}`}
                  className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <Phone size={12} />
                  <span>Llamar</span>
                </a>
              </div>
              <div className="flex items-center justify-between gap-3 sm:col-span-2">
                <div>
                  <dt className="text-slate-500">Contacto de emergencia</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                    {registration.emergency_name}{" "}
                    <span className="font-normal capitalize text-slate-500">({registration.emergency_relation})</span>
                    <span className="block font-bold text-[#0a4249]">{registration.emergency_phone}</span>
                  </dd>
                </div>
                <a
                  href={`tel:${registration.emergency_phone}`}
                  className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <Phone size={12} />
                  <span>Llamar</span>
                </a>
              </div>
            </dl>
          </section>

          <RegistrationDataForm registration={registration} />

          {history.length > 0 && (
            <details className="rounded-xl border border-slate-200 bg-white p-4 text-xs shadow-sm">
              <summary className="cursor-pointer font-bold text-slate-700">
                Historial de cambios ({history.length})
              </summary>
              <ul className="mt-3 divide-y divide-slate-100">
                {history.map((event) => (
                  <li key={event.id} className="py-2.5">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-medium text-slate-700">
                        {event.payment_id ? paymentLabels.get(event.payment_id) ?? "Abono" : "Pago inicial"}
                      </span>
                      <span>{dateTimeFmt.format(new Date(event.created_at))}</span>
                    </div>
                    <p className="mt-0.5 font-semibold text-slate-800">
                      Estado: {statusLabels[event.new_status] || event.new_status}
                    </p>
                    {event.note && <p className="mt-1 rounded bg-slate-50 p-2 text-slate-600">{event.note}</p>}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>

        {/* ── Columna derecha: cuenta, entrada y acciones (en celular va primero) ── */}
        <div className="order-first space-y-6 lg:order-none">
          <section className="rounded-xl border border-[#e2e8e4] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#082e39]">Estado de cuenta</h2>
              <span className="text-xs font-semibold capitalize text-slate-500">Plan {registration.plan}</span>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Costo del plan</span>
                <span className="text-sm font-bold text-slate-800">S/ {registration.price}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Pagado</span>
                <span className="text-sm font-bold text-emerald-700">S/ {totalApproved}</span>
              </div>
              {pendingAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Por revisar</span>
                  <span className="text-sm font-bold text-amber-700">S/ {pendingAmount}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="font-semibold text-slate-700">Saldo pendiente</span>
                <span className={`text-base font-black ${remainingBalance > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                  S/ {remainingBalance}
                </span>
              </div>
              {isApproved && remainingBalance === 0 && (
                <p className="rounded-lg bg-emerald-50 p-2.5 text-center font-semibold text-emerald-800">Pagado completo</p>
              )}
              {!isApproved && (
                <p className="rounded-lg bg-amber-50 p-2.5 text-amber-900">
                  El pago inicial aún no está aprobado; el saldo se confirma al aprobarlo.
                </p>
              )}
            </div>
          </section>

          {/* Entrada y control de ingreso */}
          <section className="rounded-xl border border-[#e2e8e4] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-bold text-[#082e39]">Entrada al campamento</h2>
            {ticket ? (
              <div className="mt-4 flex items-start gap-4">
                <div
                  className={`size-24 shrink-0 rounded-lg border border-slate-200 p-2 [&_svg]:size-full ${ticket.state === "active" ? "" : "opacity-30"}`}
                  role="img"
                  aria-label={`Código QR de la entrada ${formatTicketCode(ticket.code)}`}
                  dangerouslySetInnerHTML={{ __html: ticket.svg }}
                />
                <div className="min-w-0 text-xs">
                  <p className="font-mono text-sm font-bold tracking-wider text-[#082e39]">{formatTicketCode(ticket.code)}</p>
                  <p className="mt-1 font-semibold text-slate-600">
                    {ticket.state === "active"
                      ? "Entrada activa"
                      : ticket.state === "rejected"
                        ? "Entrada bloqueada: pago observado"
                        : "Se activa al aprobar el pago inicial"}
                  </p>
                  {lastCheckIn ? (
                    <p className="mt-2 flex items-start gap-1.5 font-semibold text-emerald-800">
                      <BadgeCheck size={14} className="mt-px shrink-0" aria-hidden />
                      Ingresó el {dateTimeFmt.format(new Date(lastCheckIn.created_at))}, registrado por {actorLabel(lastCheckIn.actor_id)}
                      {checkIns.length > 1 && ` (${checkIns.length} registros)`}.
                    </p>
                  ) : (
                    <p className="mt-2 flex items-center gap-1.5 text-slate-500">
                      <Clock3 size={14} className="shrink-0" aria-hidden />
                      Aún no ingresa al campamento.
                    </p>
                  )}
                  <Link
                    href={`/admin/escaner?c=${ticket.code}`}
                    className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#082f39] px-3 text-xs font-bold text-white hover:bg-[#0b4248]"
                  >
                    {lastCheckIn ? <ScanLine size={14} aria-hidden /> : <DoorOpen size={14} aria-hidden />}
                    {lastCheckIn ? "Abrir en el escáner" : "Registrar ingreso"}
                  </Link>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">Esta inscripción no tiene código de entrada.</p>
            )}
          </section>

          <CashPaymentForm
            registrationId={registration.id}
            approved={isApproved}
            remaining={remainingBalance}
            price={registration.price}
          />

          {isApproved && isMaster && (
            <details className="rounded-xl border border-[#e2e8e4] bg-white p-5 shadow-sm sm:p-6">
              <summary className="cursor-pointer text-sm font-bold text-[#082e39]">
                Cambiar el estado de la inscripción
                <span className="mt-0.5 block text-xs font-normal text-slate-500">
                  Para observarla o devolverla a pendiente si se aprobó por error.
                </span>
              </summary>
              <div className="mt-4">
                <ReviewResolutionForm
                  action={review}
                  isInitial
                  id={registration.id}
                  currentStatus={registration.status}
                  initialNote={registration.review_note || ""}
                  view="registrations"
                  returnTo={selfUrl}
                  entityType="inscripcion"
                  participantPhone={registration.phone}
                  participantFirstName={registration.first_name}
                />
              </div>
            </details>
          )}

          {isMaster && (
            <form action={deleteRegistration} className="rounded-xl border border-red-200 bg-white p-5 shadow-sm sm:p-6">
              <input type="hidden" name="id" value={registration.id} />
              <h2 className="text-sm font-bold text-red-800">Eliminar inscripción</h2>
              <p className="mt-1 text-xs text-slate-500">
                Borra la inscripción con sus abonos, historial e ingresos. La cuenta de Google sigue existiendo y podrá volver a
                inscribirse. Se guarda una copia interna de lo eliminado.
              </p>
              <ConfirmSubmitButton
                message={`¿Eliminar la inscripción de ${registration.first_name} ${registration.last_name}? Se borran sus abonos e historial y no se puede deshacer.`}
                className="mt-3 inline-flex min-h-9 items-center rounded-lg bg-red-600 px-3 text-xs font-bold text-white hover:bg-red-700"
              >
                Eliminar inscripción
              </ConfirmSubmitButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
