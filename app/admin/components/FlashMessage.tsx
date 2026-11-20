"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { errorMessages, successMessages } from "../types";

/**
 * Aviso tras una acción. Los de éxito aparecen como aviso flotante y se cierran
 * solos; los errores quedan visibles hasta cerrarlos. En ambos casos se quita
 * el parámetro de la URL para que no reaparezcan al recargar.
 */
export function FlashMessage({ error, success, fallbackError }: { error?: string; success?: string; fallbackError?: string }) {
  const errorText = error ? errorMessages[error] || fallbackError || "Ocurrió un error. Inténtalo de nuevo." : null;
  const successText = !errorText && success ? successMessages[success] || "Listo." : null;
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!errorText && !successText) return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      url.searchParams.delete("success");
      window.history.replaceState(window.history.state, "", url);
    } catch {}
    if (!successText) return;
    const t = window.setTimeout(() => setOpen(false), 4500);
    return () => window.clearTimeout(t);
  }, [errorText, successText]);

  if (!open || (!errorText && !successText)) return null;

  if (errorText) {
    return (
      <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
        <CircleAlert size={18} className="mt-px shrink-0" aria-hidden />
        <p className="flex-1">{errorText}</p>
        <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar aviso" className="-m-1 grid size-8 place-items-center rounded-lg hover:bg-red-100">
          <X size={16} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-24 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-xl bg-[#082f39] px-4 py-3 text-sm font-semibold text-white shadow-2xl motion-safe:animate-[flash-in_.2s_ease-out] lg:bottom-6 lg:left-auto lg:right-6 lg:mx-0 print:hidden"
    >
      <CheckCircle2 size={18} className="shrink-0 text-[#5fe0c8]" aria-hidden />
      <p className="flex-1">{successText}</p>
      <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar aviso" className="-m-1 grid size-8 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white">
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}
