"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import { PendingFieldset } from "./PendingFieldset";

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
  /** Ya no se usan aquí: el aviso por WhatsApp se ofrece después de observar. */
  participantPhone?: string;
  participantFirstName?: string;
  /** Texto del botón principal (p. ej. "Aprobar y seguir" en la cola). */
  approveText?: string;
  /** A dónde volver si la acción falla (por defecto, returnTo). */
  errorReturnTo?: string;
  /** Texto del enlace neutral cuando está pendiente (por defecto, "Revisar luego"). */
  closeText?: string;
  /** "bar": barra de decisión al pie de la pantalla de validación. */
  variant?: "bar" | "inline";
  /** No se puede aprobar (p. ej. supera el saldo): el botón queda desactivado y solo se puede observar. */
  approveBlocked?: boolean;
}

const quickReasons = [
  "El monto no coincide con lo declarado",
  "La imagen no se lee bien",
  "No es un comprobante de pago",
  "No se ve el número de operación",
  "Este comprobante ya se usó antes",
];

/**
 * Decisión sobre un comprobante: aprobar es un toque; observar abre un paso
 * aparte con motivos rápidos y una nota que verá el campista.
 */
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
  approveText,
  errorReturnTo,
  closeText = "Revisar luego",
  variant = "inline",
  approveBlocked = false,
}: ReviewResolutionFormProps) {
  const [observing, setObserving] = useState(false);
  // Si ya estaba observado, la nota anterior sirve de punto de partida al volver a observar.
  const [note, setNote] = useState(currentStatus === "rejected" ? initialNote : "");
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const hasNote = note.trim().length > 0;
  const isPending = currentStatus === "pending";
  const bar = variant === "bar";

  const approveLabel = approveText ?? (entityType === "comprobante" ? "Aprobar pago" : "Aprobar inscripción");

  function startObserving() {
    setObserving(true);
    requestAnimationFrame(() => noteRef.current?.focus());
  }

  return (
    <form action={action} className={bar ? "" : "space-y-3"}>
      <input type="hidden" name="view" value={view} />
      {returnTo && <input type="hidden" name="return_to" value={returnTo} />}
      {errorReturnTo && <input type="hidden" name="error_return_to" value={errorReturnTo} />}
      {isInitial ? (
        <input type="hidden" name="id" value={id} />
      ) : (
        <>
          <input type="hidden" name="payment_id" value={id} />
          {registrationId && <input type="hidden" name="registration_id" value={registrationId} />}
        </>
      )}
      {/* Al aprobar o devolver a pendiente no se envía nota. */}
      {!observing && <input type="hidden" name="note" value="" />}

      <PendingFieldset className="contents">
        {observing ? (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-[#0a3039]" htmlFor={`note-${id}`}>
              ¿Qué hay que corregir?
              <span className="mt-0.5 block text-xs font-normal text-[#5f7a75]">El campista verá esta nota en su inscripción.</span>
            </label>
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
              {quickReasons.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => {
                    setNote(reason);
                    noteRef.current?.focus();
                  }}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition ${
                    note === reason ? "bg-rose-50 text-rose-800 ring-rose-300" : "bg-white text-[#2c4a47] ring-[#d8e3df] hover:bg-[#f3f7f5]"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <textarea
              ref={noteRef}
              id={`note-${id}`}
              name="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              rows={2}
              required
              placeholder="Ej.: transferiste S/ 40 y declaraste S/ 50."
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-[#082e39] outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 sm:text-sm"
            />
            <div className="grid grid-cols-[1fr_1.6fr] gap-2">
              <button
                type="button"
                onClick={() => setObserving(false)}
                className="min-h-12 rounded-xl border border-[#d8e3df] bg-white px-3 text-sm font-semibold text-[#2c4a47] transition hover:bg-[#f3f7f5]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                name="status"
                value="rejected"
                disabled={!hasNote}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-rose-700 px-3 text-sm font-bold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-rose-300"
              >
                <AlertTriangle size={16} aria-hidden />
                Observar
              </button>
            </div>
          </div>
        ) : isPending ? (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_2fr] gap-2">
              <button
                type="button"
                onClick={startObserving}
                className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-800 transition hover:bg-rose-50"
              >
                <AlertTriangle size={16} aria-hidden />
                Observar
              </button>
              <button
                type="submit"
                name="status"
                value="approved"
                disabled={approveBlocked}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#00766f] px-4 text-base font-bold text-white shadow-sm transition hover:bg-[#00635d] active:bg-[#005751] disabled:cursor-not-allowed disabled:bg-[#9dbfba]"
              >
                <CheckCircle2 size={18} aria-hidden />
                {approveLabel}
              </button>
            </div>
            {closeUrl && !bar && (
              <Link href={closeUrl} className="block py-1 text-center text-sm font-semibold text-[#5f7a75] hover:text-[#0a3039]">
                {closeText}
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {currentStatus === "rejected" ? (
              <button
                type="submit"
                name="status"
                value="approved"
                disabled={approveBlocked}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#00766f] px-3 text-sm font-bold text-white transition hover:bg-[#00635d] disabled:cursor-not-allowed disabled:bg-[#9dbfba]"
              >
                <CheckCircle2 size={16} aria-hidden />
                Aprobar
              </button>
            ) : (
              <button
                type="button"
                onClick={startObserving}
                className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-800 transition hover:bg-rose-50"
              >
                <AlertTriangle size={16} aria-hidden />
                Observar
              </button>
            )}
            <button
              type="submit"
              name="status"
              value="pending"
              title="Vuelve a dejarlo en la cola de pendientes"
              className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-[#d8e3df] bg-white px-3 text-sm font-semibold text-[#2c4a47] transition hover:bg-[#f3f7f5]"
            >
              <RotateCcw size={15} aria-hidden />
              Volver a pendiente
            </button>
          </div>
        )}
      </PendingFieldset>
    </form>
  );
}
