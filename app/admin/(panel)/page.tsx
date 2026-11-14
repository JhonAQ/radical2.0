import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  UsersRound,
  ClipboardCheck,
  Clock3,
  CircleDollarSign,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import { statusLabels, type Registration } from "../types";

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    selected?: string;
    error?: string;
    success?: string;
  }>;
}) {
  const params = await searchParams;

  // Backward compatibility with legacy ?view= queries
  if (params.view === "registrations") {
    redirect(
      params.selected
        ? `/admin/inscripciones?selected=${encodeURIComponent(params.selected)}`
        : "/admin/inscripciones",
    );
  }
  if (params.view === "payments") redirect("/admin/pagos");
  if (params.view === "team") redirect("/admin/equipo");
  if (params.view === "account") redirect("/admin/cuenta");

  const client = createClient(await cookies());

  // Metrics queries in parallel
  const [
    { count: totalRegistrations },
    { count: pendingRegistrations },
    { count: pendingPayments },
    { data: approvedRegs },
    { data: approvedAddlPayments },
    { data: recentRegistrations },
  ] = await Promise.all([
    client.from("registrations").select("*", { count: "exact", head: true }),
    client
      .from("registrations")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    client
      .from("registration_payments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    client.from("registrations").select("amount").eq("status", "approved"),
    client
      .from("registration_payments")
      .select("amount")
      .eq("status", "approved")
      .eq("kind", "additional"),
    client
      .from("registrations")
      .select("id,first_name,last_name,email,status,created_at,amount")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const approvedTotal =
    (approvedRegs || []).reduce((n, r) => n + r.amount, 0) +
    (approvedAddlPayments || []).reduce((n, p) => n + p.amount, 0);

  const pendingReviewTotal =
    (pendingRegistrations || 0) + (pendingPayments || 0);

  const kpis = [
    {
      label: "Inscripciones totales",
      value: totalRegistrations || 0,
      icon: UsersRound,
      detail: "Registros en sistema",
      highlight: false,
    },
    {
      label: "Inscripciones pendientes",
      value: pendingRegistrations || 0,
      icon: ClipboardCheck,
      detail: "Por validar comprobante",
      highlight: (pendingRegistrations || 0) > 0,
    },
    {
      label: "Abonos por revisar",
      value: pendingPayments || 0,
      icon: Clock3,
      detail: "Comprobantes de saldo",
      highlight: (pendingPayments || 0) > 0,
    },
    {
      label: "Recaudado aprobado",
      value: `S/ ${approvedTotal}`,
      icon: CircleDollarSign,
      detail: "Monto total confirmado",
      highlight: false,
    },
  ];

  const recent = (recentRegistrations as Registration[]) || [];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a3039]">
            Panel de control
          </h1>
          <p className="mt-1 text-sm text-[#5f7a75]">
            Métricas de campistas y estado operativo en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/inscripciones"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#d2ded8] bg-white px-3.5 py-2 text-xs font-semibold text-[#0a3039] shadow-sm transition hover:bg-[#f8faf8]"
          >
            <span>Ver inscripciones</span>
          </Link>
          <Link
            href="/admin/reportes"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4249] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#08363c]"
          >
            <span>Reportes oficiales</span>
          </Link>
        </div>
      </div>

      {/* ── Operational Attention Bar (shown only when pending tasks exist) ── */}
      {pendingReviewTotal > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-amber-200/90 bg-[#fffaf0] p-4 text-[#784300] shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-800">
              <Clock3 size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#683b00]">
                {pendingReviewTotal === 1
                  ? "1 comprobante pendiente de verificación"
                  : `${pendingReviewTotal} comprobantes pendientes de verificación`}
              </p>
              <p className="text-xs text-[#8c5615]">
                {pendingRegistrations || 0} inscripción(es) inicial(es) y {pendingPayments || 0} abono(s) por auditar.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(pendingRegistrations || 0) > 0 && (
              <Link
                href="/admin/inscripciones?status=pending"
                className="rounded-lg bg-[#d97706] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#b45309]"
              >
                Inscripciones ({pendingRegistrations})
              </Link>
            )}
            {(pendingPayments || 0) > 0 && (
              <Link
                href="/admin/pagos?status=pending"
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm transition hover:bg-amber-50"
              >
                Abonos ({pendingPayments})
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Unified Metric Cards ── */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, detail, highlight }) => (
          <div
            key={label}
            className={`rounded-xl border p-4.5 transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.03)] ${
              highlight
                ? "border-amber-200/90 bg-[#fffdf9]"
                : "border-[#e2e8e4] bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#657d77]">{label}</span>
              <span
                className={`grid size-7 place-items-center rounded-md ${
                  highlight
                    ? "bg-amber-100 text-amber-800"
                    : "bg-[#edf3f0] text-[#4d6a64]"
                }`}
              >
                <Icon size={15} />
              </span>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-[#0a3039]">
              {value}
            </p>
            <p className="mt-1 text-[11px] text-[#7d948f]">{detail}</p>
          </div>
        ))}
      </div>

      {/* ── Overview 2-Col Grid ── */}
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        {/* Recent Registrations */}
        <section className="rounded-xl border border-[#e2e8e4] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3 border-b border-[#edf1ee] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#0a3039]">
                Inscripciones recientes
              </h2>
              <p className="mt-0.5 text-xs text-[#78918a]">
                Últimos participantes registrados en la plataforma
              </p>
            </div>
            <Link
              href="/admin/inscripciones"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#008e95] hover:text-[#006e74]"
            >
              <span>Ver todas</span>
              <ChevronRight size={14} />
            </Link>
          </div>
          <div className="mt-2 divide-y divide-[#edf1ee]">
            {recent.map((r) => (
              <Link
                key={r.id}
                href={`/admin/inscripciones?selected=${r.id}`}
                className="flex items-center gap-3 py-3 transition hover:text-[#008e95]"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#eaf3f0] text-xs font-bold text-[#0a524a]">
                  {r.first_name[0]?.toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#0a3039]">
                    {r.first_name} {r.last_name}
                  </span>
                  <span className="block truncate text-xs text-[#7d948f]">
                    {r.email}
                  </span>
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                    r.status === "approved"
                      ? "bg-emerald-50 text-emerald-800"
                      : r.status === "rejected"
                        ? "bg-red-50 text-red-800"
                        : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {statusLabels[r.status] || r.status}
                </span>
                <ChevronRight size={15} className="text-[#9cb2ac]" />
              </Link>
            ))}
            {recent.length === 0 && (
              <p className="py-10 text-center text-sm text-[#829992]">
                Todavía no hay inscripciones registradas.
              </p>
            )}
          </div>
        </section>

        {/* Operational Shortcuts */}
        <section className="rounded-xl border border-[#e2e8e4] bg-white p-5 shadow-sm sm:p-6">
          <div className="border-b border-[#edf1ee] pb-4">
            <h2 className="text-base font-bold text-[#0a3039]">
              Accesos operativos
            </h2>
            <p className="mt-0.5 text-xs text-[#78918a]">
              Gestión directa de pagos y comprobantes
            </p>
          </div>
          <div className="mt-4 space-y-2.5">
            <Link
              href="/admin/inscripciones?status=pending"
              className="flex items-center gap-3 rounded-lg border border-[#e7eee9] bg-[#fafcfb] p-3.5 transition hover:border-[#008e95]/40 hover:bg-white"
            >
              <div className="grid size-8 place-items-center rounded-md bg-amber-50 text-amber-700">
                <ClipboardCheck size={17} />
              </div>
              <span className="flex-1 text-xs font-semibold text-[#0a3039]">
                Inscripciones por revisar
              </span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                {pendingRegistrations || 0}
              </span>
              <ChevronRight size={14} className="text-[#9cb2ac]" />
            </Link>
            <Link
              href="/admin/pagos?status=pending"
              className="flex items-center gap-3 rounded-lg border border-[#e7eee9] bg-[#fafcfb] p-3.5 transition hover:border-[#008e95]/40 hover:bg-white"
            >
              <div className="grid size-8 place-items-center rounded-md bg-[#eaf3f0] text-[#0a524a]">
                <Clock3 size={17} />
              </div>
              <span className="flex-1 text-xs font-semibold text-[#0a3039]">
                Abonos por revisar
              </span>
              <span className="rounded-full bg-[#e1eee9] px-2 py-0.5 text-xs font-bold text-[#0a524a]">
                {(pendingRegistrations || 0) + (pendingPayments || 0)}
              </span>
              <ChevronRight size={14} className="text-[#9cb2ac]" />
            </Link>
            <Link
              href="/admin/reportes?type=asistencia"
              className="flex items-center gap-3 rounded-lg border border-[#e7eee9] bg-[#fafcfb] p-3.5 transition hover:border-[#008e95]/40 hover:bg-white"
            >
              <div className="grid size-8 place-items-center rounded-md bg-[#edf3f6] text-[#145d70]">
                <UsersRound size={17} />
              </div>
              <span className="flex-1 text-xs font-semibold text-[#0a3039]">
                Padrón de asistencia y buses
              </span>
              <ChevronRight size={14} className="text-[#9cb2ac]" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
