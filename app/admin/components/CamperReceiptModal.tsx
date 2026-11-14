"use client";

import { useState } from "react";
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

export function CamperReceiptModal({
  receipts,
  triggerLabel = "Ver comprobante",
  initialReceiptId,
}: CamperReceiptModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!receipts || receipts.length === 0) return null;

  // Filter or reorder so initial receipt is first
  const activeList = initialReceiptId
    ? [
        ...receipts.filter((r) => r.id === initialReceiptId),
        ...receipts.filter((r) => r.id !== initialReceiptId),
      ]
    : receipts;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-[#0a4249] shadow-sm transition hover:border-[#008e95]/40 hover:bg-[#f4faf9]"
      >
        <Eye size={13} className="text-[#008e95]" />
        <span>{triggerLabel}</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#03232b]/70 p-4 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-[#0c2830] shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 text-white">
              <span className="text-xs font-bold uppercase tracking-wider text-[#00c7c7]">
                Comprobante de pago
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid size-7 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Cerrar visor"
              >
                <X size={16} />
              </button>
            </div>

            {/* Viewer Body */}
            <div className="overflow-y-auto p-2 sm:p-4">
              <ReceiptViewer receipts={activeList} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
