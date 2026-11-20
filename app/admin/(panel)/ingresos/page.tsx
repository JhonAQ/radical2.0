import { cookies } from "next/headers";
import Link from "next/link";
import { ChevronRight, ScanLine, Search, X } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { loadCheckInRoster } from "@/utils/check-in-roster";
import { isMinorAtCamp } from "@/utils/minors";
import { formatTicketCode } from "@/utils/ticket";
import { PrintButton } from "../../components/PrintButton";
import { PageHeader } from "../../components/PageHeader";
import { AccountChip } from "../../components/AccountChip";

export const metadata = { title: "Control de ingreso | Radical 2.0" };

type View = "faltan" | "ingresaron" | "todos";

const timeFmt = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

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
  const fold = (s: string) => s.toLocaleLowerCase("es").normalize("NFD").replace(/\p{M}/gu, "");
  const needle = fold(q);
  const rows = needle
    ? base.filter((r) => fold(`${r.first_name} ${r.last_name} ${r.document} ${r.ticket_code}`).includes(needle.replace(/-/g, "")))
    : base;

  const tabs: { id: View; label: string; count: number }[] = [
    { id: "faltan", label: "Faltan", count: missing.length },
    { id: "ingresaron", label: "Ingresaron", count: inside.length },
    { id: "todos", label: "Todos", count: roster.length },
  ];
  const tabHref = (id: View, query = q) => `/admin/ingresos?ver=${id}${query ? `&q=${encodeURIComponent(query)}` : ""}`;
  const printTitle = view === "faltan" ? "Faltan ingresar" : view === "ingresaron" ? "Ingresaron" : "Padrón completo";
  const chipClass = (on: boolean) =>
    `inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition ${
      on ? "bg-[#0a4249] text-white" : "bg-white text-[#2c4a47] ring-1 ring-inset ring-[#d8e3df] hover:bg-[#f1f6f4]"
    }`;

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <PageHeader
          title="Control de ingreso"
          description="Quién llegó, quién falta y quién entró con saldo pendiente."
          actions={
            <div className="hidden items-center gap-2.5 lg:flex">
              <PrintButton />
              <Link
                href="/admin/escaner"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0a4249] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#08363c]"
              >
                <ScanLine size={15} aria-hidden />
                Abrir escáner
              </Link>
            </div>
          }
        />
      </div>

      {/* Resumen en una sola tarjeta */}
      <section aria-label="Resumen" className="rounded-2xl border border-[#e2e8e4] bg-white p-4 sm:p-5 print:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-base text-[#2c4a47]">
            Ingresaron <strong className="text-2xl font-black tabular-nums text-[#0a3039]">{inside.length}</strong> de{" "}
            <span className="tabular-nums">{roster.length}</span>
          </p>
          <span className="text-sm font-semibold tabular-nums text-[#5f7a75]">{percent}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf3f0]" aria-hidden>
          <div className="h-full rounded-full bg-[#0f8f87]" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-sm text-[#4d6a64]">
          Faltan {missing.length}
          {insideWithDebt.length > 0 ? (
            <>
              {" · "}
              <Link href="/admin/ingresos?ver=ingresaron" className="font-semibold text-[#8a4b07] underline decoration-amber-300 underline-offset-4">
                {insideWithDebt.length === 1 ? "1 adentro con deuda" : `${insideWithDebt.length} adentro con deuda`} (S/ {debtTotal})
              </Link>
            </>
          ) : (
            " · nadie adentro con deuda"
          )}
        </p>
      </section>

      {/* Búsqueda y filtros */}
      <form className="relative print:hidden" action="/admin/ingresos" role="search">
        <input type="hidden" name="ver" value={view} />
        <label className="sr-only" htmlFor="ingresos-q">
          Buscar por nombre, DNI o código
        </label>
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7d948f]" aria-hidden />
        <input
          id="ingresos-q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Nombre, DNI o código"
          autoComplete="off"
          enterKeyHint="search"
          className="min-h-12 w-full rounded-xl border border-[#cfdcd7] bg-white pl-11 pr-11 text-base text-[#082e39] outline-none placeholder:text-[#7d948f] focus:border-[#00a7ad] focus:ring-2 focus:ring-[#00a7ad]/20 sm:max-w-md sm:text-sm"
        />
        {q && (
          <Link
            href={tabHref(view, "")}
            aria-label="Borrar búsqueda"
            className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-[#5f7a75] hover:bg-[#eef3f1] sm:left-[calc(28rem-2.75rem)] sm:right-auto"
          >
            <X size={17} aria-hidden />
          </Link>
        )}
      </form>

      <nav aria-label="Filtrar lista" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 print:hidden">
        {tabs.map((t) => (
          <Link key={t.id} href={tabHref(t.id)} aria-current={view === t.id ? "true" : undefined} className={chipClass(view === t.id)}>
            {t.label}
            <span className={`tabular-nums ${view === t.id ? "text-white/75" : "text-[#7d948f]"}`}>{t.count}</span>
          </Link>
        ))}
      </nav>

      {/* Lista. En celular, filas; en computadora e impresión, la tabla (también es el respaldo en papel). */}
      <section className="-mx-4 border-y border-[#e2e8e4] bg-white sm:mx-0 sm:rounded-2xl sm:border print:mx-0 print:border-0">
        <ul className="divide-y divide-[#eef2ef] lg:hidden print:hidden">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/escaner?c=${r.ticket_code}`} className="flex min-h-[64px] items-center gap-3 px-4 py-2.5 active:bg-[#f3f7f5]">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-[#082e39]">
                    {r.last_name}, {r.first_name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-[#5f7a75]">
                    DNI {r.document}
                    {isMinorAtCamp(r.birth_date) && <span className="font-semibold text-amber-700"> · Menor</span>}
                    {r.checkedInAt && ` · entró ${timeFmt.format(new Date(r.checkedInAt))}`}
                  </span>
                </span>
                <AccountChip status={r.status} due={r.remaining} />
                <ChevronRight size={16} className="shrink-0 text-[#a9bab5]" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden px-1 pb-3 print:block">
          <h1 className="text-lg font-bold">Radical 2.0 · {printTitle}</h1>
          <p className="text-xs">
            {inside.length} de {roster.length} ingresaron · impreso el {timeFmt.format(new Date())}
          </p>
        </div>
        <table className="hidden w-full text-left text-sm lg:table print:table">
          <thead className="border-b border-[#edf1ee] bg-[#fafcfb] text-[11px] uppercase tracking-wider text-[#78918a] print:bg-white">
            <tr>
              <th className="hidden w-8 px-3 py-2.5 print:table-cell" aria-label="Marcar" />
              <th className="px-4 py-2.5 font-semibold">Campista</th>
              <th className="px-4 py-2.5 font-semibold">Código</th>
              <th className="px-4 py-2.5 font-semibold">Pago</th>
              <th className="px-4 py-2.5 font-semibold">Ingreso</th>
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
                <td className="px-4 py-2.5 font-mono text-xs text-[#52716f]">{formatTicketCode(r.ticket_code)}</td>
                <td className="px-4 py-2.5">
                  <AccountChip status={r.status} due={r.remaining} />
                </td>
                <td className="px-4 py-2.5 text-xs text-[#52716f]">{r.checkedInAt ? timeFmt.format(new Date(r.checkedInAt)) : "—"}</td>
                <td className="pr-3 text-[#9cb2ac] print:hidden">
                  <ChevronRight size={15} aria-hidden />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="py-10 text-center text-sm text-[#5f7a75]">
            {q ? "Nadie coincide con la búsqueda." : view === "faltan" ? "Ya ingresaron todos." : "Todavía no ingresó nadie."}
          </p>
        )}
      </section>
    </div>
  );
}
