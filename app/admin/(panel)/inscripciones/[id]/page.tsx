import type { ReactNode } from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/utils/supabase/server";
import { emailsForUsers } from "@/utils/supabase/service";
import { ageAtCamp, isMinorAtCamp } from "@/utils/minors";
import { formatTicketCode, ticketState, ticketUrl } from "@/utils/ticket";
import { observationMessage, whatsappUrl } from "@/utils/whatsapp";
import { WhatsAppMark } from "@/components/common/WhatsAppMark";
import { CamperReceiptModal } from "../../../components/CamperReceiptModal";
import { RegistrationDataForm } from "../../../components/RegistrationDataForm";
import { CashPaymentForm } from "../../../components/CashPaymentForm";
import { ReviewResolutionForm } from "../../../components/ReviewResolutionForm";
import { ConfirmSubmitButton } from "../../../components/ConfirmSubmitButton";
import { FlashMessage } from "../../../components/FlashMessage";
import { StatusBadge } from "../../../components/StatusBadge";
import { AccountChip } from "../../../components/AccountChip";
import { ObservedNotice } from "../../../components/ObservedNotice";
import { deleteRegistration, review, reviewPayment } from "../../../actions";
import { statusLabels, type Registration, type RegistrationPayment, type ReviewEvent } from "../../../types";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DoorOpen,
  History,
  Phone,
  RotateCcw,
  ScanLine,
  ShieldAlert,
  Trash2,
} from "lucide-react";

const dateTimeFmt = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Lima",
});
const dayFmt = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Lima" });
// La fecha de nacimiento es un día calendario: se formatea en UTC para que no se corra un día.
const birthFmt = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function AdminInscripcionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string; observado?: string; tipo?: string }>;
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

  const { data: rawRegistration, error: regError } = await client.from("registrations").select("*").eq("id", id).maybeSingle();
  if (regError || !rawRegistration) notFound();

  const registration = rawRegistration as Registration & { ticket_code: string | null };
  const selfUrl = `/admin/inscripciones/${registration.id}`;

  const [{ data: rawPayments }, { data: rawHistory }, { data: rawCheckIns }, { data: prevReg }, { data: nextReg }] = await Promise.all([
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
    client.from("registration_check_ins").select("id,created_at,actor_id").eq("registration_id", id).order("created_at", { ascending: false }),
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
  const isCashInitial = registration.payment_method === "efectivo";

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
      paymentLabels.set(payment.id, `Abono #${additionalNumber}`);
    }
  }

  // URLs firmadas de todos los comprobantes en una sola consulta (el visor permite pasar de uno a otro).
  const receiptSources = [
    registration.receipt_path
      ? { id: "main-receipt", path: registration.receipt_path, label: "Pago inicial", amount: registration.amount as number | undefined, kind: undefined as string | undefined, status: registration.status as string | undefined }
      : null,
    registration.original_receipt_path && registration.original_receipt_path !== registration.receipt_path
      ? { id: "original-receipt", path: registration.original_receipt_path, label: "Voucher original (reemplazado)", amount: undefined, kind: undefined, status: undefined }
      : null,
    ...payments.map((p) =>
      p.receipt_path ? { id: p.id, path: p.receipt_path, label: paymentLabels.get(p.id) ?? `Abono S/ ${p.amount}`, amount: p.amount, kind: p.kind, status: p.status } : null,
    ),
  ].filter((r) => r !== null);
  const signedByPath = new Map<string, string>();
  if (receiptSources.length) {
    const { data: signed } = await client.storage
      .from("registration-receipts")
      .createSignedUrls([...new Set(receiptSources.map((r) => r.path))], 600);
    for (const s of signed ?? []) if (s.path && s.signedUrl) signedByPath.set(s.path, s.signedUrl);
  }
  const receiptsList = receiptSources.flatMap(({ path, ...r }) => {
    const url = signedByPath.get(path);
    return url ? [{ ...r, url }] : [];
  });
  const receiptFor = (receiptId: string) => (receiptsList.some((r) => r.id === receiptId) ? receiptId : null);

  // Estado de cuenta: solo cuenta lo aprobado.
  const isApproved = registration.status === "approved";
  const approvedExtra = payments.filter((p) => p.kind === "additional" && p.status === "approved").reduce((n, p) => n + p.amount, 0);
  const totalApproved = (isApproved ? registration.amount : 0) + approvedExtra;
  const remainingBalance = Math.max(0, registration.price - totalApproved);
  const paidPercent = registration.price ? Math.min(100, Math.round((totalApproved / registration.price) * 100)) : 0;
  const pendingPayments = payments.filter((p) => p.status === "pending");
  const pendingAmount = pendingPayments.filter((p) => p.kind === "additional").reduce((n, p) => n + p.amount, 0);

  // Si observaron el pago inicial y la persona subió uno corregido, lo que se revisa es el corregido.
  const hasPendingReplacement = pendingPayments.some((p) => p.kind === "replacement");
  const initialPending = registration.status === "pending";
  const observedInitial = registration.status === "rejected" && !hasPendingReplacement;
  const canReviewPayment = (p: RegistrationPayment) => (p.kind === "replacement" ? registration.status === "rejected" : isApproved);
  const toReviewCount = (initialPending ? 1 : 0) + pendingPayments.length;

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

  const age = ageAtCamp(registration.birth_date);
  const minor = isMinorAtCamp(registration.birth_date);
  const birth = new Date(`${registration.birth_date.slice(0, 10)}T00:00:00Z`);
  const birthText = Number.isNaN(birth.getTime()) ? registration.birth_date : birthFmt.format(birth);

  const waUrl = whatsappUrl(
    registration.phone,
    `Hola ${registration.first_name}, te escribimos del equipo del campamento Radical 2.0 respecto a tu inscripción.`,
  );
  const observedWa = (what: string, note: string | null) =>
    note ? whatsappUrl(registration.phone, observationMessage(registration.first_name, what, note)) : null;
  // El aviso de un abono observado tiene sentido mientras sea lo último que envió.
  const lastPayment = payments[payments.length - 1];

  const card = "rounded-2xl border border-[#e2e8e4] bg-white p-4 sm:p-5";
  const rowSummary =
    "flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-2 sm:px-5 [&::-webkit-details-marker]:hidden";
  const navButton =
    "inline-flex min-h-10 items-center gap-1 rounded-xl border border-[#d8e3df] bg-white px-3 text-sm font-semibold text-[#2c4a47] transition hover:bg-[#f3f7f5]";
  const navDisabled = "inline-flex min-h-10 cursor-not-allowed items-center gap-1 rounded-xl border border-[#eef2ef] px-3 text-sm font-semibold text-[#b9c7c3]";
  const callButton =
    "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[#d8e3df] bg-white px-3 text-sm font-semibold text-[#2c4a47] transition hover:bg-[#f3f7f5]";
  const waButton =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#187a42] px-4 text-sm font-bold text-white transition hover:bg-[#136536]";

  const reviewHead = (label: string, amount: number, date: string, receiptId: string | null, inPerson = false) => (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#0a3039]">{label}</p>
        <p className="text-xs text-[#6b5a3a]">Enviado el {dateTimeFmt.format(new Date(date))}</p>
        <div className="mt-2">
          {receiptId ? (
            <CamperReceiptModal receipts={receiptsList} initialReceiptId={receiptId} />
          ) : (
            <span className="text-xs font-semibold text-[#6b5a3a]">{inPerson ? "Recibido en persona" : "Sin foto de comprobante"}</span>
          )}
        </div>
      </div>
      <p className="shrink-0 text-2xl font-black tabular-nums tracking-tight text-[#082e39]">S/ {amount}</p>
    </div>
  );

  const dataRow = (label: string, value: ReactNode, action?: ReactNode) => (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <dt className="text-xs text-[#5f7a75]">{label}</dt>
        <dd className="mt-0.5 text-sm font-semibold text-[#0a3039]">{value}</dd>
      </div>
      {action}
    </div>
  );

  const paymentRows = [
    {
      key: "initial",
      label: isCashInitial ? "Pago inicial en efectivo" : "Pago inicial",
      amount: registration.amount,
      date: registration.created_at,
      status: registration.status,
      // Si está observado, la nota ya se muestra arriba con el aviso.
      note: observedInitial ? null : registration.review_note,
      receiptId: receiptFor("main-receipt"),
      wa: null as string | null,
    },
    ...payments.map((p) => ({
      key: p.id,
      label: paymentLabels.get(p.id) ?? "Abono",
      amount: p.amount,
      date: p.created_at,
      status: p.status,
      note: p.review_note,
      receiptId: receiptFor(p.id),
      wa:
        p.status === "rejected" && p.id === lastPayment?.id
          ? observedWa(p.kind === "replacement" ? "tu comprobante corregido" : `tu abono de S/ ${p.amount}`, p.review_note)
          : null,
    })),
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* ── Encabezado ── */}
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href="/admin/inscripciones"
              className="mb-2 hidden items-center gap-1.5 text-sm font-semibold text-[#5f7a75] transition hover:text-[#0a3039] lg:inline-flex"
            >
              <ArrowLeft size={15} aria-hidden />
              Campistas
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-[#082e39] sm:text-3xl">
              {registration.first_name} {registration.last_name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <AccountChip status={registration.status} due={remainingBalance} size="md" />
              {minor && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-1 text-sm font-semibold text-amber-900">
                  <ShieldAlert size={14} aria-hidden />
                  Menor de edad
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-[#5f7a75]">
              DNI {registration.document} · <span className="capitalize">{registration.plan}</span>
              {age !== null && ` · ${age} años`} · inscrito el {dayFmt.format(new Date(registration.created_at))}
            </p>
          </div>
          <nav aria-label="Otras inscripciones" className="hidden shrink-0 items-center gap-1.5 lg:flex">
            {prevReg ? (
              <Link href={`/admin/inscripciones/${prevReg.id}`} title={`Anterior: ${prevReg.first_name} ${prevReg.last_name}`} className={navButton}>
                <ChevronLeft size={16} aria-hidden />
                Anterior
              </Link>
            ) : (
              <span className={navDisabled}>
                <ChevronLeft size={16} aria-hidden />
                Anterior
              </span>
            )}
            {nextReg ? (
              <Link href={`/admin/inscripciones/${nextReg.id}`} title={`Siguiente: ${nextReg.first_name} ${nextReg.last_name}`} className={navButton}>
                Siguiente
                <ChevronRight size={16} aria-hidden />
              </Link>
            ) : (
              <span className={navDisabled}>
                Siguiente
                <ChevronRight size={16} aria-hidden />
              </span>
            )}
          </nav>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className={waButton}>
            <WhatsAppMark className="size-4" />
            WhatsApp
          </a>
          <a href={`tel:${registration.phone}`} className={`${callButton} min-h-11 justify-center px-4`}>
            <Phone size={16} aria-hidden />
            Llamar
          </a>
        </div>
      </header>

      <FlashMessage error={search.error} success={search.success} />
      {search.tipo === "abono" && <ObservedNotice client={client} id={search.observado} tipo="abono" />}

      {/* ── Lo que espera una decisión ── */}
      {toReviewCount > 0 && (
        <section aria-labelledby="por-validar" className="rounded-2xl border border-amber-200 bg-[#fffaf0]">
          <h2 id="por-validar" className="px-4 pt-4 text-base font-bold text-[#5c3400] sm:px-5">
            {toReviewCount === 1 ? "1 comprobante por validar" : `${toReviewCount} comprobantes por validar`}
          </h2>
          <ul className="divide-y divide-amber-200/70">
            {initialPending && (
              <li className="space-y-3 px-4 py-4 sm:px-5">
                {reviewHead(isCashInitial ? "Pago inicial en efectivo" : "Pago inicial", registration.amount, registration.created_at, receiptFor("main-receipt"), isCashInitial)}
<div className="lg:max-w-md">
                <ReviewResolutionForm
                  action={review}
                  isInitial
                  id={registration.id}
                  currentStatus={registration.status}
                  view="registrations"
                  returnTo={selfUrl}
                  entityType="comprobante"
                  approveText={`Aprobar S/ ${registration.amount}`}
                />
                </div>
              </li>
            )}
            {pendingPayments.map((p) => {
              const exceeds = p.kind === "additional" && isApproved && totalApproved + p.amount > registration.price;
              return (
                <li key={p.id} className="space-y-3 px-4 py-4 sm:px-5">
                  {reviewHead(paymentLabels.get(p.id) ?? "Abono", p.amount, p.created_at, receiptFor(p.id), p.method === "efectivo")}
                  {p.kind === "replacement" && registration.review_note && (
                    <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-900">Corrige la observación: «{registration.review_note}»</p>
                  )}
                  {exceeds && (
                    <p className="flex items-start gap-2 rounded-xl bg-amber-100/70 px-3 py-2 text-sm text-amber-900">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
                      Supera el saldo pendiente (S/ {remainingBalance}). No se puede aprobar; obsérvalo para que lo corrija.
                    </p>
                  )}
                  {canReviewPayment(p) ? (
                    <div className="lg:max-w-md">
                    <ReviewResolutionForm
                      action={reviewPayment}
                      isInitial={false}
                      id={p.id}
                      registrationId={registration.id}
                      currentStatus={p.status}
                      view="payments"
                      returnTo={selfUrl}
                      entityType="comprobante"
                      approveText={`Aprobar S/ ${p.amount}`}
                      approveBlocked={exceeds}
                    />
                    </div>
                  ) : (
                    <p className="rounded-xl bg-white/80 px-3 py-2 text-sm text-[#5c4a1f]">
                      Primero resuelve el pago inicial: este abono se puede validar cuando la inscripción esté aprobada.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {observedInitial && (
        <section aria-labelledby="observado" className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 sm:p-5">
          <h2 id="observado" className="text-base font-bold text-rose-900">
            Pago inicial observado
          </h2>
          <p className="mt-1 text-sm text-rose-900/85">Falta que {registration.first_name} suba un comprobante corregido desde su cuenta.</p>
          {registration.review_note && (
            <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-[#2c4a47]">«{registration.review_note}»</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {observedWa("tu comprobante de inscripción", registration.review_note) && (
              <a
                href={observedWa("tu comprobante de inscripción", registration.review_note) ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={waButton}
              >
                <WhatsAppMark className="size-4" />
                Avisar por WhatsApp
              </a>
            )}
            {receiptFor("main-receipt") && <CamperReceiptModal receipts={receiptsList} initialReceiptId="main-receipt" triggerLabel="Ver comprobante" />}
          </div>
          <details className="group mt-3 border-t border-rose-200/70">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 pt-1 text-sm font-semibold text-[#2c4a47] [&::-webkit-details-marker]:hidden">
              Aprobar de todos modos o devolver a pendiente
              <ChevronDown size={16} className="ml-auto shrink-0 transition group-open:rotate-180" aria-hidden />
            </summary>
            <div className="pt-1">
              <ReviewResolutionForm
                action={review}
                isInitial
                id={registration.id}
                currentStatus={registration.status}
                initialNote={registration.review_note || ""}
                view="registrations"
                returnTo={selfUrl}
                entityType="comprobante"
              />
            </div>
          </details>
        </section>
      )}

      {/* En celular: cuenta → pagos → datos → entrada → más acciones. En computadora, dos columnas. */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1.4fr_1fr] lg:items-start lg:gap-6">
        <div className="max-lg:contents lg:space-y-6">
          <section aria-labelledby="pagos" className={`${card} max-lg:order-2`}>
            <h2 id="pagos" className="text-base font-bold text-[#0a3039]">
              Pagos
            </h2>
            <ul className="mt-1 divide-y divide-[#eef2ef]">
              {paymentRows.map((r) => (
                <li key={r.key} className="flex items-start gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-semibold text-[#0a3039]">{r.label}</span>
                      <StatusBadge status={r.status} />
                    </p>
                    <p className="mt-0.5 text-xs text-[#6b8580]">{dateTimeFmt.format(new Date(r.date))}</p>
                    {r.note && <p className="mt-1.5 rounded-lg bg-[#f5f3ec] px-2.5 py-1.5 text-xs text-[#5c4a1f]">Nota: {r.note}</p>}
                    {(r.receiptId || r.wa) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {r.receiptId && <CamperReceiptModal receipts={receiptsList} initialReceiptId={r.receiptId} />}
                        {r.wa && (
                          <a href={r.wa} target="_blank" rel="noopener noreferrer" className={`${waButton} min-h-10 px-3`}>
                            <WhatsAppMark className="size-4" />
                            Avisar
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="shrink-0 text-base font-bold tabular-nums text-[#0b2d36]">S/ {r.amount}</p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="datos" className={`${card} max-lg:order-3`}>
            <h2 id="datos" className="text-base font-bold text-[#0a3039]">
              Datos
            </h2>
            <dl className="mt-1 divide-y divide-[#eef2ef]">
              {dataRow("Documento", registration.document)}
              {dataRow(
                "Nacimiento",
                <>
                  {birthText}
                  {age !== null && <span className="font-normal text-[#5f7a75]"> · {age} años en el campamento</span>}
                </>,
              )}
              {dataRow("Género", <span className="capitalize">{registration.gender}</span>)}
              {dataRow(
                "Correo",
                <a href={`mailto:${registration.email}`} className="break-all hover:text-[#007b80] hover:underline">
                  {registration.email}
                </a>,
              )}
              {dataRow(
                "Celular",
                registration.phone,
                <a href={`tel:${registration.phone}`} className={callButton}>
                  <Phone size={15} aria-hidden />
                  Llamar
                </a>,
              )}
              {dataRow(
                "Contacto de emergencia",
                <>
                  {registration.emergency_name}{" "}
                  <span className="font-normal capitalize text-[#5f7a75]">({registration.emergency_relation})</span>
                  <span className="block">{registration.emergency_phone}</span>
                </>,
                <a href={`tel:${registration.emergency_phone}`} className={callButton}>
                  <Phone size={15} aria-hidden />
                  Llamar
                </a>,
              )}
            </dl>
          </section>

          <section aria-labelledby="mas-acciones" className="overflow-hidden rounded-2xl border border-[#e2e8e4] bg-white max-lg:order-5">
            <h2 id="mas-acciones" className="px-4 pb-2 pt-4 text-base font-bold text-[#0a3039] sm:px-5">
              Más acciones
            </h2>
            <div className="divide-y divide-[#eef2ef] border-t border-[#eef2ef]">
              <RegistrationDataForm registration={registration} />

              {history.length > 0 && (
                <details className="group">
                  <summary className={rowSummary}>
                    <History size={17} className="shrink-0 text-[#0a524a]" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[#0a3039]">Historial de cambios</span>
                      <span className="block text-xs text-[#5f7a75]">
                        {history.length === 1 ? "1 registro" : `${history.length} registros`}: revisiones y datos editados
                      </span>
                    </span>
                    <ChevronDown size={16} className="shrink-0 text-[#7d948f] transition group-open:rotate-180" aria-hidden />
                  </summary>
                  <ul className="divide-y divide-[#eef2ef] px-4 pb-3 sm:px-5">
                    {history.map((event) => (
                      <li key={event.id} className="py-2.5 text-sm">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-semibold text-[#0a3039]">
                            {event.payment_id ? (paymentLabels.get(event.payment_id) ?? "Abono") : "Pago inicial"}
                          </span>
                          <span className="shrink-0 text-xs text-[#6b8580]">{dateTimeFmt.format(new Date(event.created_at))}</span>
                        </div>
                        {event.old_status !== event.new_status && (
                          <p className="text-[#4d6a64]">
                            {statusLabels[event.old_status] ?? event.old_status} → {statusLabels[event.new_status] ?? event.new_status}
                          </p>
                        )}
                        {event.note && <p className="mt-1 rounded-lg bg-[#f3f6f4] px-2.5 py-1.5 text-xs text-[#2c4a47]">{event.note}</p>}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {isApproved && isMaster && (
                <details className="group">
                  <summary className={rowSummary}>
                    <RotateCcw size={17} className="shrink-0 text-[#0a524a]" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[#0a3039]">Cambiar estado del pago inicial</span>
                      <span className="block text-xs text-[#5f7a75]">Para observarlo o devolverlo a pendiente si se aprobó por error.</span>
                    </span>
                    <ChevronDown size={16} className="shrink-0 text-[#7d948f] transition group-open:rotate-180" aria-hidden />
                  </summary>
                  <div className="px-4 pb-4 sm:px-5">
                    <ReviewResolutionForm
                      action={review}
                      isInitial
                      id={registration.id}
                      currentStatus={registration.status}
                      view="registrations"
                      returnTo={selfUrl}
                      entityType="comprobante"
                    />
                  </div>
                </details>
              )}

              {isMaster && (
                <details className="group">
                  <summary className={rowSummary}>
                    <Trash2 size={17} className="shrink-0 text-red-700" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-red-800">Eliminar inscripción</span>
                      <span className="block text-xs text-[#5f7a75]">Solo la cuenta maestra. No se puede deshacer.</span>
                    </span>
                    <ChevronDown size={16} className="shrink-0 text-[#7d948f] transition group-open:rotate-180" aria-hidden />
                  </summary>
                  <form action={deleteRegistration} className="space-y-3 px-4 pb-4 sm:px-5">
                    <input type="hidden" name="id" value={registration.id} />
                    <p className="text-sm text-[#4d6a64]">
                      Borra la inscripción con sus abonos, historial e ingresos. La cuenta de Google sigue existiendo y podrá volver a
                      inscribirse. Se guarda una copia interna de lo eliminado.
                    </p>
                    <ConfirmSubmitButton
                      message={`¿Eliminar la inscripción de ${registration.first_name} ${registration.last_name}? Se borran sus abonos e historial y no se puede deshacer.`}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-bold text-white transition hover:bg-red-800 sm:w-auto"
                    >
                      Eliminar inscripción
                    </ConfirmSubmitButton>
                  </form>
                </details>
              )}
            </div>
          </section>
        </div>

        <div className="max-lg:contents lg:space-y-6">
          <section aria-labelledby="cuenta" className={`${card} max-lg:order-1`}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="cuenta" className="text-base font-bold text-[#0a3039]">
                Estado de cuenta
              </h2>
              <span className="text-sm text-[#5f7a75]">
                <span className="capitalize">{registration.plan}</span> · S/ {registration.price}
              </span>
            </div>
            {isApproved ? (
              <>
                <p className={`mt-3 text-2xl font-black tabular-nums tracking-tight ${remainingBalance > 0 ? "text-[#8a4b07]" : "text-emerald-700"}`}>
                  {remainingBalance > 0 ? `Debe S/ ${remainingBalance}` : "Pagó completo"}
                </p>
                <div
                  className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf3f0]"
                  role="progressbar"
                  aria-label="Pagado del total"
                  aria-valuemin={0}
                  aria-valuemax={registration.price}
                  aria-valuenow={totalApproved}
                >
                  <div className="h-full rounded-full bg-[#0f8f87]" style={{ width: `${paidPercent}%` }} />
                </div>
                <p className="mt-2 text-sm text-[#4d6a64]">
                  Pagó S/ {totalApproved} de S/ {registration.price}
                  {pendingAmount > 0 && (
                    <>
                      {" · "}
                      <span className="font-semibold text-sky-800">S/ {pendingAmount} por validar</span>
                    </>
                  )}
                </p>
              </>
            ) : (
              <>
                <p className="mt-3 text-lg font-bold text-[#0a3039]">
                  {initialPending ? "Pago inicial por validar" : hasPendingReplacement ? "Comprobante corregido por validar" : "Pago inicial observado"}
                </p>
                <p className="mt-1 text-sm text-[#4d6a64]">
                  Declaró S/ {registration.amount} de S/ {registration.price}. El saldo se confirma al aprobar el pago inicial.
                </p>
              </>
            )}
            <CashPaymentForm collapsible registrationId={registration.id} approved={isApproved} remaining={remainingBalance} price={registration.price} />
          </section>

          <section aria-labelledby="entrada" className={`${card} max-lg:order-4`}>
            <h2 id="entrada" className="text-base font-bold text-[#0a3039]">
              Entrada al campamento
            </h2>
            {ticket ? (
              <>
                <div className="mt-3 flex items-start gap-4">
                  <div
                    className={`size-20 shrink-0 rounded-lg border border-[#e2e8e4] p-1.5 [&_svg]:size-full ${ticket.state === "active" ? "" : "opacity-30"}`}
                    role="img"
                    aria-label={`Código QR de la entrada ${formatTicketCode(ticket.code)}`}
                    dangerouslySetInnerHTML={{ __html: ticket.svg }}
                  />
                  <div className="min-w-0 text-sm">
                    <p className="font-mono font-bold tracking-wider text-[#082e39]">{formatTicketCode(ticket.code)}</p>
                    <p className="mt-0.5 text-[#4d6a64]">
                      {ticket.state === "active"
                        ? "Entrada activa"
                        : ticket.state === "rejected"
                          ? "Bloqueada: pago observado"
                          : "Se activa al aprobar el pago inicial"}
                    </p>
                    {lastCheckIn ? (
                      <p className="mt-2 flex items-start gap-1.5 font-semibold text-emerald-800">
                        <BadgeCheck size={16} className="mt-0.5 shrink-0" aria-hidden />
                        <span>
                          Ingresó el {dateTimeFmt.format(new Date(lastCheckIn.created_at))}, registrado por {actorLabel(lastCheckIn.actor_id)}
                          {checkIns.length > 1 && ` (${checkIns.length} registros)`}.
                        </span>
                      </p>
                    ) : (
                      <p className="mt-2 flex items-center gap-1.5 text-[#5f7a75]">
                        <Clock3 size={15} className="shrink-0" aria-hidden />
                        Aún no ingresa al campamento.
                      </p>
                    )}
                  </div>
                </div>
                <Link
                  href={`/admin/escaner?c=${ticket.code}`}
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#082f39] px-4 text-sm font-bold text-white transition hover:bg-[#0b4248] sm:w-auto"
                >
                  {lastCheckIn ? <ScanLine size={16} aria-hidden /> : <DoorOpen size={16} aria-hidden />}
                  {lastCheckIn ? "Abrir en el escáner" : "Registrar ingreso"}
                </Link>
              </>
            ) : (
              <p className="mt-2 text-sm text-[#5f7a75]">Esta inscripción no tiene código de entrada.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
