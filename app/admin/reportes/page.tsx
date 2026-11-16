import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { BrandLogo } from "@/components/common/BrandLogo";
import type { Registration, RegistrationPayment } from "../types";
import { PrintButton } from "./PrintButton";
import { ArrowLeft } from "lucide-react";
import { isMinorAtCamp } from "@/utils/minors";
import { ageFromBirth, decemberJanuaryBirthdays } from "@/utils/camper-report";

export const metadata = {
  title: "Reporte Editorial Oficial | Radical 2.0",
  robots: { index: false, follow: false },
};

export default async function AdminReportesPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    status?: string;
    plan?: string;
    autoPrint?: string;
  }>;
}) {
  const params = await searchParams;
  const currentType = params.type || "todo-en-uno";
  const currentStatus = params.status || "all";
  const currentPlan = params.plan || "all";
  const autoPrint = params.autoPrint === "true";

  // Auth Guard
  const client = createClient(await cookies());
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    redirect("/admin");
  }

  const { data: membership } = await client
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    redirect("/admin");
  }

  // Fetch registrations matching filters
  let query = client
    .from("registrations")
    .select("*")
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (currentStatus !== "all") {
    query = query.eq("status", currentStatus);
  }
  if (currentPlan !== "all") {
    query = query.ilike("plan", currentPlan);
  }

  const { data: rawRows, error } = await query;
  if (error || !rawRows) {
    notFound();
  }

  const registrations = rawRows as Registration[];

  // Fetch all approved additional payments to calculate exact balances
  const { data: rawPayments } = await client
    .from("registration_payments")
    .select("registration_id,amount,status,kind")
    .eq("status", "approved")
    .eq("kind", "additional");

  const payments = (rawPayments as Pick<RegistrationPayment, "registration_id" | "amount" | "status" | "kind">[]) || [];

  const additionalPaidByReg = payments.reduce((acc, p) => {
    acc[p.registration_id] = (acc[p.registration_id] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  const birthdays = decemberJanuaryBirthdays(registrations);
  const minors = registrations.filter((r) => isMinorAtCamp(r.birth_date));

  // Compute metrics
  const totalRegistrations = registrations.length;

  const financialItems = registrations.map((r) => {
    const additional = additionalPaidByReg[r.id] || 0;
    const paid = r.amount + additional;
    const balance = Math.max(0, r.price - paid);

    return {
      ...r,
      totalPaid: paid,
      balance,
    };
  });

  const approvedItems = financialItems.filter((r) => r.status === "approved");
  const totalExpected = approvedItems.reduce((n, r) => n + r.price, 0);
  const totalCollected = approvedItems.reduce((n, r) => n + r.totalPaid, 0);
  const totalOutstanding = Math.max(0, totalExpected - totalCollected);

  // Group by plan
  const planSummary = registrations.reduce(
    (acc, r) => {
      const planKey = (r.plan || "regular").toLowerCase();
      if (!acc[planKey]) {
        acc[planKey] = { count: 0, expected: 0, collected: 0 };
      }
      acc[planKey].count += 1;
      if (r.status === "approved") {
        acc[planKey].expected += r.price;
        const addl = additionalPaidByReg[r.id] || 0;
        acc[planKey].collected += r.amount + addl;
      }
      return acc;
    },
    {} as Record<string, { count: number; expected: number; collected: number }>,
  );

  const issueDate = new Date().toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Lima",
  });

  const issueTime = new Date().toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Lima",
  });

  return (
    <div className="min-h-screen bg-[#f1f3ee] text-[#0b2d36] antialiased">
      {/* ── Discreet Top Control Bar (Hidden on print) ── */}
      <nav aria-label="Controles del reporte" className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur shadow-sm">
        <div className="mx-auto flex max-w-[210mm] items-center justify-between gap-4">
          <Link
            href="/admin/inscripciones"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 transition hover:text-[#0b2d36]"
          >
            <ArrowLeft size={15} />
            <span>Volver a inscripciones</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
              {currentType === "todo-en-uno" ? "Dossier Completo (Todo en uno)" : `Reporte: ${currentType}`}
            </span>
            <PrintButton autoPrint={autoPrint} />
          </div>
        </div>
      </nav>

      {/* ── Printable Editorial Paper Sheet (A4 format) ── */}
      <main className="mx-auto my-6 max-w-[210mm] rounded-2xl bg-white p-8 shadow-[0_12px_45px_rgba(11,45,54,0.08)] sm:p-12 print:m-0 print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        {/* CSS for print exact layout */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body {
              background: #ffffff !important;
              color: #0b2d36 !important;
              font-size: 10pt !important;
            }
            .no-print {
              display: none !important;
            }
            .page-break {
              page-break-after: always;
              break-after: page;
            }
            .avoid-break {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 12mm 12mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}} />

        {/* ── Encabezado Editorial con Identidad Radical 2.0 ── */}
        <header className="border-b-2 border-[#0b2d36] pb-5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <BrandLogo variant="secundario" width={145} />
              </div>
              <p className="mt-2.5 text-[11px] font-black uppercase tracking-[.25em] text-[#00aeb8]">
                Campamento de Jóvenes · 2026
              </p>
              <h1 className="mt-1 font-blowbrush text-3xl tracking-wide text-[#0b2d36] sm:text-4xl">
                {currentType === "todo-en-uno" && "DOSSIER EJECUTIVO Y LOGÍSTICA"}
                {currentType === "campistas" && "LISTA DE CAMPISTAS"}
                {currentType === "financiero" && "REPORTE DE TESORERÍA Y SALDOS"}
                {currentType === "cumpleanos" && "CUMPLEAÑOS DE DICIEMBRE Y ENERO"}
                {currentType === "menores" && "MENORES DE EDAD Y PERMISOS DE VIAJE"}
              </h1>
            </div>

            <div className="text-right text-xs text-slate-500">
              <p className="font-bold text-[#0b2d36]">Radical 2.0</p>
              <p>Emisión: {issueDate}</p>
              <p>{issueTime} (Hora Lima)</p>
              <p className="mt-1 text-[10px] text-slate-400">
                Auditor: {user.email}
              </p>
            </div>
          </div>
        </header>

        {/* ══════════════════════════════════════════════════════
            SECCIÓN 1: BALANCE FINANCIERO Y RESUMEN DE SALDOS
           ══════════════════════════════════════════════════════ */}
        {(currentType === "todo-en-uno" || currentType === "financiero") && (
          <section className="mt-6 avoid-break">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="font-bebas text-xl tracking-wide text-[#0b2d36]">
                1. Balance Financiero por Planes
              </h2>
            </div>

            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0b2d36] text-[10px] uppercase tracking-wider text-white">
                  <tr>
                    <th className="p-2.5">Plan</th>
                    <th className="p-2.5 text-center">Inscritos</th>
                    <th className="p-2.5 text-right">Meta Proyectada</th>
                    <th className="p-2.5 text-right">Recaudado</th>
                    <th className="p-2.5 text-right">Saldo Pendiente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(planSummary).map(([plan, data]) => (
                    <tr key={plan} className="odd:bg-slate-50/50">
                      <td className="p-2.5 font-bold capitalize text-slate-900">{plan}</td>
                      <td className="p-2.5 text-center font-semibold">{data.count}</td>
                      <td className="p-2.5 text-right font-medium text-slate-600">
                        S/ {data.expected}
                      </td>
                      <td className="p-2.5 text-right font-bold text-[#0a6b5e]">
                        S/ {data.collected}
                      </td>
                      <td className="p-2.5 text-right font-bold text-[#d25500]">
                        S/ {Math.max(0, data.expected - data.collected)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#f8f4e9] font-bold text-slate-900">
                    <td className="p-2.5">TOTAL GENERAL</td>
                    <td className="p-2.5 text-center">{totalRegistrations}</td>
                    <td className="p-2.5 text-right">S/ {totalExpected}</td>
                    <td className="p-2.5 text-right text-[#0a6b5e]">S/ {totalCollected}</td>
                    <td className="p-2.5 text-right text-[#d25500]">S/ {totalOutstanding}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Campistas con saldo pendiente */}
            <div className="mt-5 avoid-break">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#d25500]">
                Campistas con saldo por regularizar ({financialItems.filter(f => f.balance > 0).length})
              </h3>
              <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="p-2">Campista</th>
                      <th className="p-2">WhatsApp</th>
                      <th className="p-2">Plan</th>
                      <th className="p-2 text-right">Abonado</th>
                      <th className="p-2 text-right">Saldo Pendiente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {financialItems
                      .filter((f) => f.balance > 0)
                      .slice(0, currentType === "financiero" ? 200 : 15)
                      .map((item) => (
                        <tr key={item.id} className="odd:bg-slate-50/50">
                          <td className="p-2 font-bold text-slate-900">
                            {item.last_name}, {item.first_name}
                          </td>
                          <td className="p-2 font-mono text-slate-600">{item.phone}</td>
                          <td className="p-2 capitalize text-slate-600">{item.plan}</td>
                          <td className="p-2 text-right font-medium">S/ {item.totalPaid}</td>
                          <td className="p-2 text-right font-black text-[#d25500]">
                            S/ {item.balance}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Salto de página para el documento completo */}
        {currentType === "todo-en-uno" && <div className="page-break" />}

        {/* ══════════════════════════════════════════════════════
            SECCIÓN 2: LISTA DE CAMPISTAS (única: datos, WhatsApp y emergencias)
           ══════════════════════════════════════════════════════ */}
        {(currentType === "todo-en-uno" || currentType === "campistas") && (
          <section className="mt-6">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="font-bebas text-xl tracking-wide text-[#0b2d36]">
                {currentType === "todo-en-uno" ? "2. Lista de campistas" : "Lista de campistas"}
              </h2>
            </div>

            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-[#0b2d36] text-[10px] uppercase tracking-wider text-white">
                  <tr>
                    <th className="p-2 text-center w-8">N°</th>
                    <th className="p-2">DNI / Doc</th>
                    <th className="p-2">Apellidos y Nombres</th>
                    <th className="p-2 text-center">Edad</th>
                    <th className="p-2">WhatsApp</th>
                    <th className="p-2">Contacto de emergencia</th>
                    <th className="p-2 text-center w-14">Permiso</th>
                    <th className="p-2 text-center w-20">Firma</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registrations.map((r, i) => (
                    <tr key={r.id} className="odd:bg-slate-50/40 avoid-break">
                      <td className="p-2 text-center font-bold text-slate-400">{i + 1}</td>
                      <td className="p-2 font-mono text-slate-700">{r.document}</td>
                      <td className="p-2 font-bold text-slate-900">
                        {r.last_name}, {r.first_name}
                        <span className="block text-[9px] font-medium capitalize text-slate-400">
                          {r.plan} · {r.status === "approved" ? "Aprobado" : r.status === "rejected" ? "Observado" : "Pendiente"}
                        </span>
                      </td>
                      <td className="p-2 text-center font-semibold text-slate-700">{ageFromBirth(r.birth_date) ?? "—"}</td>
                      <td className="p-2 font-mono text-slate-700">{r.phone}</td>
                      <td className="p-2 text-slate-800">
                        <span className="font-semibold">{r.emergency_name}</span>{" "}
                        <span className="text-[10px] text-slate-500">({r.emergency_relation})</span>
                        <span className="block font-mono font-bold text-[#a83820]">{r.emergency_phone}</span>
                      </td>
                      <td className="p-2 text-center">
                        {isMinorAtCamp(r.birth_date) ? (
                          <>
                            <span className="block text-[8px] font-black uppercase text-[#a83820]">Menor</span>
                            <div className="mx-auto mt-0.5 size-4 rounded border border-slate-500" />
                          </>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <div className="mx-auto h-5 w-16 rounded border border-dashed border-slate-300" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {currentType === "todo-en-uno" && <div className="page-break" />}

        {/* ══════════════════════════════════════════════════════
            CUMPLEAÑOS DE DICIEMBRE Y ENERO
           ══════════════════════════════════════════════════════ */}
        {(currentType === "todo-en-uno" || currentType === "cumpleanos") && (
          <section className="mt-6">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="font-bebas text-xl tracking-wide text-[#0b2d36]">
                {currentType === "todo-en-uno" ? "3. " : ""}Campistas que cumplen años en diciembre y enero ({birthdays.length})
              </h2>
            </div>

            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0b2d36] text-[10px] uppercase tracking-wider text-white">
                  <tr>
                    <th className="p-2 text-center w-8">N°</th>
                    <th className="p-2">Apellidos y Nombres</th>
                    <th className="p-2">Cumpleaños</th>
                    <th className="p-2 text-center">Cumple</th>
                    <th className="p-2">WhatsApp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {birthdays.map(({ item: r, day, monthLabel, turns }, i) => (
                    <tr key={r.id} className="odd:bg-slate-50/40 avoid-break">
                      <td className="p-2 text-center font-bold text-slate-400">{i + 1}</td>
                      <td className="p-2 font-bold text-slate-900">
                        {r.last_name}, {r.first_name}
                      </td>
                      <td className="p-2 font-semibold capitalize text-slate-800">{day} de {monthLabel}</td>
                      <td className="p-2 text-center font-semibold text-slate-700">{turns} años</td>
                      <td className="p-2 font-mono text-slate-700">{r.phone}</td>
                    </tr>
                  ))}
                  {birthdays.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-500">
                        Nadie de la lista cumple años en diciembre o enero.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {currentType === "menores" && (
          <section className="mt-6">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="font-bebas text-xl tracking-wide text-[#0b2d36]">
                Menores de edad al inicio del campamento ({minors.length})
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">Deben presentar su permiso de viaje notarial en original al abordar.</p>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-[#0b2d36] text-[10px] uppercase tracking-wider text-white">
                  <tr>
                    <th className="p-2 text-center w-8">N°</th>
                    <th className="p-2">DNI / Doc</th>
                    <th className="p-2">Apellidos y Nombres</th>
                    <th className="p-2 text-center">Edad</th>
                    <th className="p-2">WhatsApp</th>
                    <th className="p-2">Contacto de emergencia</th>
                    <th className="p-2 text-center w-16">Permiso ✓</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {minors.map((r, i) => (
                    <tr key={r.id} className="odd:bg-slate-50/40 avoid-break">
                      <td className="p-2 text-center font-bold text-slate-400">{i + 1}</td>
                      <td className="p-2 font-mono text-slate-700">{r.document}</td>
                      <td className="p-2 font-bold text-slate-900">{r.last_name}, {r.first_name}</td>
                      <td className="p-2 text-center font-semibold text-slate-700">{ageFromBirth(r.birth_date) ?? "—"}</td>
                      <td className="p-2 font-mono text-slate-700">{r.phone}</td>
                      <td className="p-2 text-slate-800">
                        <span className="font-semibold">{r.emergency_name}</span>{" "}
                        <span className="text-[10px] text-slate-500">({r.emergency_relation})</span>
                        <span className="block font-mono font-bold text-[#a83820]">{r.emergency_phone}</span>
                      </td>
                      <td className="p-2 text-center"><div className="mx-auto size-4 rounded border border-slate-500" /></td>
                    </tr>
                  ))}
                  {minors.length === 0 && (
                    <tr><td colSpan={7} className="p-4 text-center text-slate-500">No hay menores de edad en la lista.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── Pie del Documento ── */}
        <footer className="mt-8 border-t border-slate-200 pt-4 text-center text-[10px] text-slate-500 avoid-break">
          <p>Radical 2.0 - Ministerio Nacional de Jovenes - IELP</p>
        </footer>
      </main>
    </div>
  );
}
