import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { CamperReceiptModal } from "../../../components/CamperReceiptModal";
import { ReviewResolutionForm } from "../../../components/ReviewResolutionForm";
import { review, reviewPayment } from "../../../actions";
import {
  statusLabels,
  errorMessages,
  successMessages,
  adminInputClass,
  type Registration,
  type RegistrationPayment,
  type ReviewEvent,
} from "../../../types";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Phone,
  Mail,
  User,
  ShieldAlert,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  Wallet,
} from "lucide-react";

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

  // Fetch registration
  const { data: rawRegistration, error: regError } = await client
    .from("registrations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (regError || !rawRegistration) {
    notFound();
  }

  const registration = rawRegistration as Registration;

  // Fetch payments, audit history, and next/prev registrations in parallel
  const [
    { data: rawPayments },
    { data: rawHistory },
    { data: prevReg },
    { data: nextReg },
  ] = await Promise.all([
    client
      .from("registration_payments")
      .select("*")
      .eq("registration_id", id)
      .order("created_at", { ascending: false }),
    client
      .from("registration_review_events")
      .select("id,payment_id,created_at,old_status,new_status,note")
      .eq("registration_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
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

  // Generate signed URLs for all receipts
  const receiptsList: Array<{
    id: string;
    label: string;
    url: string;
    amount?: number;
    kind?: string;
    status?: string;
  }> = [];

  // Main receipt
  if (registration.receipt_path) {
    const { data: mainReceiptUrl } = await client.storage
      .from("registration-receipts")
      .createSignedUrl(registration.receipt_path, 600);

    if (mainReceiptUrl?.signedUrl) {
      receiptsList.push({
        id: "main-receipt",
        label: "Comprobante inicial",
        url: mainReceiptUrl.signedUrl,
        amount: registration.amount,
        status: registration.status,
      });
    }
  }

  // Original receipt if replaced
  if (
    registration.original_receipt_path &&
    registration.original_receipt_path !== registration.receipt_path
  ) {
    const { data: originalUrl } = await client.storage
      .from("registration-receipts")
      .createSignedUrl(registration.original_receipt_path, 600);

    if (originalUrl?.signedUrl) {
      receiptsList.push({
        id: "original-receipt",
        label: "Voucher original (reemplazado)",
        url: originalUrl.signedUrl,
      });
    }
  }

  // Additional payment receipts
  for (const [index, p] of payments.entries()) {
    if (p.receipt_path) {
      const { data: payUrl } = await client.storage
        .from("registration-receipts")
        .createSignedUrl(p.receipt_path, 600);

      if (payUrl?.signedUrl) {
        receiptsList.push({
          id: p.id,
          label:
            p.kind === "replacement"
              ? `Reemplazo #${index + 1}`
              : `Abono S/ ${p.amount}`,
          url: payUrl.signedUrl,
          amount: p.amount,
          kind: p.kind,
          status: p.status,
        });
      }
    }
  }

  // Calculate finances
  const totalApproved =
    registration.amount +
    payments
      .filter((p) => p.kind === "additional" && p.status === "approved")
      .reduce((n, p) => n + p.amount, 0);

  const pendingAmount = payments
    .filter((p) => p.kind === "additional" && p.status === "pending")
    .reduce((n, p) => n + p.amount, 0);

  const remainingBalance = Math.max(0, registration.price - totalApproved);

  // Clean WhatsApp number
  const cleanPhone = registration.phone.replace(/\D/g, "");
  const waNumber = cleanPhone.length === 9 ? `51${cleanPhone}` : cleanPhone;
  const waMessage = encodeURIComponent(
    `Hola ${registration.first_name}, te escribimos del equipo del campamento Radical 2.0 respecto a tu inscripción.`,
  );
  const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3.5">
          <Link
            href="/admin/inscripciones"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft size={14} />
            <span>Padrón</span>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-[#082e39]">
                {registration.first_name} {registration.last_name}
              </h1>
              <span
                className={`rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                  registration.status === "approved"
                    ? "bg-emerald-50 text-emerald-800"
                    : registration.status === "rejected"
                      ? "bg-red-50 text-red-800"
                      : "bg-amber-50 text-amber-800"
                }`}
              >
                {statusLabels[registration.status] || registration.status}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Registrado el{" "}
              {new Date(registration.created_at).toLocaleDateString("es-PE", {
                dateStyle: "medium",
                timeZone: "America/Lima",
              })}
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2">
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#20ba59]"
          >
            <MessageCircle size={14} />
            <span className="hidden sm:inline">Escribir por WhatsApp</span>
            <span className="sm:hidden">WhatsApp</span>
          </a>

          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            {prevReg ? (
              <Link
                href={`/admin/inscripciones/${prevReg.id}`}
                title={`Anterior: ${prevReg.first_name}`}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <ChevronLeft size={14} />
                <span className="hidden sm:inline">Anterior</span>
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-300">
                <ChevronLeft size={14} />
              </span>
            )}

            {nextReg ? (
              <Link
                href={`/admin/inscripciones/${nextReg.id}`}
                title={`Siguiente: ${nextReg.first_name}`}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight size={14} />
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-300">
                <ChevronRight size={14} />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {(search.error || search.success) && (
        <div
          role="status"
          className={`rounded-xl px-5 py-3.5 text-sm font-semibold ${
            search.error
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-teal-50 text-teal-900 border border-teal-200"
          }`}
        >
          {search.error
            ? errorMessages[search.error] || "Ocurrió un error."
            : successMessages[search.success || ""]}
        </div>
      )}

      {/* ── 2-Column Ficha Layout ── */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* ── Left Column: Camper Details & Payment History ── */}
        <div className="space-y-6">
          {/* Card 1: Datos Personales */}
          <section className="rounded-xl border border-[#e2e8e4] bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#082e39]">
              Datos del participante
            </h2>

            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
              <div className="border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Documento de identidad</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                  {registration.document}
                </dd>
              </div>

              <div className="border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Fecha de nacimiento</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                  {registration.birth_date}
                </dd>
              </div>

              <div className="border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Género</dt>
                <dd className="mt-0.5 text-sm font-semibold capitalize text-slate-900">
                  {registration.gender}
                </dd>
              </div>

              <div className="border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Correo electrónico</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-900 truncate">
                  <a
                    href={`mailto:${registration.email}`}
                    className="hover:text-[#008e95] hover:underline"
                  >
                    {registration.email}
                  </a>
                </dd>
              </div>

              <div className="sm:col-span-2 border-b border-slate-100 pb-2 flex items-center justify-between">
                <div>
                  <dt className="text-slate-500">Teléfono personal</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                    {registration.phone}
                  </dd>
                </div>
                <a
                  href={`tel:${registration.phone}`}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                >
                  <Phone size={12} />
                  <span>Llamar</span>
                </a>
              </div>
            </dl>
          </section>

          {/* Card 2: Contacto de Emergencia */}
          <section className="rounded-xl border border-[#e2e8e4] bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#082e39]">
                  Contacto de emergencia
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Persona a contactar en caso de imprevisto durante el campamento
                </p>
              </div>
              <a
                href={`tel:${registration.emergency_phone}`}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-[#0a4249] shadow-sm hover:bg-slate-50"
              >
                <Phone size={13} />
                <span>Llamar</span>
              </a>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg bg-slate-50/70 p-3.5 text-xs">
              <div>
                <span className="text-slate-500">Nombre del contacto:</span>
                <p className="mt-0.5 text-sm font-bold text-slate-900">
                  {registration.emergency_name}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Parentesco / Relación:</span>
                <p className="mt-0.5 text-sm font-semibold capitalize text-slate-900">
                  {registration.emergency_relation}
                </p>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500">Teléfono de emergencia:</span>
                <p className="mt-0.5 text-sm font-bold text-[#0a4249]">
                  {registration.emergency_phone}
                </p>
              </div>
            </div>
          </section>

          {/* Card 3: Historial de Abonos y Comprobantes */}
          <section className="rounded-xl border border-[#e2e8e4] bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-[#082e39]">
                  Historial de pagos y comprobantes
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Comprobantes registrados para este participante
                </p>
              </div>
              <Link
                href={`/admin/pagos?q=${encodeURIComponent(registration.email)}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#008e95] hover:underline"
              >
                <span>Abrir en tesorería</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {/* Abono inicial */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-200 bg-[#fafcfb] p-3.5 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      Abono inicial de inscripción
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                        registration.status === "approved"
                          ? "bg-emerald-50 text-emerald-800"
                          : registration.status === "rejected"
                            ? "bg-red-50 text-red-800"
                            : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {statusLabels[registration.status] || registration.status}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-500">
                    Monto: <strong className="text-slate-800">S/ {registration.amount}</strong> · Registrado el{" "}
                    {new Date(registration.created_at).toLocaleDateString("es-PE")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <CamperReceiptModal
                    receipts={receiptsList}
                    initialReceiptId="main-receipt"
                    triggerLabel="Ver comprobante"
                  />
                </div>
              </div>

              {/* Abonos adicionales */}
              {payments.map((p, index) => (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-200 bg-[#fafcfb] p-3.5 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {p.kind === "replacement"
                          ? `Comprobante de reemplazo #${index + 1}`
                          : `Abono adicional #${index + 1}`}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                          p.status === "approved"
                            ? "bg-emerald-50 text-emerald-800"
                            : p.status === "rejected"
                              ? "bg-red-50 text-red-800"
                              : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {statusLabels[p.status] || p.status}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-500">
                      Monto: <strong className="text-slate-800">S/ {p.amount}</strong> · Registrado el{" "}
                      {new Date(p.created_at).toLocaleDateString("es-PE")}
                    </p>
                    {p.review_note && (
                      <p className="mt-1 text-xs text-amber-900 bg-amber-50 rounded px-2 py-1">
                        Nota: {p.review_note}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <CamperReceiptModal
                      receipts={receiptsList}
                      initialReceiptId={p.id}
                      triggerLabel="Ver comprobante"
                    />
                  </div>
                </div>
              ))}

              {payments.length === 0 && (
                <p className="py-2 text-xs text-slate-400">
                  No hay abonos adicionales registrados para este campista.
                </p>
              )}
            </div>
          </section>

          {/* Card 4: Bitácora de Auditoría */}
          {history.length > 0 && (
            <details className="rounded-xl border border-slate-200 bg-white p-4 text-xs shadow-sm">
              <summary className="cursor-pointer font-bold text-slate-700">
                Historial de auditoría y notas ({history.length} eventos)
              </summary>
              <ul className="mt-3 divide-y divide-slate-100">
                {history.map((event) => (
                  <li key={event.id} className="py-2.5">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-medium text-slate-700">
                        {event.payment_id ? "Abono adicional" : "Inscripción inicial"}
                      </span>
                      <span>
                        {new Date(event.created_at).toLocaleString("es-PE", {
                          timeZone: "America/Lima",
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <p className="mt-0.5 font-semibold text-slate-800">
                      Estado: {statusLabels[event.new_status] || event.new_status}
                    </p>
                    {event.note && (
                      <p className="mt-1 rounded bg-slate-50 p-2 text-slate-600">
                        {event.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>

        {/* ── Right Column: Finances & Registration Resolution ── */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <section className="rounded-xl border border-[#e2e8e4] bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#082e39]">
                Estado de cuenta
              </h2>
              <span className="text-xs font-semibold capitalize text-slate-500">
                Plan {registration.plan}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Costo del plan:</span>
                <span className="text-sm font-bold text-slate-800">
                  S/ {registration.price}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Total pagado aprobado:</span>
                <span className="text-sm font-bold text-emerald-700">
                  S/ {totalApproved}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="font-semibold text-slate-700">Saldo pendiente:</span>
                <span
                  className={`text-base font-black ${
                    remainingBalance > 0 ? "text-amber-700" : "text-emerald-700"
                  }`}
                >
                  S/ {remainingBalance}
                </span>
              </div>

              {remainingBalance === 0 ? (
                <div className="mt-2 rounded-lg bg-emerald-50 p-2.5 text-center text-xs font-semibold text-emerald-800">
                  ¡Inscripción 100% cancelada!
                </div>
              ) : (
                <div className="mt-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900">
                  Pendiente de abonar S/ {remainingBalance} para liquidar el total.
                </div>
              )}

              {pendingAmount > 0 && (
                <div className="rounded-lg bg-blue-50 p-2.5 text-xs font-medium text-blue-900">
                  Hay S/ {pendingAmount} en abonos por revisar en tesorería.
                </div>
              )}
            </div>
          </section>

          {/* Registration Resolution Form */}
          <section className="rounded-xl border border-[#e2e8e4] bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#082e39]">
              Resolución de la inscripción
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Modificar el estado general del campista en el sistema
            </p>

            <div className="mt-4">
              <ReviewResolutionForm
                action={review}
                isInitial={true}
                id={registration.id}
                currentStatus={registration.status}
                initialNote={registration.review_note || ""}
                view="registrations"
                returnTo={`/admin/inscripciones/${registration.id}`}
                closeUrl="/admin/inscripciones"
                entityType="inscripcion"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
