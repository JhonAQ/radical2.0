"use client";

import { useState } from "react";
import {
  Printer,
  DollarSign,
  Users,
  Cake,
  ShieldAlert,
  FileCheck2,
  ExternalLink,
  FileSpreadsheet,
  Download,
} from "lucide-react";

type ReportType = "todo-en-uno" | "campistas" | "financiero" | "cumpleanos" | "menores";
type StatusFilter = "all" | "approved" | "pending" | "rejected";
type PlanFilter = "all" | "preventa" | "regular";

const REPORT_OPTIONS: {
  type: ReportType;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    type: "campistas",
    label: "Lista de campistas",
    description: "Documento, edad, WhatsApp, contacto de emergencia y casilla de firma.",
    icon: Users,
  },
  {
    type: "financiero",
    label: "Tesorería y saldos",
    description: "Balance por plan y lista de quienes tienen saldo pendiente.",
    icon: DollarSign,
  },
  {
    type: "menores",
    label: "Menores de edad y permisos",
    description: "Menores al inicio del campamento, con casilla para el permiso de viaje.",
    icon: ShieldAlert,
  },
  {
    type: "cumpleanos",
    label: "Cumpleaños de diciembre y enero",
    description: "Quienes cumplen años en esos meses, con su WhatsApp.",
    icon: Cake,
  },
];

const CSV_OPTIONS = [
  { type: "general", label: "General" },
  { type: "financiero", label: "Finanzas" },
  { type: "campistas", label: "Campistas" },
  { type: "menores", label: "Menores" },
  { type: "cumpleanos", label: "Cumpleaños" },
];

const selectClass =
  "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-[#008e95]";

/** Centro de reportes: PDF imprimibles y CSV, con filtros de estado y plan. */
export function ExportPanel() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");
  const [csvLoading, setCsvLoading] = useState<string | null>(null);
  const [csvError, setCsvError] = useState(false);

  function openReport(type: ReportType) {
    const params = new URLSearchParams({ type, status: statusFilter, plan: planFilter, autoPrint: "true" });
    window.open(`/admin/imprimir?${params.toString()}`, "_blank");
  }

  async function downloadCsv(type: string) {
    setCsvLoading(type);
    setCsvError(false);
    try {
      const params = new URLSearchParams({ type, status: statusFilter, plan: planFilter });
      const res = await fetch(`/api/admin/export?${params.toString()}`);
      if (!res.ok) throw new Error("Error al generar el CSV");
      const blob = await res.blob();
      const match = (res.headers.get("content-disposition") || "").match(/filename="([^"]+)"/);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = match?.[1] || `Radical2_${type}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setCsvError(true);
    } finally {
      setCsvLoading(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Filtros: aplican a todos los reportes y CSV */}
      <section className="grid gap-3 rounded-xl border border-[#e2e8e4] bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-5">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-[#657d77]">Estado de la inscripción</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className={selectClass}>
            <option value="all">Todos los estados</option>
            <option value="approved">Solo aprobados</option>
            <option value="pending">Solo pendientes</option>
            <option value="rejected">Solo observados</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-[#657d77]">Plan</span>
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value as PlanFilter)} className={selectClass}>
            <option value="all">Todos los planes</option>
            <option value="preventa">Preventa</option>
            <option value="regular">Regular</option>
          </select>
        </label>
      </section>

      <button
        type="button"
        onClick={() => openReport("todo-en-uno")}
        className="group flex w-full items-center gap-4 rounded-xl bg-[#0b2d36] p-4 text-left text-white shadow-sm transition hover:bg-[#07242c] sm:p-5"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#ffc629] text-[#0b2d36]">
          <FileCheck2 size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">Dossier completo</span>
          <span className="mt-0.5 block text-xs text-slate-300">Tesorería, lista de campistas y cumpleaños en un solo PDF.</span>
        </span>
        <Printer size={18} className="shrink-0 text-[#ffc629] transition group-hover:translate-x-0.5" />
      </button>

      <div className="grid gap-3 sm:grid-cols-2">
        {REPORT_OPTIONS.map(({ type, label, description, icon: Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => openReport(type)}
            className="flex items-start gap-3 rounded-xl border border-[#e2e8e4] bg-white p-4 text-left shadow-sm transition hover:border-[#00aeb8]/40 hover:bg-[#f7fbfa]"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#e7f4f2] text-[#008d98]">
              <Icon size={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-[#0a3039]">{label}</span>
              <span className="mt-0.5 block text-xs leading-snug text-[#657d77]">{description}</span>
            </span>
            <ExternalLink size={14} className="mt-1 shrink-0 text-slate-400" />
          </button>
        ))}
      </div>

      <section className="rounded-xl border border-[#e2e8e4] bg-white p-4 shadow-sm sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-[#0a3039]">
          <FileSpreadsheet size={16} className="text-[#0f8f87]" />
          Datos para Excel (CSV)
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {CSV_OPTIONS.map(({ type, label }) => (
            <button
              key={type}
              type="button"
              onClick={() => downloadCsv(type)}
              disabled={csvLoading !== null}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              <Download size={13} />
              {csvLoading === type ? "Descargando…" : label}
            </button>
          ))}
        </div>
        {csvError && (
          <p role="alert" className="mt-2 text-xs font-semibold text-red-700">
            No se pudo descargar el CSV. Intenta de nuevo.
          </p>
        )}
      </section>
    </div>
  );
}
