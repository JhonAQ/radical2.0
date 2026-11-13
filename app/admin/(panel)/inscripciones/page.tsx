import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { AdminDialog } from "../../AdminDialog";
import {
  statusLabels,
  errorMessages,
  successMessages,
  adminInputClass,
  adminButtonClass,
  type Registration,
  type RegistrationPayment,
  type ReviewEvent,
} from "../../types";
import { review, reviewPayment } from "../../actions";
import { ArrowLeft, Search, Eye, AlertCircle, CheckCircle2 } from "lucide-react";

export default async function AdminInscripcionesPage({
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

  // Fetch registrations
  let query = client
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: false });

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params.q) {
    const term = `%${params.q.trim()}%`;
    query = query.or(
      `first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},document.ilike.${term}`,
    );
  }

  const { data: rawRows, error: loadError } = await query.limit(500);
  const rows = (rawRows as Registration[]) || [];

  // Fetch additional payments for badges
  const { data: rawPayments } = await client
    .from("registration_payments")
    .select("id,registration_id,amount,status,kind,receipt_path,review_note,created_at");
  const payments = (rawPayments as RegistrationPayment[]) || [];

  // If a registration is selected for detail review
  const selected = params.selected
    ? rows.find((r) => r.id === params.selected) ||
      (
        await client
          .from("registrations")
          .select("*")
          .eq("id", params.selected)
          .maybeSingle()
      ).data
    : null;

  // Receipts and history for selected
  const { data: receipt } = selected
    ? await client.storage
        .from("registration-receipts")
        .createSignedUrl(selected.receipt_path, 300)
    : { data: null };

  const { data: originalReceipt } =
    selected?.original_receipt_path &&
    selected.original_receipt_path !== selected.receipt_path
      ? await client.storage
          .from("registration-receipts")
          .createSignedUrl(selected.original_receipt_path, 300)
      : { data: null };

  const { data: history } = selected
    ? await client
        .from("registration_review_events")
        .select("id,payment_id,created_at,old_status,new_status,note")
        .eq("registration_id", selected.id)
        .order("created_at", { ascending: false })
        .limit(30)
    : { data: [] };

  const selectedPayments = selected
    ? await Promise.all(
        payments
          .filter((p) => p.registration_id === selected.id)
          .map(async (p) => {
            const { data: url } = await client.storage
              .from("registration-receipts")
              .createSignedUrl(p.receipt_path, 300);
            return { ...p, signedUrl: url?.signedUrl };
          }),
      )
    : [];

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

  const returnParams = new URLSearchParams();
  if (params.q) returnParams.set("q", params.q);
  if (params.status) returnParams.set("status", params.status);
  const closeHref = returnParams.toString()
    ? `/admin/inscripciones?${returnParams.toString()}`
    : "/admin/inscripciones";

  const detailHref = (id: string) =>
    returnParams.toString()
      ? `/admin/inscripciones?${returnParams.toString()}&selected=${encodeURIComponent(id)}`
      : `/admin/inscripciones?selected=${encodeURIComponent(id)}`;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[.2em] text-[#009d9f]">
            Radical 2.0 <span className="mx-1 text-[#a6bab5]">/</span> Participantes
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0a3039] sm:text-4xl">
            Inscripciones
          </h1>
          <p className="mt-2 text-sm text-[#69827e]">
            Consulta participantes, datos de contacto y estado de comprobantes.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {(params.error || params.success || loadError) && (
        <div
          role="status"
          className={`rounded-xl px-5 py-4 text-sm font-semibold ${
            params.error || loadError
              ? "bg-red-100 text-red-800"
              : "bg-teal-100 text-teal-900"
          }`}
        >
          {loadError
            ? "No se pudieron cargar todos los registros."
            : params.error
              ? errorMessages[params.error] || "Ocurrió un error."
              : successMessages[params.success || ""]}
        </div>
      )}

      {/* Registrations Table Card */}
      <section className="rounded-2xl border border-[#e2e8e4] bg-white p-5 shadow-[0_8px_35px_rgba(13,55,58,0.04)] sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black">Participantes registrados</h2>
            <p className="mt-1 text-sm text-slate-500">
              Revisa los datos personales y el comprobante de cada campista.
            </p>
          </div>
          <span className="rounded-full bg-[#e9f6f3] px-3 py-1 text-xs font-bold text-[#007f87]">
            {rows.length} resultados
          </span>
        </div>

        {/* Filters & Search Form */}
        <form className="mt-5 flex flex-wrap gap-2" method="GET">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Buscar por nombre, correo o documento..."
              className={`${adminInputClass} pl-10`}
            />
          </div>
          <select
            name="status"
            defaultValue={params.status || "all"}
            className="rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-[#082e39] outline-none"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes de revisión</option>
            <option value="approved">Aprobados</option>
            <option value="rejected">Observados</option>
          </select>
          <button type="submit" className={adminButtonClass}>
            Filtrar
          </button>
        </form>

        {/* Table */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-3">Participante</th>
                <th>Plan</th>
                <th>Abonado</th>
                <th>Estado</th>
                <th className="text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const hasPendingAddl = payments.some(
                  (p) => p.registration_id === r.id && p.status === "pending",
                );
                const totalPaid =
                  r.amount +
                  payments
                    .filter(
                      (p) =>
                        p.registration_id === r.id &&
                        p.kind === "additional" &&
                        p.status === "approved",
                    )
                    .reduce((total, p) => total + p.amount, 0);

                return (
                  <tr key={r.id} className="border-b border-slate-100 transition hover:bg-slate-50/60">
                    <td className="py-4">
                      <b className="text-sm font-bold text-[#082e39]">
                        {r.first_name} {r.last_name}
                      </b>
                      <div className="text-xs text-slate-500">{r.email}</div>
                      {hasPendingAddl && (
                        <div className="mt-1 inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-xs font-bold text-amber-800">
                          <AlertCircle size={12} />
                          <span>Comprobante adicional por revisar</span>
                        </div>
                      )}
                    </td>
                    <td className="capitalize font-semibold text-slate-700">{r.plan}</td>
                    <td className="font-bold text-[#0b2d36]">S/ {totalPaid}</td>
                    <td>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          r.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : r.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {statusLabels[r.status] || r.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <Link
                        href={detailHref(r.id)}
                        className="inline-flex items-center gap-1 font-bold text-[#008b96] hover:underline"
                      >
                        <span>Revisar</span>
                        <Eye size={15} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {rows.length === 0 && (
            <p className="py-12 text-center text-sm text-slate-500">
              No hay inscripciones que coincidan con la búsqueda.
            </p>
          )}
        </div>
      </section>

      {/* Detail Dialog */}
      {selected && (
        <AdminDialog closeHref={closeHref} title="Detalle de inscripción">
          <div className="flex justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#009aa3]">
                Detalle de inscripción
              </p>
              <h2 className="mt-2 text-2xl font-black">
                {selected.first_name} {selected.last_name}
              </h2>
            </div>
            <Link href={closeHref} className="text-sm font-bold text-slate-500 hover:text-slate-800">
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
                `S/ ${selectedPaid} · Saldo pendiente: S/ ${Math.max(
                  0,
                  selected.price - selectedPaid,
                )}`,
              ],
              ["Estado", statusLabels[selected.status] || selected.status],
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

          <h3 className="mt-6 font-bold">Comprobante principal</h3>
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
                Abrir imagen en pestaña nueva ↗
              </span>
            </a>
          ) : (
            <p className="mt-2 text-sm text-red-700">
              No se pudo cargar el comprobante.
            </p>
          )}

          {/* Additional payments */}
          {selectedPayments.length > 0 && (
            <section className="mt-6 space-y-3">
              <h3 className="font-black">Otros comprobantes y abonos</h3>
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
                    <span className="font-bold">{statusLabels[p.status] || p.status}</span>
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
                    <input type="hidden" name="view" value="registrations" />
                    <input type="hidden" name="filter_q" value={params.q || ""} />
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
                      placeholder="Nota de observación (opcional)"
                      className={adminInputClass}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        name="status"
                        value="approved"
                        className="rounded-lg bg-[#008e87] px-3 py-2 font-bold text-white transition hover:bg-[#007872]"
                      >
                        Aprobar abono
                      </button>
                      <button
                        name="status"
                        value="rejected"
                        className="rounded-lg bg-red-100 px-3 py-2 font-bold text-red-800 transition hover:bg-red-200"
                      >
                        Observar
                      </button>
                      <button
                        name="status"
                        value="pending"
                        className="rounded-lg bg-slate-200 px-3 py-2 font-bold text-slate-800 transition hover:bg-slate-300"
                      >
                        Dejar pendiente
                      </button>
                    </div>
                  </form>
                </div>
              ))}
            </section>
          )}

          {/* Audit History */}
          {history && history.length > 0 && (
            <details className="mt-5 rounded-xl bg-slate-50 p-4 text-sm">
              <summary className="cursor-pointer font-bold text-slate-700">
                Historial de revisiones
              </summary>
              <ul className="mt-3 space-y-3">
                {(history as ReviewEvent[]).map((event) => (
                  <li key={event.id} className="border-t border-slate-200 pt-2">
                    <strong>
                      {event.payment_id ? "Abono adicional" : "Inscripción principal"}:{" "}
                      {statusLabels[event.new_status] || event.new_status}
                    </strong>
                    <p className="text-xs text-slate-500">
                      {new Date(event.created_at).toLocaleString("es-PE", {
                        timeZone: "America/Lima",
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    {event.note && <p className="mt-1 text-slate-600">{event.note}</p>}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* Resolution form for initial registration */}
          <form action={review} className="mt-6 space-y-3 border-t border-slate-200 pt-5">
            <input type="hidden" name="view" value="registrations" />
            <input type="hidden" name="filter_q" value={params.q || ""} />
            <input
              type="hidden"
              name="filter_status"
              value={params.status || ""}
            />
            <input type="hidden" name="id" value={selected.id} />
            <label className="block text-sm font-bold">
              Nota de revisión para el campista
              <textarea
                name="note"
                defaultValue={selected.review_note || ""}
                maxLength={1000}
                className={`${adminInputClass} mt-2`}
                rows={2}
                placeholder="Explica cualquier observación sobre el comprobante (obligatorio si observas)..."
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                name="status"
                value="approved"
                className="rounded-xl bg-[#008e87] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#007872]"
              >
                Aprobar inscripción
              </button>
              <button
                name="status"
                value="rejected"
                className="rounded-xl bg-red-100 px-4 py-3 text-sm font-bold text-red-800 transition hover:bg-red-200"
              >
                Observar comprobante
              </button>
              <button
                name="status"
                value="pending"
                className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-200"
              >
                Pendiente
              </button>
            </div>
          </form>
        </AdminDialog>
      )}
    </div>
  );
}
