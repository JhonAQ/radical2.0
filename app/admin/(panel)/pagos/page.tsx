import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import {
  statusLabels,
  errorMessages,
  successMessages,
  adminInputClass,
  adminButtonClass,
  type Registration,
  type RegistrationPayment,
} from "../../types";
import { review, reviewPayment } from "../../actions";
import { ExportPanel } from "../../components/ExportPanel";
import { ReceiptViewer } from "../../components/ReceiptViewer";
import { ReviewResolutionForm } from "../../components/ReviewResolutionForm";
import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Clock,
  X,
  ExternalLink,
  MessageCircle,
  User,
  Wallet,
  CheckCheck,
} from "lucide-react";

const PAGE_SIZE = 30;

export default async function AdminPagosPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    q?: string;
    page?: string;
    review?: string;
    kind?: "initial" | "additional";
    error?: string;
    success?: string;
  }>;
}) {
  const params = await searchParams;
  const client = createClient(await cookies());

  const page = Math.max(1, parseInt(params.page || "1", 10));

  // ── Registrations lookup (lightweight: only needed fields) ──
  const { data: rawRows } = await client
    .from("registrations")
    .select("id,first_name,last_name,email,amount,status,created_at,plan,phone,receipt_path,review_note");
  const registrationMap: Record<string, any> = Object.fromEntries(
    ((rawRows as any[]) || []).map((r) => [r.id, r]),
  );

  // ── Payment items query ──
  let paymentsQuery = client
    .from("registration_payments")
    .select("id,registration_id,amount,status,kind,created_at,receipt_path,review_note")
    .order("created_at", { ascending: false });

  if (params.status && params.status !== "all") {
    paymentsQuery = paymentsQuery.eq("status", params.status);
  }

  const { data: rawPayments } = await paymentsQuery.limit(2000);
  const payments = (rawPayments as (RegistrationPayment & { receipt_path?: string })[]) || [];

  // Build unified list (initial + additional)
  type UnifiedItem = {
    id: string;
    registrationId: string;
    kindRaw: "initial" | "additional";
    name: string;
    email: string;
    phone: string;
    plan: string;
    amount: number;
    status: string;
    kind: string;
    date: string;
    reviewNote?: string;
  };

  const unified: UnifiedItem[] = [];

  // Initial registrations
  for (const reg of Object.values(registrationMap)) {
    if (params.status && params.status !== "all" && reg.status !== params.status) continue;
    unified.push({
      id: reg.id,
      registrationId: reg.id,
      kindRaw: "initial",
      name: `${reg.last_name}, ${reg.first_name}`,
      email: reg.email,
      phone: reg.phone || "",
      plan: reg.plan || "",
      amount: reg.amount,
      status: reg.status,
      kind: "Abono inicial",
      date: reg.created_at,
      reviewNote: reg.review_note || "",
    });
  }

  // Additional payments
  for (const p of payments) {
    if (p.kind === "replacement" && p.status === "approved") continue;
    const reg = registrationMap[p.registration_id];
    unified.push({
      id: p.id,
      registrationId: p.registration_id,
      kindRaw: "additional",
      name: reg ? `${reg.last_name}, ${reg.first_name}` : "Participante",
      email: reg?.email || "",
      phone: reg?.phone || "",
      plan: reg?.plan || "",
      amount: p.amount,
      status: p.status,
      kind: p.kind === "replacement" ? "Comprobante corregido" : "Abono adicional",
      date: p.created_at,
      reviewNote: p.review_note || "",
    });
  }

  // Calculate totals for quick metrics
  const totalPendingCount = unified.filter((i) => i.status === "pending").length;
  const totalPendingAmount = unified
    .filter((i) => i.status === "pending")
    .reduce((acc, i) => acc + i.amount, 0);
  const totalApprovedCount = unified.filter((i) => i.status === "approved").length;

  // Apply search filter
  const filtered = params.q
    ? unified.filter((p) =>
        `${p.name} ${p.email}`
          .toLowerCase()
          .includes(params.q!.toLowerCase()),
      )
    : unified;

  // Sort by date descending
  filtered.sort((a, b) => b.date.localeCompare(a.date));

  // Paginate
  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const paginatedItems = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  function buildHref(overrides: Record<string, string | undefined>) {
    const merged = {
      q: params.q,
      status: params.status,
      page: String(page),
      ...overrides,
    };
    const qs = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== "all" && !(k === "page" && v === "1")) qs.set(k, v);
    });
    return `/admin/pagos${qs.toString() ? `?${qs.toString()}` : ""}`;
  }

  // ── If a review modal is requested, fetch and sign the receipt ──
  let activeReviewData: {
    isInitial: boolean;
    id: string;
    registrationId: string;
    name: string;
    email: string;
    phone: string;
    plan: string;
    amount: number;
    status: string;
    kind: string;
    date: string;
    note: string;
    receiptUrl: string;
    waUrl: string;
  } | null = null;

  if (params.review) {
    const isInitial = params.kind === "initial";
    if (isInitial) {
      const reg = registrationMap[params.review];
      if (reg && reg.receipt_path) {
        const { data: signed } = await client.storage
          .from("registration-receipts")
          .createSignedUrl(reg.receipt_path, 600);

        if (signed?.signedUrl) {
          const cleanPhone = (reg.phone || "").replace(/\D/g, "");
          const waNumber = cleanPhone.length === 9 ? `51${cleanPhone}` : cleanPhone;
          const waMessage = encodeURIComponent(
            `Hola ${reg.first_name}, te escribimos del equipo de Radical 2.0 respecto a tu comprobante de inscripción.`,
          );

          activeReviewData = {
            isInitial: true,
            id: reg.id,
            registrationId: reg.id,
            name: `${reg.first_name} ${reg.last_name}`,
            email: reg.email,
            phone: reg.phone,
            plan: reg.plan,
            amount: reg.amount,
            status: reg.status,
            kind: "Abono inicial de inscripción",
            date: reg.created_at,
            note: reg.review_note || "",
            receiptUrl: signed.signedUrl,
            waUrl: `https://wa.me/${waNumber}?text=${waMessage}`,
          };
        }
      }
    } else {
      const pay = payments.find((p) => p.id === params.review);
      if (pay && pay.receipt_path) {
        const reg = registrationMap[pay.registration_id];
        const { data: signed } = await client.storage
          .from("registration-receipts")
          .createSignedUrl(pay.receipt_path, 600);

        if (signed?.signedUrl) {
          const cleanPhone = (reg?.phone || "").replace(/\D/g, "");
          const waNumber = cleanPhone.length === 9 ? `51${cleanPhone}` : cleanPhone;
          const waMessage = encodeURIComponent(
            `Hola ${reg?.first_name || ""}, te escribimos del equipo de Radical 2.0 respecto a tu abono adicional de S/ ${pay.amount}.`,
          );

          activeReviewData = {
            isInitial: false,
            id: pay.id,
            registrationId: pay.registration_id,
            name: reg ? `${reg.first_name} ${reg.last_name}` : "Participante",
            email: reg?.email || "",
            phone: reg?.phone || "",
            plan: reg?.plan || "",
            amount: pay.amount,
            status: pay.status,
            kind: pay.kind === "replacement" ? "Comprobante de reemplazo" : "Abono adicional",
            date: pay.created_at,
            note: pay.review_note || "",
            receiptUrl: signed.signedUrl,
            waUrl: `https://wa.me/${waNumber}?text=${waMessage}`,
          };
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a3039]">
            Validación de comprobantes
          </h1>
          <p className="mt-1 text-sm text-[#5f7a75]">
            Bandeja de tesorería para auditar y confirmar abonos bancarios.
          </p>
        </div>

        <ExportPanel />
      </div>

      {/* ── Metric Summary Tiles ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          className={`rounded-xl border p-4 shadow-sm ${
            totalPendingCount > 0
              ? "border-amber-200 bg-[#fffdf9]"
              : "border-[#e2e8e4] bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#657d77]">
              Comprobantes por revisar
            </span>
            <span
              className={`grid size-7 place-items-center rounded-md ${
                totalPendingCount > 0
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <Clock size={15} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#0a3039]">
            {totalPendingCount}
          </p>
          <p className="text-[11px] text-[#7d948f]">En cola de auditoría</p>
        </div>

        <div className="rounded-xl border border-[#e2e8e4] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#657d77]">
              Monto pendiente por confirmar
            </span>
            <span className="grid size-7 place-items-center rounded-md bg-[#eaf3f0] text-[#0a524a]">
              <Wallet size={15} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#0a3039]">
            S/ {totalPendingAmount}
          </p>
          <p className="text-[11px] text-[#7d948f]">Suma de comprobantes pendientes</p>
        </div>

        <div className="rounded-xl border border-[#e2e8e4] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#657d77]">
              Comprobantes aprobados
            </span>
            <span className="grid size-7 place-items-center rounded-md bg-emerald-50 text-emerald-700">
              <CheckCheck size={15} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#0a3039]">
            {totalApprovedCount}
          </p>
          <p className="text-[11px] text-[#7d948f]">Dinero confirmado en cuenta</p>
        </div>
      </div>

      {/* ── Notifications ── */}
      {(params.error || params.success) && (
        <div
          role="status"
          className={`rounded-xl px-5 py-3.5 text-sm font-semibold ${
            params.error
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-teal-50 text-teal-900 border border-teal-200"
          }`}
        >
          {params.error
            ? errorMessages[params.error] || "Ocurrió un error al procesar el comprobante."
            : successMessages[params.success || "Operación completada exitosamente."]}
        </div>
      )}

      {/* ── Table Card ── */}
      <section className="rounded-xl border border-[#e2e8e4] bg-white p-5 shadow-sm sm:p-6">
        {/* Quick Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link
              href={buildHref({ status: "pending", page: "1" })}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                params.status === "pending" || (!params.status && totalPendingCount > 0)
                  ? "bg-amber-100 text-amber-900 font-bold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Pendientes ({totalPendingCount})
            </Link>
            <Link
              href={buildHref({ status: "approved", page: "1" })}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                params.status === "approved"
                  ? "bg-emerald-100 text-emerald-900 font-bold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Aprobados ({totalApprovedCount})
            </Link>
            <Link
              href={buildHref({ status: "rejected", page: "1" })}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                params.status === "rejected"
                  ? "bg-red-100 text-red-900 font-bold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Observados
            </Link>
            <Link
              href={buildHref({ status: "all", page: "1" })}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                params.status === "all"
                  ? "bg-[#0a4249] text-white font-bold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todos ({unified.length})
            </Link>
          </div>

          {/* Search */}
          <form className="flex items-center gap-2" method="GET">
            {params.status && <input type="hidden" name="status" value={params.status} />}
            <div className="relative min-w-[200px]">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                name="q"
                defaultValue={params.q}
                placeholder="Buscar participante..."
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#008e95]"
              />
            </div>
            {params.q && (
              <Link
                href={buildHref({ q: undefined })}
                className="text-xs text-slate-500 hover:underline"
              >
                Limpiar
              </Link>
            )}
          </form>
        </div>

        {/* Results summary */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>
            Mostrando <strong>{paginatedItems.length}</strong> de{" "}
            <strong>{totalCount}</strong> comprobantes
          </span>
          {totalPages > 1 && (
            <span>
              Página <strong>{page}</strong> de <strong>{totalPages}</strong>
            </span>
          )}
        </div>

        {/* Table */}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[660px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-3 pr-4">Participante</th>
                <th className="pr-4">Concepto</th>
                <th className="pr-4">Monto declarado</th>
                <th className="pr-4">Estado</th>
                <th className="pr-4">Fecha</th>
                <th className="text-right">Acción de tesorería</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((p) => {
                const isPending = p.status === "pending";

                return (
                  <tr
                    key={`${p.kindRaw}-${p.id}`}
                    className={`border-b border-slate-100 transition hover:bg-slate-50/70 ${
                      isPending ? "bg-[#fffdfa]" : ""
                    }`}
                  >
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2">
                        <b className="text-sm font-semibold text-[#082e39]">{p.name}</b>
                        <Link
                          href={`/admin/inscripciones/${p.registrationId}`}
                          title="Ver ficha del participante"
                          className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-[#008e95]"
                        >
                          <User size={13} />
                        </Link>
                      </div>
                      <div className="text-xs text-slate-400">{p.email}</div>
                    </td>
                    <td className="pr-4 font-medium text-xs text-slate-700">
                      {p.kind}
                    </td>
                    <td className="pr-4">
                      <span className="text-sm font-bold text-[#0b2d36]">
                        S/ {p.amount}
                      </span>
                    </td>
                    <td className="pr-4">
                      <span
                        className={`rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                          p.status === "approved"
                            ? "bg-emerald-50 text-emerald-800"
                            : p.status === "rejected"
                              ? "bg-red-50 text-red-800"
                              : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {statusLabels[p.status] || p.status}
                      </span>
                    </td>
                    <td className="pr-4 text-xs text-slate-500">
                      {new Date(p.date).toLocaleDateString("es-PE", {
                        dateStyle: "short",
                        timeZone: "America/Lima",
                      })}
                    </td>
                    <td className="text-right">
                      <Link
                        href={buildHref({
                          review: p.id,
                          kind: p.kindRaw,
                        })}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
                          isPending
                            ? "bg-[#008e87] text-white hover:bg-[#007670]"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{isPending ? "Validar comprobante" : "Ver comprobante"}</span>
                        <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {paginatedItems.length === 0 && (
            <div className="py-16 text-center text-sm text-slate-500">
              No hay comprobantes que coincidan con los filtros aplicados.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
            {page > 1 ? (
              <Link
                href={buildHref({ page: String(page - 1) })}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <ChevronLeft size={14} />
                <span>Anterior</span>
              </Link>
            ) : null}

            {page < totalPages ? (
              <Link
                href={buildHref({ page: String(page + 1) })}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <span>Siguiente</span>
                <ChevronRight size={14} />
              </Link>
            ) : null}
          </div>
        )}
      </section>

      {/* ── Dedicated Validation Modal (Mesa de Trabajo de Tesorería) ── */}
      {activeReviewData && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#03232b]/70 p-3 sm:p-6"
        >
          <div className="relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-[#fbfcfb] px-6 py-3.5">
              <div>
                <h3 className="text-base font-bold text-[#082e39]">
                  {activeReviewData.name} — {activeReviewData.kind}
                </h3>
                <p className="text-xs text-slate-500">
                  Verificación de comprobante bancario
                </p>
              </div>
              <Link
                href={buildHref({ review: undefined, kind: undefined })}
                className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar modal"
              >
                <X size={17} />
              </Link>
            </div>

            {/* Modal Body: Split Screen */}
            <div className="grid flex-1 overflow-y-auto lg:grid-cols-[1.1fr_1fr]">
              {/* Left: Receipt Viewer with zoom and rotate */}
              <div className="bg-[#0b2730] p-4 flex flex-col justify-center">
                <ReceiptViewer
                  receipts={[
                    {
                      id: activeReviewData.id,
                      label: activeReviewData.kind,
                      url: activeReviewData.receiptUrl,
                      amount: activeReviewData.amount,
                    },
                  ]}
                />
              </div>

              {/* Right: Transfer details and action form */}
              <div className="flex flex-col justify-between p-6 bg-white space-y-5">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-[#082e39]">
                      Detalles de la transferencia
                    </h4>
                    <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Participante:</span>
                        <span className="font-bold text-slate-900">{activeReviewData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Monto declarado:</span>
                        <span className="text-base font-black text-[#0b2d36]">
                          S/ {activeReviewData.amount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Plan:</span>
                        <span className="font-semibold capitalize text-slate-800">
                          {activeReviewData.plan}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Fecha de envío:</span>
                        <span className="text-slate-700">
                          {new Date(activeReviewData.date).toLocaleString("es-PE", {
                            timeZone: "America/Lima",
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & WhatsApp link */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <a
                      href={activeReviewData.waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#128C7E] hover:underline"
                    >
                      <MessageCircle size={14} />
                      <span>Contactar al participante por WhatsApp</span>
                    </a>

                    <Link
                      href={`/admin/inscripciones/${activeReviewData.registrationId}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 hover:underline"
                    >
                      <span>Ver ficha completa</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>

                  {/* Form with interactive approval lock and conditional reversion */}
                  <div className="border-t border-slate-100 pt-4">
                    <ReviewResolutionForm
                      action={activeReviewData.isInitial ? review : reviewPayment}
                      isInitial={activeReviewData.isInitial}
                      id={activeReviewData.id}
                      registrationId={activeReviewData.registrationId}
                      currentStatus={activeReviewData.status}
                      initialNote={activeReviewData.note}
                      view="payments"
                      returnTo={buildHref({ review: undefined, kind: undefined })}
                      closeUrl={buildHref({ review: undefined, kind: undefined })}
                      entityType="comprobante"
                    />
                  </div>
                </div>

                <div className="text-center pt-2">
                  <Link
                    href={buildHref({ review: undefined, kind: undefined })}
                    className="text-xs text-slate-400 hover:text-slate-600 hover:underline"
                  >
                    Volver a la bandeja de comprobantes
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
