import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import {
  statusLabels,
  adminInputClass,
  adminButtonClass,
  type Registration,
  type RegistrationPayment,
  type PaymentItem,
} from "../../types";
import { Search, Eye } from "lucide-react";

export default async function AdminPagosPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const client = createClient(await cookies());

  const [
    { data: rawRows },
    { data: rawPayments },
  ] = await Promise.all([
    client.from("registrations").select("id,first_name,last_name,email,amount,status,created_at"),
    client
      .from("registration_payments")
      .select("id,registration_id,amount,status,kind,created_at")
      .order("created_at", { ascending: false }),
  ]);

  const rows = (rawRows as Registration[]) || [];
  const payments = (rawPayments as RegistrationPayment[]) || [];

  const paymentItems: PaymentItem[] = [
    ...rows.map((r) => ({
      id: `initial-${r.id}`,
      registrationId: r.id,
      name: `${r.first_name} ${r.last_name}`,
      email: r.email,
      amount: r.amount,
      status: r.status,
      kind: "Abono inicial",
      date: r.created_at,
    })),
    ...payments
      .filter((p) => !(p.kind === "replacement" && p.status === "approved"))
      .map((p) => {
        const r = rows.find((item) => item.id === p.registration_id);
        return {
          id: p.id,
          registrationId: p.registration_id,
          name: r ? `${r.first_name} ${r.last_name}` : "Participante",
          email: r?.email || "",
          amount: p.amount,
          status: p.status,
          kind:
            p.kind === "replacement"
              ? "Comprobante corregido"
              : "Abono adicional",
          date: p.created_at,
        };
      }),
  ]
    .filter(
      (p) =>
        (!params.status ||
          params.status === "all" ||
          p.status === params.status) &&
        (!params.q ||
          `${p.name} ${p.email}`
            .toLowerCase()
            .includes(params.q.toLowerCase())),
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[.2em] text-[#009d9f]">
            Radical 2.0 <span className="mx-1 text-[#a6bab5]">/</span> Tesorería
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0a3039] sm:text-4xl">
            Pagos y comprobantes
          </h1>
          <p className="mt-2 text-sm text-[#69827e]">
            Revisa los pagos recibidos y lleva el control de cada abono.
          </p>
        </div>
      </div>

      {/* Movements Table Card */}
      <section className="rounded-2xl border border-[#e2e8e4] bg-white p-5 shadow-[0_8px_35px_rgba(13,55,58,.04)] sm:p-7">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Historial de movimientos</h2>
            <p className="mt-1 text-sm text-[#78918a]">
              Abonos iniciales, abonos adicionales y comprobantes corregidos.
            </p>
          </div>
          <span className="rounded-full bg-[#e9f6f3] px-3 py-1 text-xs font-bold text-[#007f87]">
            {paymentItems.length} resultados
          </span>
        </div>

        {/* Filters */}
        <form className="mt-5 flex flex-wrap gap-2" method="GET">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Buscar participante o correo..."
              className={`${adminInputClass} pl-10`}
            />
          </div>
          <select
            name="status"
            defaultValue={params.status || "all"}
            className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-medium text-[#082e39] outline-none"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobados</option>
            <option value="rejected">Observados</option>
          </select>
          <button type="submit" className={adminButtonClass}>
            Buscar
          </button>
        </form>

        {/* Table */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-3">Participante</th>
                <th>Tipo de movimiento</th>
                <th>Monto</th>
                <th>Estado</th>
                <th className="text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {paymentItems.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 transition hover:bg-slate-50/60">
                  <td className="py-4">
                    <b className="text-sm font-bold text-[#082e39]">{p.name}</b>
                    <div className="text-xs text-slate-500">{p.email}</div>
                  </td>
                  <td className="font-semibold text-slate-700">{p.kind}</td>
                  <td className="font-bold text-[#0b2d36]">S/ {p.amount}</td>
                  <td>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        p.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : p.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {statusLabels[p.status] || p.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/admin/inscripciones?selected=${p.registrationId}${
                        p.id.startsWith("initial-") ? "" : `#payment-${p.id}`
                      }`}
                      className="inline-flex items-center gap-1 font-bold text-[#008b96] hover:underline"
                    >
                      <span>Revisar</span>
                      <Eye size={15} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {paymentItems.length === 0 && (
            <p className="py-12 text-center text-sm text-slate-500">
              No hay movimientos que coincidan con la búsqueda.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
