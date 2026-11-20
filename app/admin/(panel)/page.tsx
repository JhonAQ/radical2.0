import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  UsersRound,
  ClipboardCheck,
  DoorOpen,
  Clock3,
  CircleDollarSign,
  ChevronRight,
  BadgeCheck,
  ScanLine,
  Printer,
} from "lucide-react";
import { type Registration } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { loadCheckInCounts } from "@/utils/check-in-roster";

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

  // Supabase corta en 1000 filas por consulta: se suma por páginas para no truncar el total.
  async function sumAmounts(
    table: "registrations" | "registration_payments",
    filters: Record<string, string>,
  ) {
    let total = 0;
    for (let from = 0; ; from += 1000) {
      let query = client.from(table).select("amount");
      for (const [column, value] of Object.entries(filters)) {
        query = query.eq(column, value);
      }
      const { data } = await query
        .order("id", { ascending: true })
        .range(from, from + 999);
      if (!data) break;
      total += data.reduce((n, row) => n + row.amount, 0);
      if (data.length < 1000) break;
    }
    return total;
  }

  // Metrics queries in parallel
  const [
    { count: totalRegistrations },
    { count: pendingRegistrations },
    { count: pendingPayments },
    { count: approvedRegistrations },
    approvedRegsTotal,
    approvedAddlTotal,
    { data: recentRegistrations },
    checkInCounts,
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
    client
      .from("registrations")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
    sumAmounts("registrations", { status: "approved" }),
    sumAmounts("registration_payments", { status: "approved", kind: "additional" }),
    client
      .from("registrations")
      .select("id,first_name,last_name,email,status,created_at,amount")
      .order("created_at", { ascending: false })
      .limit(6),
    loadCheckInCounts(client),
  ]);
  const checkInPercent = checkInCounts.total
    ? Math.round((checkInCounts.checkedIn / checkInCounts.total) * 100)
    : 0;

  const approvedTotal = approvedRegsTotal + approvedAddlTotal;

  const pendingReviewTotal =
    (pendingRegistrations || 0) + (pendingPayments || 0);

  const kpis = [
    {
      label: "Inscritos",
      value: totalRegistrations || 0,
      icon: UsersRound,
      detail: "Enviaron el formulario",
      highlight: false,
    },
    {
      label: "Aprobados",
      value: approvedRegistrations || 0,
      icon: ClipboardCheck,
      detail: "Con el pago inicial validado",
      highlight: false,
    },
    {
      label: "Por validar",
      value: pendingReviewTotal,
      icon: Clock3,
      detail: "Comprobantes esperando revisión",
      highlight: pendingReviewTotal > 0,
    },
    {
      label: "Recaudado",
      value: `S/ ${approvedTotal}`,
      icon: CircleDollarSign,
      detail: "Pagos aprobados",
      highlight: false,
    },
  ];

  const recent = (recentRegistrations as Registration[]) || [];

  return (
    <div className="space-y-6">
      {/* ── Encabezado ── */}
      <div className="pb-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#0a3039] sm:text-3xl">Inicio</h1>
        <p className="mt-1 text-sm text-[#5f7a75]">Lo que hay que hacer hoy y los números del campamento.</p>
      </div>

      {/* ── Lo pendiente: una sola tarjeta con una sola acción ── */}
      {pendingReviewTotal > 0 ? (
        <Link
          href="/admin/pagos"
          className="group flex flex-col gap-4 rounded-xl border border-amber-200/90 bg-[#fffaf0] p-4 text-[#784300] shadow-sm transition hover:border-amber-300 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-800">
              <Clock3 size={19} />
            </span>
            <span>
              <span className="block text-sm font-bold text-[#683b00]">
                {pendingReviewTotal === 1 ? "1 comprobante por validar" : `${pendingReviewTotal} comprobantes por validar`}
              </span>
              <span className="block text-xs text-[#8c5615]">
                {[
                  pendingRegistrations ? `${pendingRegistrations} de inscripción` : null,
                  pendingPayments ? `${pendingPayments} ${pendingPayments === 1 ? "abono" : "abonos"}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                . Se atienden del más antiguo al más nuevo.
              </span>
            </span>
          </span>
          <span className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#d97706] px-4 text-sm font-bold text-white shadow-sm transition group-hover:bg-[#b45309]">
            Empezar a validar
            <ChevronRight size={16} aria-hidden />
          </span>
        </Link>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm font-semibold text-emerald-900">
          <BadgeCheck size={19} className="shrink-0" aria-hidden />
          Todo al día: no hay comprobantes por validar.
        </div>
      )}

      {/* ── Control de ingreso (aparece cuando empieza a registrarse gente) ── */}
      {checkInCounts.checkedIn > 0 && (
        <Link
          href="/admin/ingresos"
          className="flex items-center gap-4 rounded-xl border border-[#cfe5df] bg-white p-4 shadow-sm transition hover:border-[#008e95]/40"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#e3f4ef] text-[#0a524a]">
            <DoorOpen size={19} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-[#0a3039]">
              Ingresaron {checkInCounts.checkedIn} de {checkInCounts.total} campistas
            </span>
            <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[#edf3f0]">
              <span className="block h-full rounded-full bg-[#0f8f87]" style={{ width: `${checkInPercent}%` }} />
            </span>
          </span>
          <span className="hidden text-xs font-semibold text-[#008e95] sm:block">
            Faltan {checkInCounts.total - checkInCounts.checkedIn}
          </span>
          <ChevronRight size={15} className="text-[#9cb2ac]" />
        </Link>
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
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.5fr_1fr]">
        {/* Recent Registrations */}
        <section className="rounded-xl border border-[#e2e8e4] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3 border-b border-[#edf1ee] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#0a3039]">
                Últimas inscripciones
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
                href={`/admin/inscripciones/${r.id}`}
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
                <StatusBadge status={r.status} />
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

        {/* Atajos */}
        <section className="rounded-xl border border-[#e2e8e4] bg-white p-5 shadow-sm sm:p-6">
          <div className="border-b border-[#edf1ee] pb-4">
            <h2 className="text-base font-bold text-[#0a3039]">Atajos</h2>
            <p className="mt-0.5 text-xs text-[#78918a]">Lo que más se usa el día del campamento</p>
          </div>
          <div className="mt-4 space-y-2.5">
            {[
              { href: "/admin/escaner", label: "Escanear entradas", icon: ScanLine, tone: "bg-[#eaf3f0] text-[#0a524a]", external: false },
              { href: "/admin/ingresos", label: "Control de ingreso", icon: DoorOpen, tone: "bg-[#eaf3f0] text-[#0a524a]", external: false },
              {
                href: "/admin/imprimir?type=campistas&status=approved",
                label: "Lista de campistas para imprimir",
                icon: Printer,
                tone: "bg-[#edf3f6] text-[#145d70]",
                external: true,
              },
            ].map(({ href, label, icon: Icon, tone, external }) => (
              <Link
                key={href}
                href={href}
                target={external ? "_blank" : undefined}
                className="flex min-h-12 items-center gap-3 rounded-lg border border-[#e7eee9] bg-[#fafcfb] p-3 transition hover:border-[#008e95]/40 hover:bg-white"
              >
                <span className={`grid size-8 place-items-center rounded-md ${tone}`}>
                  <Icon size={17} />
                </span>
                <span className="flex-1 text-sm font-semibold text-[#0a3039]">{label}</span>
                <ChevronRight size={14} className="text-[#9cb2ac]" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
