"use client";

import { useState } from "react";
import {
  Printer,
  FileText,
  DollarSign,
  Users,
  Phone,
  ChevronDown,
  X,
  FileCheck2,
  ExternalLink,
  FileSpreadsheet,
} from "lucide-react";

type ReportType = "todo-en-uno" | "asistencia" | "financiero" | "emergencias" | "contactos";
type StatusFilter = "all" | "approved" | "pending" | "rejected";
type PlanFilter = "all" | "preventa" | "regular";

const REPORT_OPTIONS: {
  type: ReportType;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    type: "asistencia",
    label: "Lista de campistas",
    description: "Para control en puerta y abordaje de buses con casillas de firma.",
    icon: Users,
  },
  {
    type: "financiero",
    label: "Reporte de Tesorería y Saldos",
    description: "Balances por plan y lista de participantes con deuda pendiente.",
    icon: DollarSign,
  },
  {
    type: "emergencias",
    label: "Padrón Médico y Emergencias",
    description: "Para tópico y seguridad: contactos familiares y teléfonos.",
    icon: FileText,
  },
  {
    type: "contactos",
    label: "Directorio de WhatsApp",
    description: "Teléfonos directos y correos para líderes y coordinadores.",
    icon: Phone,
  },
];

export function ExportPanel() {
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");
  const [showCsv, setShowCsv] = useState(false);
  const [csvLoading, setCsvLoading] = useState<string | null>(null);

  function openReport(type: ReportType) {
    const params = new URLSearchParams({
      type,
      status: statusFilter,
      plan: planFilter,
      autoPrint: "true",
    });
    window.open(`/admin/reportes?${params.toString()}`, "_blank");
    setOpen(false);
  }

  async function downloadCsv(type: string) {
    setCsvLoading(type);
    try {
      const params = new URLSearchParams({
        type,
        status: statusFilter,
        plan: planFilter,
      });

      const res = await fetch(`/api/admin/export?${params.toString()}`);
      if (!res.ok) throw new Error("Error al generar el CSV");

      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition") || "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] || `Radical2_${type}.csv`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch (err) {
      console.error(err);
      alert("No se pudo descargar el CSV.");
    } finally {
      setCsvLoading(null);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg bg-[#0b2d36] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#08232a]"
      >
        <Printer size={15} className="text-[#ffc629]" />
        <span>Reportes PDF</span>
        <ChevronDown
          size={14}
          className={`text-slate-300 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />

          {/* Modal Dropdown */}
          <div className="absolute right-0 top-full z-30 mt-2 w-[390px] max-w-[92vw] origin-top-right rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(11,45,54,0.18)]">
            <div className="mb-3.5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#082e39]">
                  Reportes oficiales
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-6 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={14} />
              </button>
            </div>

            {/* Quick Filters */}
            <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-[#f8f4e9] p-2.5">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-[#0b2d36]">
                  Estado
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                >
                  <option value="all">Todos los estados</option>
                  <option value="approved">Solo aprobados</option>
                  <option value="pending">Solo pendientes</option>
                  <option value="rejected">Solo observados</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-[#0b2d36]">
                  Plan
                </label>
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value as PlanFilter)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                >
                  <option value="all">Todos los planes</option>
                  <option value="preventa">Preventa</option>
                  <option value="regular">Regular</option>
                </select>
              </div>
            </div>

            {/* ── HERO OPTION: DOSSIER COMPLETO ── */}
            <div className="mb-3">
              <button
                type="button"
                onClick={() => openReport("todo-en-uno")}
                className="group relative flex w-full items-center justify-between rounded-xl bg-[#0b2d36] p-3.5 text-left text-white shadow-sm transition hover:bg-[#07242c]"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-[#ffc629] text-[#0b2d36] shadow-sm">
                    <FileCheck2 size={18} />
                  </span>
                  <div>
                    <span className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-white">
                      <span>Dossier Completo (Todo en uno)</span>
                      <span className="rounded bg-[#ffc629] px-1.5 py-0.2 text-[9px] font-bold text-[#0b2d36]">
                        OFICIAL
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-200 leading-tight">
                      KPIs + Tesorería + Acreditación + Emergencias
                    </span>
                  </div>
                </div>
                <Printer
                  size={16}
                  className="text-[#ffc629] transition group-hover:translate-x-0.5 shrink-0 ml-2"
                />
              </button>
            </div>

            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              O imprimir por componente individual:
            </p>

            {/* Individual PDF Component Reports */}
            <div className="space-y-1.5">
              {REPORT_OPTIONS.map(({ type, label, description, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => openReport(type)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-left transition hover:border-[#00aeb8]/30 hover:bg-[#f4faf9]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="shrink-0 text-[#008d98]">
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0">
                      <span className="block truncate text-xs font-bold text-slate-900">
                        {label}
                      </span>
                      <span className="block truncate text-[10px] text-slate-500 leading-tight">
                        {description}
                      </span>
                    </div>
                  </div>
                  <ExternalLink size={13} className="shrink-0 text-slate-400 ml-2" />
                </button>
              ))}
            </div>

            {/* Optional CSV toggle */}
            <div className="mt-3.5 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowCsv((v) => !v)}
                className="flex w-full items-center justify-between text-[11px] font-semibold text-slate-500 hover:text-slate-800"
              >
                <span className="flex items-center gap-1.5">
                  <FileSpreadsheet size={13} />
                  <span>¿Prefieres la data cruda en Excel (CSV)?</span>
                </span>
                <ChevronDown
                  size={12}
                  className={`transition-transform ${showCsv ? "rotate-180" : ""}`}
                />
              </button>

              {showCsv && (
                <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => downloadCsv("general")}
                    disabled={csvLoading !== null}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left text-[11px] font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    CSV General
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadCsv("financiero")}
                    disabled={csvLoading !== null}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left text-[11px] font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    CSV Finanzas
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadCsv("contactos")}
                    disabled={csvLoading !== null}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left text-[11px] font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    CSV Contactos
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadCsv("emergencias")}
                    disabled={csvLoading !== null}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left text-[11px] font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    CSV Emergencias
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
