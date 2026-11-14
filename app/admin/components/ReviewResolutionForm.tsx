"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, AlertTriangle, RotateCcw, X } from "lucide-react";
import { adminInputClass } from "../types";

interface ReviewResolutionFormProps {
  action: (formData: FormData) => void | Promise<void>;
  isInitial: boolean;
  id: string;
  registrationId?: string;
  currentStatus: string;
  initialNote?: string;
  view: "payments" | "registrations";
  returnTo?: string;
  closeUrl?: string;
  entityType?: "comprobante" | "inscripcion";
}

export function ReviewResolutionForm({
  action,
  isInitial,
  id,
  registrationId,
  currentStatus,
  initialNote = "",
  view,
  returnTo,
  closeUrl,
  entityType = "comprobante",
}: ReviewResolutionFormProps) {
  const [note, setNote] = useState(initialNote);
  const hasNote = note.trim().length > 0;
  const isAlreadyPending = currentStatus === "pending";

  const approveLabel =
    entityType === "comprobante"
      ? "Aprobar comprobante (Confirmar dinero)"
      : "Aprobar inscripción";
  const rejectLabel =
    entityType === "comprobante" ? "Observar comprobante" : "Observar";

  return (
    <form action={action} className="space-y-3.5">
      <input type="hidden" name="view" value={view} />
      {returnTo && <input type="hidden" name="return_to" value={returnTo} />}

      {isInitial ? (
        <input type="hidden" name="id" value={id} />
      ) : (
        <>
          <input type="hidden" name="payment_id" value={id} />
          {registrationId && (
            <input type="hidden" name="registration_id" value={registrationId} />
          )}
        </>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700">
          Nota de observación:
          <span className="ml-1 text-[11px] font-normal text-slate-400">
            {hasNote
              ? "(Requerida para observar; bloquea la aprobación)"
              : "(Escribe aquí solo si hay un problema con el pago)"}
          </span>
          <textarea
            name="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            rows={2}
            placeholder={
              entityType === "comprobante"
                ? "Ej: Monto transferido no coincide con la preventa, voucher cortado..."
                : "Ej: Comprobante ilegible o falta regularizar datos..."
            }
            className={`${adminInputClass} mt-1.5`}
          />
        </label>

        {hasNote && (
          <p className="mt-1 text-[11px] text-amber-700">
            Al escribir una observación, se desactiva "Aprobar". Bórrala si
            el pago es conforme.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-1">
        {/* Botón de Aprobar: Solo activo si no hay nota de observación */}
        <button
          type="submit"
          name="status"
          value="approved"
          disabled={hasNote}
          className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold shadow-sm transition ${
            hasNote
              ? "cursor-not-allowed bg-slate-200 text-slate-400 opacity-60"
              : "bg-[#008e87] text-white hover:bg-[#007670]"
          }`}
          title={
            hasNote
              ? "Borra la nota de observación para poder aprobar"
              : "Aprobar comprobante"
          }
        >
          <CheckCircle size={15} />
          <span>{approveLabel}</span>
        </button>

        {/* Fila secundaria de acciones */}
        <div className="grid grid-cols-2 gap-2">
          {/* Botón Observar: Solo activo si hay nota */}
          <button
            type="submit"
            name="status"
            value="rejected"
            disabled={!hasNote}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold shadow-sm transition ${
              hasNote
                ? "border-red-300 bg-red-600 text-white hover:bg-red-700"
                : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-60"
            }`}
            title={
              !hasNote
                ? "Escribe el motivo en la observación para habilitar este botón"
                : "Observar comprobante"
            }
          >
            <AlertTriangle size={14} />
            <span>{rejectLabel}</span>
          </button>

          {/* Opción 3: Si ya está pendiente, botón neutral de salir/cerrar.
              Si NO está pendiente (fue aprobado u observado), botón de revertir */}
          {isAlreadyPending ? (
            closeUrl ? (
              <Link
                href={closeUrl}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
              >
                <X size={14} />
                <span>Revisar luego</span>
              </Link>
            ) : (
              <div className="invisible" />
            )
          ) : (
            <button
              type="submit"
              name="status"
              value="pending"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-200"
              title="Volver a poner este comprobante en la cola de pendientes"
            >
              <RotateCcw size={13} />
              <span>Revertir a pendiente</span>
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
