"use client";

import { useEffect, useState } from "react";
import { ReceiptViewer } from "./ReceiptViewer";
import { Eye, X } from "lucide-react";

interface ReceiptItem {
  id: string;
  label: string;
  url: string;
  amount?: number;
  kind?: string;
  status?: string;
}

interface CamperReceiptModalProps {
  receipts: ReceiptItem[];
  triggerLabel?: string;
  initialReceiptId?: string;
}

export function CamperReceiptModal({ receipts, triggerLabel = "Ver comprobante", initialReceiptId }: CamperReceiptModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [isOpen]);

  if (!receipts || receipts.length === 0) return null;

  // El comprobante pedido va primero; el visor permite pasar a los demás.
  const activeList = initialReceiptId
    ? [...receipts.filter((r) => r.id === initialReceiptId), ...receipts.filter((r) => r.id !== initialReceiptId)]
    : receipts;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#d8e3df] bg-white px-3 text-sm font-semibold text-[#0a4249] transition hover:border-[#008e95]/40 hover:bg-[#f4faf9]"
      >
        <Eye size={15} className="text-[#008e95]" aria-hidden />
        <span>{triggerLabel}</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Comprobantes de pago"
          className="fixed inset-0 z-50 flex items-stretch justify-center bg-[#03232b]/80 sm:items-center sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="relative flex w-full max-w-3xl flex-col overflow-hidden bg-[#0c2830] shadow-2xl sm:max-h-[92vh] sm:rounded-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 py-1.5 pl-4 pr-1.5 pt-[calc(0.375rem+env(safe-area-inset-top))] text-white sm:pt-1.5">
              <span className="text-sm font-semibold">Comprobantes de pago</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid size-11 place-items-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Cerrar"
              >
                <X size={20} aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 sm:p-4">
              <ReceiptViewer receipts={activeList} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
