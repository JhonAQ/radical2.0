import { cookies } from "next/headers";
import Link from "next/link";
import { ChevronRight, ScanLine, Search } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { loadCheckInRoster, type RosterRow } from "@/utils/check-in-roster";
import { isMinorAtCamp } from "@/utils/minors";
import { formatTicketCode } from "@/utils/ticket";
import { PrintButton } from "../../components/PrintButton";
import { adminInputClass } from "../../types";

export const metadata = { title: "Control de ingreso | Radical 2.0" };

type View = "faltan" | "ingresaron" | "todos";

const timeFmt = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

function PayChip({ row }: { row: RosterRow }) {
  if (row.status !== "approved")
    return (
      <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-800">
        {row.status === "rejected" ? "Observado" : "Sin validar"}
      </span>
    );
  if (row.remaining > 0)
    return <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Debe S/ {row.remaining}</span>;
  return <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">Pagado</span>;
}

export default async function IngresosPage({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string; q?: string }>;
}) {
  const params = await searchParams;
  const view: View = params.ver === "ingresaron" || params.ver === "todos" ? params.ver : "faltan";
  const q = (params.q ?? "").trim();

  const client = createClient(await cookies());
  const {
    data: { user },
  } = await client.auth.getUser();
  const { data: membership } = user
    ? await client.from("admin_users").select("role").eq("user_id", user.id).maybeSingle()
    : { data: null };
  if (!user || !membership) return null;

  const roster = await loadCheckInRoster(client);
  const inside = roster.filter((r) => r.checkedInAt);
  const missing = roster.filter((r) => !r.checkedInAt);
  const insideWithDebt = inside.filter((r) => r.status !== "approved" || r.remaining > 0);
  const debtTotal = insideWithDebt.reduce((n, r) => n + (r.status === "approved" ? r.remaining : r.price), 0);
  const percent = roster.length ? Math.round((inside.length / roster.length) * 100) : 0;

  const base = view === "faltan" ? missing : view === "ingresaron" ? inside : roster;
  const needle = q.toLocaleLowerCase("es").normalize("NFD").replace(/\p{M}/gu, "");
  const rows = needle
    ? base.filter((r) =>
        `${r.first_name} ${r.last_name} ${r.document} ${r.ticket_code}`
          .toLocaleLowerCase("es")
          .normalize("NFD")
          .replace(/\p{M}/gu, "")
          .includes(needle.replace(/-/g, "")),
      )
    : base;

  const tabs: { id: View; label: string; count: number }[] = [
    { id: "faltan", label: "Faltan", count: missing.length },
    { id: "ingresaron", label: "Ingresaron", count: inside.length },
    { id: "todos", label: "Todos", count: roster.length },
  ];
  const tabHref = (id: View) => `/admin/ingresos?ver=${id}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
  const printTitle = view === "faltan" ? "Faltan ingresar" : view === "ingresaron" ? "Ingresaron" : "Padrón completo";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0a3039] sm:text-3xl">Control de ingreso</h1>
          <p className="mt-1 text-sm text-[#5f7a75]">Quién llegó, quién falta y quién entró con saldo pendiente.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <PrintButton />
          <Link
            href="/admin/escaner"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0a4249] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#08363c]"
          >
            <ScanLine size={15} aria-hidden />
            Abrir escáner
          </Link>
        </div>
      </div>

      {/* Resumen */}
      <section className="grid grid-cols-3 gap-2 sm:grid-cols-[2fr_1fr_1fr] sm:gap-3 print:hidden">
        <div className="rounded-xl border border-[#e2e8e4] bg-white p-3 shadow-sm sm:p-4">
          <p className="text-xs font-medium text-[#657d77]">Ingresaron</p>
          <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-[#0a3039] sm:mt-2 sm:text-3xl">
            {inside.length}
            <span className="text-sm font-semibold text-[#9cb2ac] sm:text-lg"> /{roster.length}</span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#edf3f0]" aria-hidden>
            <div className="h-full rounded-full bg-[#0f8f87]" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-1.5 hidden text-[11px] text-[#7d948f] sm:block">{percent}% del padrón</p>
        </div>
        <div className="rounded-xl border border-[#e2e8e4] bg-white p-3 shadow-sm sm:p-4">
          <p className="text-xs font-medium text-[#657d77]">Faltan</p>
          <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-[#0a3039] sm:mt-2 sm:text-3xl">{missing.length}</p>
          <p className="mt-1 text-[11px] text-[#7d948f]">Sin ingreso registrado</p>
        </div>
        <div
          className={`rounded-xl border p-3 shadow-sm sm:p-4 ${
            insideWithDebt.length ? "border-amber-200/90 bg-[#fffdf9]" : "border-[#e2e8e4] bg-white"
          }`}
        >
          <p className="text-xs font-medium text-[#657d77]">Adentro con deuda</p>
          <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-[#0a3039] sm:mt-2 sm:text-3xl">{insideWithDebt.length}</p>
          <p className="mt-1 text-[11px] text-[#7d948f]">
            {insideWithDebt.length ? `S/ ${debtTotal} por cobrar` : "Nadie debe"}
          </p>
        </div>
      </section>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <nav aria-label="Filtrar lista" className="flex gap-1 rounded-xl bg-[#e7f0ed] p-1">
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={tabHref(t.id)}
              aria-current={view === t.id ? "page" : undefined}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                view === t.id ? "bg-white text-[#073b43] shadow-sm" : "text-[#52716f] hover:text-[#073b43]"
              }`}
            >
              {t.label} <span className="tabular-nums opacity-60">{t.count}</span>
            </Link>
          ))}
        </nav>
        <form className="flex gap-2 sm:w-80" action="/admin/ingresos">
          <input type="hidden" name="ver" value={view} />
          <label className="sr-only" htmlFor="ingresos-q">Buscar</label>
          <input id="ingresos-q" name="q" defaultValue={q} placeholder="Nombre, DNI o código" className={`${adminInputClass} py-2`} />
          <button type="submit" aria-label="Buscar" className="rounded-xl bg-[#e7f0ed] px-3 text-[#07333d] hover:bg-[#d7e8e3]">
            <Search size={16} aria-hidden />
          </button>
        </form>
      </div>

      {/* Lista (también es la versión impresa de respaldo) */}
      <section className="overflow-hidden rounded-xl border border-[#e2e8e4] bg-white shadow-sm print:border-0 print:shadow-none">
        <div className="hidden px-1 pb-3 print:block">
          <h1 className="text-lg font-bold">Radical 2.0 · {printTitle}</h1>
          <p className="text-xs">
            {inside.length} de {roster.length} ingresaron · impreso el {timeFmt.format(new Date())}
          </p>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#edf1ee] bg-[#fafcfb] text-[11px] uppercase tracking-wider text-[#78918a] print:bg-white">
            <tr>
              <th className="hidden w-8 px-3 py-2.5 print:table-cell" aria-label="Marcar" />
              <th className="px-4 py-2.5 font-semibold">Campista</th>
              <th className="hidden px-4 py-2.5 font-semibold sm:table-cell print:table-cell">Código</th>
              <th className="px-4 py-2.5 font-semibold">Pago</th>
              <th className="hidden px-4 py-2.5 font-semibold md:table-cell print:table-cell">Ingreso</th>
              <th className="w-8 print:hidden" aria-hidden />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf1ee]">
            {rows.map((r) => (
              <tr key={r.id} className="group relative transition hover:bg-[#fafcfb] print:break-inside-avoid">
                <td className="hidden px-3 py-2 print:table-cell">
                  <span className="inline-block size-4 border border-slate-500" aria-hidden />
                </td>
                <td className="px-4 py-2.5">
                  <Link href={`/admin/escaner?c=${r.ticket_code}`} className="after:absolute after:inset-0 print:after:hidden">
                    <span className="block font-semibold text-[#0a3039]">
                      {r.last_name}, {r.first_name}
                    </span>
                  </Link>
                  <span className="text-xs text-[#7d948f]">
                    DNI {r.document}
                    {isMinorAtCamp(r.birth_date) && <span className="ml-1.5 font-semibold text-amber-700">· Menor</span>}
                  </span>
                </td>
                <td className="hidden px-4 py-2.5 font-mono text-xs text-[#52716f] sm:table-cell print:table-cell">
                  {formatTicketCode(r.ticket_code)}
                </td>
                <td className="px-4 py-2.5">
                  <PayChip row={r} />
                </td>
                <td className="hidden px-4 py-2.5 text-xs text-[#52716f] md:table-cell print:table-cell">
                  {r.checkedInAt ? timeFmt.format(new Date(r.checkedInAt)) : "—"}
                </td>
                <td className="pr-3 text-[#9cb2ac] print:hidden">
                  <ChevronRight size={15} aria-hidden />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="py-10 text-center text-sm text-[#829992]">
            {q ? "Nadie coincide con la búsqueda." : view === "faltan" ? "Ya ingresaron todos." : "Todavía no ingresó nadie."}
          </p>
        )}
      </section>
    </div>
  );
}
