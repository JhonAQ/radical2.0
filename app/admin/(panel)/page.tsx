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

  const kpis = [
    {
      label: "Inscripciones totales",
      value: totalRegistrations || 0,
      icon: UsersRound,
      tone: "bg-[#e2f5ef] text-[#008e86]",
    },
    {
      label: "Inscripciones pendientes",
      value: pendingRegistrations || 0,
      icon: ClipboardCheck,
      tone: "bg-[#fff1ce] text-[#b97c00]",
    },
    {
      label: "Abonos por revisar",
      value: (pendingRegistrations || 0) + (pendingPayments || 0),
      icon: Clock3,
      tone: "bg-[#ffecdf] text-[#db6e27]",
    },
    {
      label: "Recaudado aprobado",
      value: `S/ ${approvedTotal}`,
      icon: CircleDollarSign,
      tone: "bg-[#e5f2f6] text-[#167d94]",
    },
  ];

  const recent = (recentRegistrations as Registration[]) || [];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[.2em] text-[#009d9f]">
            Radical 2.0 <span className="mx-1 text-[#a6bab5]">/</span> Resumen
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0a3039] sm:text-4xl">
            Resumen general
          </h1>
          <p className="mt-2 text-sm text-[#69827e]">
            Todo lo que sucede en el campamento, en un solo lugar.
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-[#dfe9e2] bg-white px-4 py-2 text-xs font-semibold text-[#55736e] sm:flex">
          <span className="size-2 rounded-full bg-[#14b8a6]" /> Campamento ·
          Mejía
        </div>
      </div>

      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-[24px] bg-[#0a4249] px-6 py-7 text-white sm:px-8">
        <div
          aria-hidden
          className="absolute -right-16 -top-36 h-72 w-72 rounded-full bg-[#06b9b2]/25 blur-3xl"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#83e3d4]">
              Panel de control
            </p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              Bienvenido al equipo Radical
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#c0ddda]">
              Revisa comprobantes, mantén las inscripciones al día y prepara una
              gran experiencia para los campistas.
            </p>
          </div>
          <Link
            href="/admin/inscripciones"
            className="inline-flex items-center gap-2 rounded-xl bg-[#ffc32b] px-5 py-3 text-sm font-black text-[#07333d] transition hover:bg-[#ffca44]"
          >
            <span>Ver inscripciones</span>
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>

      {/* KPI Blocks */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className="rounded-2xl border border-[#e3ebe5] bg-white p-5 shadow-[0_8px_30px_rgba(13,55,58,.035)]"
          >
            <div className={`grid size-10 place-items-center rounded-xl ${tone}`}>
              <Icon size={20} />
            </div>
            <p className="mt-4 text-2xl font-black sm:text-3xl">{value}</p>
            <p className="mt-1 text-xs font-semibold text-[#728a84]">{label}</p>
          </div>
        ))}
      </div>

      {/* Overview 2-Col Grid */}
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        {/* Recent Registrations */}
        <section className="rounded-2xl border border-[#e3ebe5] bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">Inscripciones recientes</h2>
              <p className="mt-1 text-xs text-[#78918a]">
                Las últimas personas que enviaron su inscripción
              </p>
            </div>
            <Link
              href="/admin/inscripciones"
              className="text-xs font-bold text-[#008e95] hover:underline"
            >
              Ver todas →
            </Link>
          </div>
          <div className="mt-5 divide-y divide-[#edf1ee]">
            {recent.map((r) => (
              <Link
                key={r.id}
                href={`/admin/inscripciones?selected=${r.id}`}
                className="flex items-center gap-3 py-3 transition hover:text-[#008e95]"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e6f5ef] text-sm font-black text-[#008e86]">
                  {r.first_name[0]?.toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-sm">
                    {r.first_name} {r.last_name}
                  </b>
                  <span className="block truncate text-xs text-[#8a9f99]">
                    {r.email}
                  </span>
                </span>
                <span className="text-xs font-bold text-[#66837a]">
                  {statusLabels[r.status] || r.status}
                </span>
                <ChevronRight size={16} />
              </Link>
            ))}
            {recent.length === 0 && (
              <p className="py-10 text-center text-sm text-[#829992]">
                Todavía no hay inscripciones registradas.
              </p>
            )}
          </div>
        </section>

        {/* Quick Pending Tasks */}
        <section className="rounded-2xl border border-[#e3ebe5] bg-white p-6">
          <h2 className="text-lg font-black">Pendientes del equipo</h2>
          <p className="mt-1 text-xs text-[#78918a]">
            Accesos rápidos para revisar comprobantes
          </p>
          <div className="mt-5 space-y-3">
            <Link
              href="/admin/inscripciones?status=pending"
              className="flex items-center gap-3 rounded-xl bg-[#fff9e9] p-4 transition hover:bg-[#fff4d6]"
            >
              <ClipboardCheck className="text-[#c48600]" size={20} />
              <span className="flex-1 text-sm font-bold">
                Inscripciones por revisar
              </span>
              <b>{pendingRegistrations || 0}</b>
              <ChevronRight size={16} />
            </Link>
            <Link
              href="/admin/pagos?status=pending"
              className="flex items-center gap-3 rounded-xl bg-[#ecf8f5] p-4 transition hover:bg-[#dcf4ee]"
            >
              <Clock3 className="text-[#008e86]" size={20} />
              <span className="flex-1 text-sm font-bold">
                Abonos por revisar
              </span>
              <b>{(pendingRegistrations || 0) + (pendingPayments || 0)}</b>
              <ChevronRight size={16} />
            </Link>
            <div className="rounded-xl border border-dashed border-[#dbe8df] p-4 text-xs leading-5 text-[#78918a]">
              Los comprobantes se verifican individualmente y cada observación o
              aprobación queda auditada en el historial.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
