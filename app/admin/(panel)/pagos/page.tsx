import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { whatsappUrl } from "@/utils/whatsapp";
import { WhatsAppMark } from "@/components/common/WhatsAppMark";
import { type Registration, type RegistrationPayment } from "../../types";
import { FlashMessage } from "../../components/FlashMessage";
import { StatusBadge } from "../../components/StatusBadge";
import { PageHeader } from "../../components/PageHeader";
import { ObservedNotice } from "../../components/ObservedNotice";
import { review, reviewPayment } from "../../actions";
import { ReceiptViewer } from "../../components/ReceiptViewer";
import { ReviewResolutionForm } from "../../components/ReviewResolutionForm";
import { AlertTriangle, BadgeCheck, ChevronLeft, ChevronRight, Search, UserRound, X } from "lucide-react";

export const metadata = { title: "Validar comprobantes | Radical 2.0" };

const PAGE_SIZE = 30;
const money = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 });
const shortDate = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "numeric", month: "short" });
const dateTime = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

type Status = "pending" | "approved" | "rejected" | "all";

export default async function AdminPagosPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    q?: string;
    page?: string;
    review?: string;
    kind?: "initial" | "additional";
    empezar?: string;
    observado?: string;
    tipo?: string;
    error?: string;
    success?: string;
  }>;
}) {
  const params = await searchParams;
  const client = createClient(await cookies());
  const {
    data: { user: viewer },
  } = await client.auth.getUser();
  const { data: viewerRole } = viewer
    ? await client.from("admin_users").select("role").eq("user_id", viewer.id).maybeSingle()
    : { data: null };
  // Un pago ya aprobado solo lo cambia la cuenta maestra.
  const isMaster = viewerRole?.role === "master";

  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  // Sin filtro explícito se abre la cola de pendientes (lo que tesorería tiene que atender).
  const status: Status = params.status === "approved" || params.status === "rejected" || params.status === "all" ? params.status : "pending";

  type PaymentRegistration = Pick<
    Registration,
    "id" | "first_name" | "last_name" | "email" | "document" | "amount" | "price" | "status" | "created_at" | "plan" | "phone" | "receipt_path" | "review_note" | "payment_method"
  >;
  const [{ data: rawRows }, { data: rawPayments }] = await Promise.all([
    client
      .from("registrations")
      .select("id,first_name,last_name,email,document,amount,price,status,created_at,plan,phone,receipt_path,review_note,payment_method"),
    client
      .from("registration_payments")
      .select("id,registration_id,amount,status,kind,method,created_at,receipt_path,review_note")
      .order("created_at", { ascending: false })
      .limit(2000),
  ]);
  const registrationMap: Record<string, PaymentRegistration> = Object.fromEntries(
    ((rawRows as PaymentRegistration[] | null) || []).map((r) => [r.id, r]),
  );
  const payments = (rawPayments as (RegistrationPayment & { receipt_path?: string | null; method?: string })[]) || [];

  // Lo ya aprobado de cada inscripción, para mostrar el saldo al decidir.
  const approvedExtra = new Map<string, number>();
  for (const p of payments) {
    if (p.kind === "additional" && p.status === "approved") approvedExtra.set(p.registration_id, (approvedExtra.get(p.registration_id) ?? 0) + p.amount);
  }

  type UnifiedItem = {
    id: string;
    registrationId: string;
    kindRaw: "initial" | "additional";
    name: string;
    amount: number;
    status: string;
    kind: string;
    date: string;
    email: string;
    document: string;
    /** Efectivo registrado en persona: no hay foto que revisar. */
    hasReceipt: boolean;
  };

  const unified: UnifiedItem[] = [];
  for (const reg of Object.values(registrationMap)) {
    unified.push({
      id: reg.id,
      registrationId: reg.id,
      kindRaw: "initial",
      name: `${reg.first_name} ${reg.last_name}`,
      amount: reg.amount,
      status: reg.status,
      kind: reg.payment_method === "efectivo" ? "Pago inicial en efectivo" : "Pago inicial",
      date: reg.created_at,
      email: reg.email,
      document: reg.document || "",
      hasReceipt: Boolean(reg.receipt_path),
    });
  }
  for (const p of payments) {
    if (p.kind === "replacement" && p.status === "approved") continue;
    const reg = registrationMap[p.registration_id];
    unified.push({
      id: p.id,
      registrationId: p.registration_id,
      kindRaw: "additional",
      name: reg ? `${reg.first_name} ${reg.last_name}` : "Participante",
      amount: p.amount,
      status: p.status,
      kind: p.kind === "replacement" ? "Comprobante corregido" : p.method === "efectivo" ? "Pago en efectivo" : "Abono",
      date: p.created_at,
      email: reg?.email || "",
      document: reg?.document || "",
      hasReceipt: Boolean(p.receipt_path),
    });
  }

  const counts = {
    pending: unified.filter((i) => i.status === "pending").length,
    approved: unified.filter((i) => i.status === "approved").length,
    rejected: unified.filter((i) => i.status === "rejected").length,
    all: unified.length,
  };

  const fold = (v: string) => v.toLocaleLowerCase("es").normalize("NFD").replace(/\p{M}/gu, "");
  const q = (params.q ?? "").trim();
  const needle = fold(q);
  const inStatus = status === "all" ? unified : unified.filter((i) => i.status === status);
  const filtered = needle ? inStatus.filter((p) => fold(`${p.name} ${p.email} ${p.document}`).includes(needle)) : inStatus;
  // La cola de pendientes se atiende por orden de llegada; el resto, lo más reciente primero.
  filtered.sort((a, b) => (status === "pending" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const paginatedItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function buildHref(overrides: Record<string, string | undefined>) {
    const merged = { q: params.q, status: params.status, page: String(current), ...overrides };
    const qs = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => {
      // "all" se conserva en el estado: sin él se abriría la cola de pendientes.
      if (v && (k === "status" || v !== "all") && !(k === "page" && v === "1")) qs.set(k, v);
    });
    return `/admin/pagos${qs.toString() ? `?${qs.toString()}` : ""}`;
  }

  const queue = filtered.filter((i) => i.hasReceipt && i.status === "pending");
  const queueAmount = queue.reduce((n, i) => n + i.amount, 0);

  // Desde Inicio: entra directo al primer comprobante de la cola.
  if (params.empezar && !params.review) {
    redirect(queue[0] ? buildHref({ review: queue[0].id, kind: queue[0].kindRaw, empezar: undefined }) : "/admin/pagos");
  }

  // ── Comprobante abierto ──
  type Active = {
    isInitial: boolean;
    id: string;
    registrationId: string;
    name: string;
    firstName: string;
    phone: string;
    plan: string;
    price: number;
    amount: number;
    status: string;
    kind: string;
    date: string;
    note: string;
    receiptUrl: string;
    /** Aprobado antes de este comprobante. */
    paidBefore: number;
    /** Nota con la que se observó el pago inicial (cuando esto es su corrección). */
    previousNote: string;
    paymentKind: string;
    regStatus: string;
  };
  let active: Active | null = null;
  if (params.review) {
    if (params.kind === "initial") {
      const reg = registrationMap[params.review];
      if (reg?.receipt_path) {
        const { data: signed } = await client.storage.from("registration-receipts").createSignedUrl(reg.receipt_path, 600);
        if (signed?.signedUrl) {
          active = {
            isInitial: true,
            id: reg.id,
            registrationId: reg.id,
            name: `${reg.first_name} ${reg.last_name}`,
            firstName: reg.first_name,
            phone: reg.phone,
            plan: reg.plan,
            price: reg.price,
            amount: reg.amount,
            status: reg.status,
            kind: reg.payment_method === "efectivo" ? "Pago inicial en efectivo" : "Pago inicial de la inscripción",
            date: reg.created_at,
            note: reg.review_note || "",
            receiptUrl: signed.signedUrl,
            paidBefore: 0,
            previousNote: "",
            paymentKind: "initial",
            regStatus: reg.status,
          };
        }
      }
    } else {
      const pay = payments.find((p) => p.id === params.review);
      const reg = pay ? registrationMap[pay.registration_id] : undefined;
      if (pay?.receipt_path && reg) {
        const { data: signed } = await client.storage.from("registration-receipts").createSignedUrl(pay.receipt_path, 600);
        if (signed?.signedUrl) {
          const replacement = pay.kind === "replacement";
          active = {
            isInitial: false,
            id: pay.id,
            registrationId: pay.registration_id,
            name: `${reg.first_name} ${reg.last_name}`,
            firstName: reg.first_name,
            phone: reg.phone,
            plan: reg.plan,
            price: reg.price,
            amount: pay.amount,
            status: pay.status,
            kind: replacement ? "Comprobante corregido" : "Abono",
            date: pay.created_at,
            note: pay.review_note || "",
            receiptUrl: signed.signedUrl,
            // La corrección reemplaza al pago inicial: antes no había nada aprobado.
            paidBefore: replacement ? 0 : (reg.status === "approved" ? reg.amount : 0) + (approvedExtra.get(reg.id) ?? 0) - (pay.status === "approved" ? pay.amount : 0),
            previousNote: replacement ? reg.review_note || "" : "",
            paymentKind: pay.kind,
            regStatus: reg.status,
          };
        }
      }
    }
  }

  const inQueue = status === "pending" && active !== null;
  const currentIndex = active ? queue.findIndex((i) => i.id === active.id) : -1;
  const nextItem = inQueue
    ? (queue.slice(currentIndex + 1).find((i) => i.id !== active?.id) ?? queue.find((i) => i.id !== active?.id))
    : undefined;
  const listHref = buildHref({ review: undefined, kind: undefined });
  const currentHref = active ? buildHref({ review: active.id, kind: active.isInitial ? "initial" : "additional" }) : listHref;
  const nextHref = nextItem ? buildHref({ review: nextItem.id, kind: nextItem.kindRaw }) : null;

  const chips: { id: Status; label: string }[] = [
    { id: "pending", label: "Por validar" },
    { id: "rejected", label: "Observados" },
    { id: "approved", label: "Aprobados" },
    { id: "all", label: "Todos" },
  ];
  const chipClass = (on: boolean) =>
    `inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition ${
      on ? "bg-[#0a4249] text-white" : "bg-white text-[#2c4a47] ring-1 ring-inset ring-[#d8e3df] hover:bg-[#f1f6f4]"
    }`;

  const after = active ? active.paidBefore + (active.status === "approved" ? 0 : active.amount) : 0;
  const dueAfter = active ? Math.max(0, active.price - after) : 0;
  // Lo mismo que rechaza la base de datos al aprobar un abono: se avisa antes de intentarlo.
  const blockReason =
    !active || active.status === "approved" || active.paymentKind !== "additional"
      ? null
      : active.regStatus !== "approved"
        ? "El pago inicial de esta inscripción aún no está aprobado. Valídalo primero; este abono se podrá aprobar después."
        : active.paidBefore + active.amount > active.price
          ? `Supera el saldo pendiente (S/ ${Math.max(0, active.price - active.paidBefore)}). No se puede aprobar; obsérvalo para que lo corrija.`
          : null;

  return (
    <div className="space-y-4">
      <PageHeader title="Validar comprobantes" description="Revisa cada comprobante y apruébalo u obsérvalo. Al terminar uno, se abre el siguiente." />

      {!active && (
        <>
          <ObservedNotice client={client} id={params.observado} tipo={params.tipo} />
          <FlashMessage error={params.error} success={params.success} fallbackError="Ocurrió un error al procesar el comprobante." />
        </>
      )}

      {/* La tarea principal: entrar a la cola */}
      {status === "pending" && !needle && (
        queue.length > 0 ? (
          <Link
            href={buildHref({ review: queue[0].id, kind: queue[0].kindRaw })}
            className="flex min-h-[72px] items-center gap-4 rounded-2xl bg-[#00766f] px-4 text-white shadow-sm transition hover:bg-[#00635d] active:bg-[#005751] sm:max-w-md"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-bold">
                Validar {queue.length === 1 ? "1 comprobante" : `${queue.length} comprobantes`}
              </span>
              <span className="block text-sm text-white/85">S/ {money.format(queueAmount)} por confirmar · del más antiguo al más nuevo</span>
            </span>
            <ChevronRight size={22} className="shrink-0" aria-hidden />
          </Link>
        ) : (
          <p className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm font-semibold text-emerald-900">
            <BadgeCheck size={20} className="shrink-0" aria-hidden />
            Todo al día: no hay comprobantes por validar.
          </p>
        )
      )}

      <form action="/admin/pagos" className="relative" role="search">
        <input type="hidden" name="status" value={status} />
        <label htmlFor="pagos-q" className="sr-only">Buscar por nombre, correo o DNI</label>
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7d948f]" aria-hidden />
        <input
          id="pagos-q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Buscar por nombre, correo o DNI"
          autoComplete="off"
          enterKeyHint="search"
          className="min-h-12 w-full rounded-xl border border-[#cfdcd7] bg-white pl-11 pr-11 text-base text-[#082e39] outline-none placeholder:text-[#7d948f] focus:border-[#00a7ad] focus:ring-2 focus:ring-[#00a7ad]/20 sm:max-w-md sm:text-sm"
        />
        {q && (
          <Link href={buildHref({ q: undefined, page: "1" })} aria-label="Borrar búsqueda" className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-[#5f7a75] hover:bg-[#eef3f1] sm:left-[calc(28rem-2.75rem)] sm:right-auto">
            <X size={17} aria-hidden />
          </Link>
        )}
      </form>

      <nav aria-label="Filtrar comprobantes" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {chips.map((c) => (
          <Link key={c.id} href={buildHref({ status: c.id, page: "1" })} aria-current={status === c.id ? "true" : undefined} className={chipClass(status === c.id)}>
            {c.label}
            <span className={`tabular-nums ${status === c.id ? "text-white/75" : "text-[#7d948f]"}`}>{counts[c.id]}</span>
          </Link>
        ))}
      </nav>

      <section className="-mx-4 border-y border-[#e2e8e4] bg-white sm:mx-0 sm:rounded-2xl sm:border">
        <ul className="divide-y divide-[#eef2ef]">
          {paginatedItems.map((p) => {
            const target = p.hasReceipt ? buildHref({ review: p.id, kind: p.kindRaw }) : `/admin/inscripciones/${p.registrationId}`;
            return (
              <li key={`${p.kindRaw}-${p.id}`}>
                <Link href={target} className="flex min-h-[64px] items-center gap-3 px-4 py-2.5 transition hover:bg-[#fafcfb] active:bg-[#f3f7f5] sm:px-5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-[#082e39]">{p.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-[#5f7a75]">
                      {p.kind} · {shortDate.format(new Date(p.date))}
                      {!p.hasReceipt && " · recibido en persona"}
                    </span>
                  </span>
                  {status !== "pending" && <StatusBadge status={p.status} />}
                  <span className="shrink-0 text-base font-bold tabular-nums text-[#0b2d36]">S/ {p.amount}</span>
                  <ChevronRight size={16} className="shrink-0 text-[#a9bab5]" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
        {paginatedItems.length === 0 && (
          <p className="px-6 py-12 text-center text-sm text-[#5f7a75]">
            {needle ? "No hay comprobantes que coincidan con la búsqueda." : status === "pending" ? "No queda nada por validar." : "No hay comprobantes en esta lista."}
          </p>
        )}
      </section>

      {totalPages > 1 && (
        <nav aria-label="Páginas" className="flex items-center justify-between gap-3">
          {current > 1 ? (
            <Link href={buildHref({ page: String(current - 1) })} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[#d8e3df] bg-white px-4 text-sm font-semibold text-[#0a3039]">
              <ChevronLeft size={16} aria-hidden /> Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-[#5f7a75]">
            Página {current} de {totalPages}
          </span>
          {current < totalPages ? (
            <Link href={buildHref({ page: String(current + 1) })} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[#d8e3df] bg-white px-4 text-sm font-semibold text-[#0a3039]">
              Siguiente <ChevronRight size={16} aria-hidden />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}

      {/* ── Comprobante abierto: pantalla completa en celular, ventana en computadora ── */}
      {active && (
        <div role="dialog" aria-modal="true" aria-labelledby="review-title" className="fixed inset-0 z-50 flex bg-[#03232b]/70 lg:items-center lg:justify-center lg:p-6">
          <div className="flex h-full w-full flex-col bg-[#fbfcf8] lg:h-auto lg:max-h-[94vh] lg:max-w-5xl lg:overflow-hidden lg:rounded-2xl">
            <header className="flex items-center gap-1 border-b border-[#e3eae5] bg-white px-1.5 pb-1.5 pt-[calc(0.375rem+env(safe-area-inset-top))] lg:px-3 lg:pt-1.5">
              <Link href={listHref} aria-label="Cerrar y volver a la lista" className="grid size-11 shrink-0 place-items-center rounded-xl text-[#0a3039] hover:bg-[#eef3f1]">
                <X size={21} aria-hidden />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[#5f7a75]">
                  {inQueue && currentIndex >= 0 ? `Comprobante ${currentIndex + 1} de ${queue.length}` : "Comprobante"}
                </p>
                <h2 id="review-title" className="truncate text-base font-bold text-[#082e39]">
                  {active.name}
                </h2>
              </div>
              {nextHref && active.status === "pending" && (
                <Link href={nextHref} className="inline-flex min-h-11 shrink-0 items-center gap-0.5 rounded-xl px-3 text-sm font-semibold text-[#2c4a47] hover:bg-[#eef3f1]">
                  Saltar
                  <ChevronRight size={16} aria-hidden />
                </Link>
              )}
            </header>

            {/* Lo que pasó con el comprobante anterior de la cola */}
            <FlashMessage success={params.success} />
            <ObservedNotice client={client} id={params.observado} tipo={params.tipo} compact />

            <div className="flex flex-1 flex-col overflow-y-auto lg:grid lg:grid-cols-[1.15fr_1fr] lg:grid-rows-[auto_1fr]">
              {/* Lo declarado, para comparar con la imagen */}
              <section className="order-1 border-b border-[#e3eae5] bg-white px-4 py-3 lg:col-start-2 lg:row-start-1 lg:border-b-0 lg:px-6 lg:pt-5">
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-[#4d6a64]">
                      {active.kind} · <span className="capitalize">{active.plan}</span>
                    </p>
                    <p className="text-xs text-[#6b8580]">Enviado el {dateTime.format(new Date(active.date))}</p>
                  </div>
                  <p className="shrink-0 text-right">
                    <span className="block text-xs text-[#5f7a75]">Declaró</span>
                    <span className="text-3xl font-black tabular-nums tracking-tight text-[#082e39]">S/ {active.amount}</span>
                  </p>
                </div>
                {active.status !== "pending" && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-[#2c4a47]">
                    Estado: <StatusBadge status={active.status} />
                  </p>
                )}
              </section>

              <div className="order-2 lg:col-start-1 lg:row-span-2 lg:row-start-1">
                <ReceiptViewer variant="compact" receipts={[{ id: active.id, label: active.kind, url: active.receiptUrl, amount: active.amount }]} />
              </div>

              <section className="order-3 space-y-3 px-4 py-4 lg:col-start-2 lg:row-start-2 lg:px-6">
                {params.error && <FlashMessage error={params.error} fallbackError="No se pudo guardar. Inténtalo de nuevo." />}
                {active.previousNote && (
                  <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-900">
                    Corrige el pago inicial observado: «{active.previousNote}»
                  </p>
                )}
                {active.note && active.status !== "pending" && (
                  <p className="rounded-xl bg-[#f3f6f4] px-3 py-2 text-sm text-[#2c4a47]">Nota: {active.note}</p>
                )}
                <dl className="divide-y divide-[#eef2ef] rounded-xl border border-[#e3eae5] bg-white text-sm">
                  <div className="flex justify-between gap-3 px-3 py-2.5">
                    <dt className="text-[#4d6a64]">Precio del plan</dt>
                    <dd className="font-semibold tabular-nums text-[#0a3039]">S/ {active.price}</dd>
                  </div>
                  <div className="flex justify-between gap-3 px-3 py-2.5">
                    <dt className="text-[#4d6a64]">Ya aprobado antes</dt>
                    <dd className="font-semibold tabular-nums text-[#0a3039]">S/ {active.paidBefore}</dd>
                  </div>
                  <div className="flex justify-between gap-3 px-3 py-2.5">
                    <dt className="text-[#4d6a64]">{active.status === "approved" ? "Saldo actual" : "Saldo si apruebas"}</dt>
                    <dd className={`font-bold tabular-nums ${dueAfter > 0 ? "text-[#8a4b07]" : "text-emerald-700"}`}>
                      {dueAfter > 0 ? `S/ ${dueAfter}` : "Pagado completo"}
                    </dd>
                  </div>
                </dl>
                {blockReason && (
                  <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
                    {blockReason}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {active.phone && (
                    <a
                      href={whatsappUrl(active.phone, `Hola ${active.firstName}, te escribimos del equipo de Radical 2.0 respecto a tu ${active.isInitial ? "comprobante de inscripción" : `abono de S/ ${active.amount}`}.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#cfe5d8] bg-white text-sm font-semibold text-[#1d7a45] hover:bg-[#f1faf4]"
                    >
                      <WhatsAppMark className="size-4" />
                      WhatsApp
                    </a>
                  )}
                  <Link
                    href={`/admin/inscripciones/${active.registrationId}`}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d8e3df] bg-white text-sm font-semibold text-[#2c4a47] hover:bg-[#f3f7f5]"
                  >
                    <UserRound size={16} aria-hidden />
                    Ver ficha
                  </Link>
                </div>
              </section>
            </div>

            {/* Decisión al alcance del pulgar */}
            <footer className="border-t border-[#e3eae5] bg-white px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 lg:px-6">
              {active.status === "approved" && !isMaster ? (
                <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
                  Este pago ya está aprobado. Si hay que corregirlo, pídeselo a la cuenta maestra.
                </p>
              ) : (
                <ReviewResolutionForm
                  key={active.id}
                  variant="bar"
                  action={active.isInitial ? review : reviewPayment}
                  isInitial={active.isInitial}
                  id={active.id}
                  registrationId={active.registrationId}
                  currentStatus={active.status}
                  initialNote={active.note}
                  view="payments"
                  returnTo={nextHref ?? listHref}
                  errorReturnTo={currentHref}
                  approveText={active.status === "pending" ? `Aprobar S/ ${active.amount}` : undefined}
                  entityType="comprobante"
                  approveBlocked={Boolean(blockReason)}
                />
              )}
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
