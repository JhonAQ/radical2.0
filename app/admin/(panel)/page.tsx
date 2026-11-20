import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { BadgeCheck, ChevronRight, DoorOpen } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { PageHeader } from "../components/PageHeader";
import { loadCheckInCounts } from "@/utils/check-in-roster";
import { DEFAULT_PREVENTA_DEADLINE, preventaDates } from "@/utils/preventa";

const money = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 });
const limaDay = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" });
const shortDate = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "numeric", month: "short" });

type Row = { id: string; first_name: string; last_name: string; status: string; plan: string; price: number; amount: number; created_at: string };

/** Días enteros entre hoy y una fecha, en hora de Lima. */
function daysUntil(iso: string) {
  const today = Date.parse(`${limaDay.format(new Date())}T00:00:00-05:00`);
  return Math.round((Date.parse(iso) - today) / 86_400_000);
}

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; selected?: string }>;
}) {
  const params = await searchParams;

  // Enlaces antiguos con ?view=
  if (params.view === "registrations") {
    redirect(params.selected ? `/admin/inscripciones/${encodeURIComponent(params.selected)}` : "/admin/inscripciones");
  }
  if (params.view === "payments") redirect("/admin/pagos");
  if (params.view === "team") redirect("/admin/equipo");
  if (params.view === "account") redirect("/admin/cuenta");

  const client = createClient(await cookies());

  // Supabase corta en 1000 filas por consulta: se lee por páginas para no truncar los totales.
  async function readAll<T>(build: () => PromiseLike<{ data: T[] | null }> & { range: (a: number, b: number) => PromiseLike<{ data: T[] | null }> }) {
    const out: T[] = [];
    for (let from = 0; ; from += 1000) {
      const { data } = await build().range(from, from + 999);
      if (!data) break;
      out.push(...data);
      if (data.length < 1000) break;
    }
    return out;
  }

  const [registrations, payments, checkInCounts, { data: settings }] = await Promise.all([
    readAll<Row>(() =>
      client.from("registrations").select("id,first_name,last_name,status,plan,price,amount,created_at").order("created_at", { ascending: false }),
    ),
    readAll<{ registration_id: string; amount: number; status: string; kind: string; created_at: string }>(() =>
      client.from("registration_payments").select("registration_id,amount,status,kind,created_at").order("id", { ascending: true }),
    ),
    loadCheckInCounts(client),
    client.from("camp_settings").select("preventa_deadline").eq("id", true).maybeSingle(),
  ]);

  const extraPaid = new Map<string, number>();
  for (const p of payments) {
    if (p.kind === "additional" && p.status === "approved") extraPaid.set(p.registration_id, (extraPaid.get(p.registration_id) ?? 0) + p.amount);
  }

  const today = limaDay.format(new Date());
  let collected = 0;
  let owed = 0;
  let paidInFull = 0;
  let withBalance = 0;
  let pendingRegs = 0;
  let rejected = 0;
  let preventa = 0;
  let newToday = 0;
  for (const r of registrations) {
    if (r.plan === "preventa") preventa += 1;
    if (limaDay.format(new Date(r.created_at)) === today) newToday += 1;
    if (r.status === "approved") {
      const paid = r.amount + (extraPaid.get(r.id) ?? 0);
      collected += paid;
      const due = Math.max(0, r.price - paid);
      owed += due;
      if (due > 0) withBalance += 1;
      else paidInFull += 1;
    } else if (r.status === "pending") pendingRegs += 1;
    else rejected += 1;
  }

  const pendingItems = [
    ...registrations.filter((r) => r.status === "pending").map((r) => ({ amount: r.amount, date: r.created_at })),
    ...payments.filter((p) => p.status === "pending").map((p) => ({ amount: p.amount, date: p.created_at })),
  ];
  const pendingCount = pendingItems.length;
  const pendingAmount = pendingItems.reduce((n, i) => n + i.amount, 0);
  const oldest = pendingItems.reduce<string | null>((min, i) => (!min || i.date < min ? i.date : min), null);
  const oldestDays = oldest ? Math.max(0, -daysUntil(oldest)) : 0;

  const deadline = settings?.preventa_deadline ?? DEFAULT_PREVENTA_DEADLINE;
  const preventaLeft = daysUntil(deadline);
  const { lastDay } = preventaDates(deadline);
  const recent = registrations.slice(0, 5);
  const total = registrations.length;
  const checkInPercent = checkInCounts.total ? Math.round((checkInCounts.checkedIn / checkInCounts.total) * 100) : 0;

  const breakdown = [
    { label: "Pagaron completo", value: paidInFull, href: "/admin/inscripciones?estado=pagados", dot: "bg-emerald-500" },
    { label: "Con saldo pendiente", value: withBalance, href: "/admin/inscripciones?estado=con_saldo", dot: "bg-amber-400" },
    { label: "Pago inicial por validar", value: pendingRegs, href: "/admin/inscripciones?estado=por_validar", dot: "bg-sky-400" },
    { label: "Observados", value: rejected, href: "/admin/inscripciones?estado=observados", dot: "bg-rose-400" },
  ];

  const card = "rounded-2xl border border-[#e2e8e4] bg-white";

  return (
    <div className="space-y-4 lg:space-y-6">
      <PageHeader title="Inicio" description="Lo que hay que hacer hoy y los números del campamento." />

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr] lg:gap-6">
        <div className="space-y-4 lg:space-y-6">
          {/* ── Por hacer ── */}
          {pendingCount > 0 ? (
            <section className="rounded-2xl border border-amber-200 bg-[#fff8ea] p-4 sm:p-5">
              <h2 className="text-lg font-bold text-[#5c3400]">
                {pendingCount === 1 ? "1 comprobante por validar" : `${pendingCount} comprobantes por validar`}
              </h2>
              <p className="mt-1 text-sm text-[#7a4b0d]">
                S/ {money.format(pendingAmount)} por confirmar
                {oldestDays > 0 && ` · el más antiguo espera desde hace ${oldestDays === 1 ? "1 día" : `${oldestDays} días`}`}.
              </p>
              <Link
                href="/admin/pagos?empezar=1"
                className="mt-4 flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-[#b45309] px-4 text-base font-bold text-white transition hover:bg-[#9a4708] active:bg-[#8a3f07] sm:inline-flex"
              >
                Validar ahora
                <ChevronRight size={18} aria-hidden />
              </Link>
            </section>
          ) : (
            <section className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm font-semibold text-emerald-900">
              <BadgeCheck size={20} className="shrink-0" aria-hidden />
              Todo al día: no hay comprobantes por validar.
            </section>
          )}

          {checkInCounts.checkedIn > 0 && (
            <Link href="/admin/ingresos" className={`${card} flex items-center gap-4 p-4 transition hover:border-[#008e95]/40`}>
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e3f4ef] text-[#0a524a]">
                <DoorOpen size={19} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[#0a3039]">
                  Ingresaron {checkInCounts.checkedIn} de {checkInCounts.total} · faltan {checkInCounts.total - checkInCounts.checkedIn}
                </span>
                <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[#edf3f0]">
                  <span className="block h-full rounded-full bg-[#0f8f87]" style={{ width: `${checkInPercent}%` }} />
                </span>
              </span>
              <ChevronRight size={16} className="shrink-0 text-[#9cb2ac]" aria-hidden />
            </Link>
          )}

          {/* ── Dinero ── */}
          <section className={`${card} p-4 sm:p-5`} aria-labelledby="dinero">
            <h2 id="dinero" className="text-base font-bold text-[#0a3039]">Dinero</h2>
            <dl className="mt-3 divide-y divide-[#eef2ef]">
              <div className="flex items-baseline justify-between gap-3 py-2.5">
                <dt className="text-sm text-[#4d6a64]">Recaudado (aprobado)</dt>
                <dd className="text-xl font-bold tabular-nums text-[#0a3039]">S/ {money.format(collected)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 py-2.5">
                <dt className="text-sm text-[#4d6a64]">
                  <Link href="/admin/inscripciones?estado=con_saldo" className="underline decoration-[#c9d8d3] underline-offset-4 hover:text-[#0a3039]">
                    Por cobrar a inscritos
                  </Link>
                </dt>
                <dd className="text-xl font-bold tabular-nums text-[#8a4b07]">S/ {money.format(owed)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 py-2.5">
                <dt className="text-sm text-[#4d6a64]">En comprobantes sin validar</dt>
                <dd className="text-base font-semibold tabular-nums text-[#4d6a64]">S/ {money.format(pendingAmount)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="space-y-4 lg:space-y-6">
          {/* ── Inscritos ── */}
          <section className={`${card} p-4 sm:p-5`} aria-labelledby="inscritos">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="inscritos" className="text-base font-bold text-[#0a3039]">
                <span className="tabular-nums">{total}</span> inscritos
              </h2>
              {newToday > 0 && <span className="text-sm font-semibold text-[#0a7a6f]">+{newToday} hoy</span>}
            </div>
            <ul className="mt-2 divide-y divide-[#eef2ef]">
              {breakdown.map((b) => (
                <li key={b.label}>
                  <Link href={b.href} className="flex min-h-11 items-center gap-3 py-1 text-sm transition hover:text-[#007b80]">
                    <span className={`size-2 shrink-0 rounded-full ${b.dot}`} aria-hidden />
                    <span className="flex-1 text-[#2c4a47]">{b.label}</span>
                    <span className="font-bold tabular-nums text-[#0a3039]">{b.value}</span>
                    <ChevronRight size={15} className="shrink-0 text-[#b3c4bf]" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-[#eef2ef] pt-3 text-xs text-[#5f7a75]">
              Preventa {preventa} · Regular {total - preventa}.{" "}
              {preventaLeft <= 0
                ? "La preventa ya cerró."
                : preventaLeft === 1
                  ? "Hoy es el último día de preventa."
                  : `Último día de preventa: ${lastDay} (${preventaLeft === 2 ? "mañana" : `en ${preventaLeft - 1} días`}).`}
            </p>
          </section>

          {/* ── Últimas inscripciones ── */}
          <section className={card} aria-labelledby="ultimas">
            <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5">
              <h2 id="ultimas" className="text-base font-bold text-[#0a3039]">Últimas inscripciones</h2>
              <Link href="/admin/inscripciones" className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-[#007b80]">
                Ver todas
                <ChevronRight size={15} aria-hidden />
              </Link>
            </div>
            <ul className="mt-1 divide-y divide-[#eef2ef] px-4 pb-2 sm:px-5">
              {recent.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/inscripciones/${r.id}`} className="flex min-h-14 items-center gap-3 py-2">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#0a3039]">
                        {r.first_name} {r.last_name}
                      </span>
                      <span className="block text-xs text-[#6b8580]">
                        {shortDate.format(new Date(r.created_at))} · <span className="capitalize">{r.plan}</span>
                      </span>
                    </span>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
              {recent.length === 0 && <li className="py-8 text-center text-sm text-[#6b8580]">Todavía no hay inscripciones.</li>}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
