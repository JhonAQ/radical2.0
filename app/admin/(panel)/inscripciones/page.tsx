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
import { ExportPanel } from "../../components/ExportPanel";
import { Search, Eye, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 25;

export default async function AdminInscripcionesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    plan?: string;
    page?: string;
    error?: string;
    success?: string;
  }>;
}) {
  const params = await searchParams;
  const client = createClient(await cookies());

  const page = Math.max(1, parseInt(params.page || "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  // ── Build paginated, server-filtered query ──────────────────
  let countQuery = client
    .from("registrations")
    .select("*", { count: "exact", head: true });
  let dataQuery = client
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (params.status && params.status !== "all") {
    countQuery = countQuery.eq("status", params.status);
    dataQuery = dataQuery.eq("status", params.status);
  }
  if (params.plan && params.plan !== "all") {
    countQuery = countQuery.ilike("plan", params.plan);
    dataQuery = dataQuery.ilike("plan", params.plan);
  }
  if (params.q && params.q.trim()) {
    const term = `%${params.q.trim()}%`;
    const orClause = `first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},document.ilike.${term}`;
    countQuery = countQuery.or(orClause);
    dataQuery = dataQuery.or(orClause);
  }

  const [{ count: totalCount }, { data: rawRows, error: loadError }] =
    await Promise.all([countQuery, dataQuery]);

  const rows = (rawRows as Registration[]) || [];
  const totalPages = Math.ceil((totalCount || 0) / PAGE_SIZE);

  // Fetch pending payment statuses for badge highlights (lightweight query)
  const { data: pendingPayments } = await client
    .from("registration_payments")
    .select("registration_id")
    .eq("status", "pending")
    .in(
      "registration_id",
      rows.map((r) => r.id),
    );

  const pendingPaymentIds = new Set(
    (pendingPayments || []).map((p) => p.registration_id),
  );

  // Fetch approved additional payments for "total paid" column
  const { data: approvedAddlPayments } = await client
    .from("registration_payments")
    .select("registration_id,amount")
    .eq("status", "approved")
    .eq("kind", "additional")
    .in(
      "registration_id",
      rows.map((r) => r.id),
    );

  const addlTotals = ((approvedAddlPayments || []) as Pick<RegistrationPayment, "registration_id" | "amount">[]).reduce(
    (acc, p) => {
      acc[p.registration_id] = (acc[p.registration_id] || 0) + p.amount;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Build the href for pagination/filter links
  function buildHref(overrides: Record<string, string | undefined>) {
    const merged = {
      q: params.q,
      status: params.status,
      plan: params.plan,
      page: String(page),
      ...overrides,
    };
    const qs = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== "all" && v !== "1" && k !== "page") qs.set(k, v);
      if (k === "page" && v && v !== "1") qs.set(k, v);
    });
    return `/admin/inscripciones${qs.toString() ? `?${qs.toString()}` : ""}`;
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a3039]">
            Padrón de inscripciones
          </h1>
          <p className="mt-1 text-sm text-[#5f7a75]">
            Directorio general y ficha de los participantes del campamento.
          </p>
        </div>

        {/* Export Button */}
        <ExportPanel />
      </div>

      {/* ── Notifications ── */}
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
            ? "No se pudieron cargar los registros."
            : params.error
              ? errorMessages[params.error] || "Ocurrió un error."
              : successMessages[params.success || ""]}
        </div>
      )}

      {/* ── Table Card ── */}
      <section className="rounded-2xl border border-[#e2e8e4] bg-white p-5 shadow-[0_8px_35px_rgba(13,55,58,0.04)] sm:p-7">
        {/* Filter Bar */}
        <form
          className="flex flex-wrap items-end gap-2"
          method="GET"
        >
          {/* Search Input */}
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Nombre, correo o documento..."
              className={`${adminInputClass} pl-10`}
            />
          </div>

          {/* Status Filter */}
          <select
            name="status"
            defaultValue={params.status || "all"}
            className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-medium text-[#082e39] outline-none"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente de revisión</option>
            <option value="approved">Aprobados</option>
            <option value="rejected">Observados</option>
          </select>

          {/* Plan Filter */}
          <select
            name="plan"
            defaultValue={params.plan || "all"}
            className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-medium text-[#082e39] outline-none"
          >
            <option value="all">Todos los planes</option>
            <option value="preventa">Preventa</option>
            <option value="regular">Regular</option>
          </select>

          <button type="submit" className={adminButtonClass}>
            Buscar
          </button>

          {/* Reset link */}
          {(params.q || (params.status && params.status !== "all") || (params.plan && params.plan !== "all")) && (
            <Link
              href="/admin/inscripciones"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
            >
              Limpiar
            </Link>
          )}
        </form>

        {/* Results summary */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Mostrando{" "}
            <strong className="text-slate-700">{rows.length}</strong> de{" "}
            <strong className="text-slate-700">{totalCount || 0}</strong>{" "}
            inscripciones
            {params.q || params.status || params.plan
              ? " (filtrado)"
              : ""}
          </span>
          <span>
            Página <strong className="text-slate-700">{page}</strong> de{" "}
            <strong className="text-slate-700">{Math.max(1, totalPages)}</strong>
          </span>
        </div>

        {/* Table */}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-3 pr-4">Participante</th>
                <th className="pr-4">Plan</th>
                <th className="pr-4">Total abonado</th>
                <th className="pr-4">Estado</th>
                <th className="text-right">Ficha</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const hasPendingAddl = pendingPaymentIds.has(r.id);
                const totalPaid = r.amount + (addlTotals[r.id] || 0);
                const balance = Math.max(0, r.price - totalPaid);

                return (
                  <tr
                    key={r.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50/60"
                  >
                    <td className="py-3.5 pr-4">
                      <Link
                        href={`/admin/inscripciones/${r.id}`}
                        className="block"
                      >
                        <b className="text-sm font-bold text-[#082e39]">
                          {r.last_name}, {r.first_name}
                        </b>
                        <div className="text-xs text-slate-400">{r.email}</div>
                      </Link>
                      {hasPendingAddl && (
                        <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-800">
                          <AlertCircle size={11} />
                          <span>Abono pendiente de revisión</span>
                        </div>
                      )}
                    </td>
                    <td className="pr-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold capitalize text-slate-700">
                        {r.plan}
                      </span>
                    </td>
                    <td className="pr-4">
                      <span className="font-bold text-[#0b2d36]">
                        S/ {totalPaid}
                      </span>
                      {balance > 0 && (
                        <span className="ml-1.5 text-xs text-slate-400">
                          (saldo S/ {balance})
                        </span>
                      )}
                    </td>
                    <td className="pr-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
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
                        href={`/admin/inscripciones/${r.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-[#0a4249] transition hover:border-[#008b96]/40 hover:bg-[#f4faf9]"
                      >
                        <span>Ver ficha</span>
                        <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {rows.length === 0 && (
            <p className="py-14 text-center text-sm text-slate-500">
              No hay inscripciones que coincidan con los filtros aplicados.
            </p>
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
            {/* Prev */}
            {page > 1 ? (
              <Link
                href={buildHref({ page: String(page - 1) })}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <ChevronLeft size={15} />
                <span>Anterior</span>
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-300">
                <ChevronLeft size={15} />
                <span>Anterior</span>
              </span>
            )}

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - page) <= 2,
              )
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-slate-400">
                    …
                  </span>
                ) : (
                  <Link
                    key={p}
                    href={buildHref({ page: String(p) })}
                    className={`grid size-9 place-items-center rounded-xl text-xs font-bold transition ${
                      p === page
                        ? "bg-[#0b4248] text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </Link>
                ),
              )}

            {/* Next */}
            {page < totalPages ? (
              <Link
                href={buildHref({ page: String(page + 1) })}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <span>Siguiente</span>
                <ChevronRight size={15} />
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-300">
                <span>Siguiente</span>
                <ChevronRight size={15} />
              </span>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
