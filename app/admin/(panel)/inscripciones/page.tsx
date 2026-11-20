import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { ChevronLeft, ChevronRight, FileText, Search, X } from "lucide-react";
import { FlashMessage } from "../../components/FlashMessage";
import { PageHeader } from "../../components/PageHeader";
import { AccountChip } from "../../components/AccountChip";

export const metadata = { title: "Campistas | Radical 2.0" };

const PAGE_SIZE = 40;

type Estado = "todos" | "con_saldo" | "pagados" | "por_validar" | "observados" | "aprobados";
type Row = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  document: string;
  plan: string;
  price: number;
  amount: number;
  status: string;
  created_at: string;
};

const fold = (s: string) => s.toLocaleLowerCase("es").normalize("NFD").replace(/\p{M}/gu, "");
const dateFmt = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "numeric", month: "short" });

export default async function AdminInscripcionesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    estado?: string;
    status?: string;
    plan?: string;
    page?: string;
    error?: string;
    success?: string;
  }>;
}) {
  const params = await searchParams;
  const client = createClient(await cookies());

  // ?status= de enlaces antiguos sigue funcionando.
  const legacy: Record<string, Estado> = { pending: "por_validar", rejected: "observados", approved: "aprobados" };
  const estados: Estado[] = ["todos", "con_saldo", "pagados", "por_validar", "observados", "aprobados"];
  const estado: Estado = estados.includes(params.estado as Estado)
    ? (params.estado as Estado)
    : (legacy[params.status ?? ""] ?? "todos");
  const plan = params.plan === "preventa" || params.plan === "regular" ? params.plan : null;
  const q = (params.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);

  // El padrón cabe en memoria: así los filtros por saldo son exactos y los conteos salen de una vez.
  async function readAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
    const out: T[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await page(from, from + 999);
      if (error) throw error;
      if (!data) break;
      out.push(...data);
      if (data.length < 1000) break;
    }
    return out;
  }

  let loadError = false;
  let registrations: Row[] = [];
  let payments: { registration_id: string; amount: number; status: string; kind: string }[] = [];
  try {
    [registrations, payments] = await Promise.all([
      readAll<Row>((a, b) =>
        client
          .from("registrations")
          .select("id,first_name,last_name,email,document,plan,price,amount,status,created_at")
          .order("created_at", { ascending: false })
          .range(a, b),
      ),
      readAll<{ registration_id: string; amount: number; status: string; kind: string }>((a, b) =>
        client.from("registration_payments").select("registration_id,amount,status,kind").order("id").range(a, b),
      ),
    ]);
  } catch {
    loadError = true;
  }

  const extra = new Map<string, number>();
  const pendingPayment = new Set<string>();
  for (const p of payments) {
    if (p.kind === "additional" && p.status === "approved") extra.set(p.registration_id, (extra.get(p.registration_id) ?? 0) + p.amount);
    if (p.status === "pending") pendingPayment.add(p.registration_id);
  }

  const rows = registrations.map((r) => {
    const paid = r.status === "approved" ? r.amount + (extra.get(r.id) ?? 0) : 0;
    const due = Math.max(0, r.price - paid);
    const group: Exclude<Estado, "todos" | "aprobados"> =
      r.status === "pending" ? "por_validar" : r.status === "rejected" ? "observados" : due > 0 ? "con_saldo" : "pagados";
    return { ...r, paid, due, group, pendingPayment: pendingPayment.has(r.id) };
  });

  const inPlan = plan ? rows.filter((r) => r.plan === plan) : rows;
  const needle = fold(q);
  const searched = needle ? inPlan.filter((r) => fold(`${r.first_name} ${r.last_name} ${r.email} ${r.document}`).includes(needle)) : inPlan;
  const count = (g: Estado) =>
    g === "todos" ? searched.length : g === "aprobados" ? searched.filter((r) => r.status === "approved").length : searched.filter((r) => r.group === g).length;
  const filtered =
    estado === "todos" ? searched : estado === "aprobados" ? searched.filter((r) => r.status === "approved") : searched.filter((r) => r.group === estado);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function href(overrides: Partial<{ estado: Estado; plan: string | null; q: string; page: number }>) {
    const next = { estado, plan, q, page: 1, ...overrides };
    const qs = new URLSearchParams();
    if (next.estado && next.estado !== "todos") qs.set("estado", next.estado);
    if (next.plan) qs.set("plan", next.plan);
    if (next.q) qs.set("q", next.q);
    if (next.page && next.page > 1) qs.set("page", String(next.page));
    return `/admin/inscripciones${qs.size ? `?${qs}` : ""}`;
  }

  const chips: { id: Estado; label: string }[] = [
    { id: "todos", label: "Todos" },
    { id: "con_saldo", label: "Con saldo" },
    { id: "pagados", label: "Pagados" },
    { id: "por_validar", label: "Por validar" },
    { id: "observados", label: "Observados" },
  ];
  const chipClass = (active: boolean) =>
    `inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition ${
      active ? "bg-[#0a4249] text-white" : "bg-white text-[#2c4a47] ring-1 ring-inset ring-[#d8e3df] hover:bg-[#f1f6f4]"
    }`;
  const filtersOn = estado !== "todos" || plan || q;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Inscripciones"
        description="Quienes enviaron el formulario. Toca a una persona para ver su ficha completa."
        actions={
          <Link
            href="/admin/reportes"
            className="hidden items-center gap-2 rounded-lg bg-[#0b2d36] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#08232a] lg:inline-flex"
          >
            <FileText size={15} className="text-[#ffc629]" aria-hidden />
            Reportes PDF y Excel
          </Link>
        }
      />

      <FlashMessage error={params.error} success={params.success} />
      {loadError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          No se pudieron cargar las inscripciones. Recarga la página.
        </p>
      )}

      {/* Búsqueda */}
      <form action="/admin/inscripciones" className="relative" role="search">
        {estado !== "todos" && <input type="hidden" name="estado" value={estado} />}
        {plan && <input type="hidden" name="plan" value={plan} />}
        <label htmlFor="campistas-q" className="sr-only">Buscar por nombre, correo o documento</label>
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7d948f]" aria-hidden />
        <input
          id="campistas-q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Buscar por nombre, correo o DNI"
          autoComplete="off"
          enterKeyHint="search"
          className="min-h-12 w-full rounded-xl border border-[#cfdcd7] bg-white pl-11 pr-11 text-base text-[#082e39] outline-none placeholder:text-[#7d948f] focus:border-[#00a7ad] focus:ring-2 focus:ring-[#00a7ad]/20 sm:text-sm"
        />
        {q && (
          <Link href={href({ q: "" })} aria-label="Borrar búsqueda" className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-[#5f7a75] hover:bg-[#eef3f1]">
            <X size={17} aria-hidden />
          </Link>
        )}
      </form>

      {/* Filtros */}
      <nav aria-label="Filtrar campistas" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {chips.map((c) => (
          <Link key={c.id} href={href({ estado: c.id })} aria-current={estado === c.id ? "true" : undefined} className={chipClass(estado === c.id)}>
            {c.label}
            <span className={`tabular-nums ${estado === c.id ? "text-white/75" : "text-[#7d948f]"}`}>{count(c.id)}</span>
          </Link>
        ))}
        <span className="mx-1 w-px shrink-0 self-stretch bg-[#d8e3df]" aria-hidden />
        {(["preventa", "regular"] as const).map((p) => (
          <Link key={p} href={href({ plan: plan === p ? null : p })} aria-pressed={plan === p} className={chipClass(plan === p)}>
            {p === "preventa" ? "Preventa" : "Regular"}
          </Link>
        ))}
      </nav>

      <div className="flex items-center justify-between text-xs text-[#5f7a75]">
        <span>
          {filtered.length === 1 ? "1 campista" : `${filtered.length} campistas`}
          {filtersOn ? " con estos filtros" : ""}
        </span>
        {filtersOn && (
          <Link href="/admin/inscripciones" className="font-semibold text-[#007b80]">
            Quitar filtros
          </Link>
        )}
      </div>

      {/* Lista (celular: a todo el ancho; computadora: tabla) */}
      <section className="-mx-4 border-y border-[#e2e8e4] bg-white sm:mx-0 sm:rounded-2xl sm:border">
        <ul className="divide-y divide-[#eef2ef] lg:hidden">
          {visible.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/inscripciones/${r.id}`} className="flex min-h-[64px] items-center gap-3 px-4 py-2.5 active:bg-[#f3f7f5]">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-[#082e39]">
                    {r.last_name}, {r.first_name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-[#5f7a75]">
                    <span className="capitalize">{r.plan}</span>
                    {r.status === "approved" ? ` · pagó S/ ${r.paid} de ${r.price}` : ` · declaró S/ ${r.amount}`}
                    {r.pendingPayment && <span className="font-semibold text-amber-700"> · abono por revisar</span>}
                  </span>
                </span>
                <AccountChip status={r.status} due={r.due} />
                <ChevronRight size={16} className="shrink-0 text-[#a9bab5]" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>

        <table className="hidden w-full text-left text-sm lg:table">
          <thead className="border-b border-[#edf1ee] bg-[#fafcfb] text-[11px] uppercase tracking-wider text-[#78918a]">
            <tr>
              <th className="px-5 py-3 font-semibold">Campista</th>
              <th className="px-4 py-3 font-semibold">Plan</th>
              <th className="px-4 py-3 font-semibold">Pagado</th>
              <th className="px-4 py-3 font-semibold">Estado de cuenta</th>
              <th className="px-4 py-3 font-semibold">Inscrito</th>
              <th className="w-8" aria-hidden />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef2ef]">
            {visible.map((r) => (
              <tr key={r.id} className="relative transition hover:bg-[#fafcfb]">
                <td className="px-5 py-3">
                  <Link href={`/admin/inscripciones/${r.id}`} className="font-semibold text-[#082e39] after:absolute after:inset-0">
                    {r.last_name}, {r.first_name}
                  </Link>
                  <span className="block text-xs text-[#7d948f]">{r.email}</span>
                </td>
                <td className="px-4 py-3 capitalize text-[#2c4a47]">{r.plan}</td>
                <td className="px-4 py-3 tabular-nums text-[#2c4a47]">
                  {r.status === "approved" ? `S/ ${r.paid} de ${r.price}` : <span className="text-[#7d948f]">S/ {r.amount} declarado</span>}
                </td>
                <td className="px-4 py-3">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <AccountChip status={r.status} due={r.due} />
                    {r.pendingPayment && <span className="text-xs font-semibold text-amber-700">Abono por revisar</span>}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[#5f7a75]">{dateFmt.format(new Date(r.created_at))}</td>
                <td className="pr-4 text-[#a9bab5]">
                  <ChevronRight size={15} aria-hidden />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {visible.length === 0 && !loadError && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-[#2c4a47]">
              {filtersOn ? "Nadie coincide con estos filtros." : "Todavía no hay inscripciones."}
            </p>
            {filtersOn && (
              <Link href="/admin/inscripciones" className="mt-2 inline-block text-sm font-semibold text-[#007b80]">
                Ver todos los campistas
              </Link>
            )}
          </div>
        )}
      </section>

      {totalPages > 1 && (
        <nav aria-label="Páginas" className="flex items-center justify-between gap-3">
          {current > 1 ? (
            <Link href={href({ page: current - 1 })} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[#d8e3df] bg-white px-4 text-sm font-semibold text-[#0a3039]">
              <ChevronLeft size={16} aria-hidden /> Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-[#5f7a75]">
            Página {current} de {totalPages}
          </span>
          {current < totalPages ? (
            <Link href={href({ page: current + 1 })} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[#d8e3df] bg-white px-4 text-sm font-semibold text-[#0a3039]">
              Siguiente <ChevronRight size={16} aria-hidden />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
