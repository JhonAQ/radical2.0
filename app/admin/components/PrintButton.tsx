"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";

export function PrintButton({ autoPrint }: { autoPrint?: boolean }) {
  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-xl bg-[#0b2d36] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-[#0c404c] active:scale-95"
    >
      <Printer size={15} className="text-[#ffc629]" />
      <span>Guardar en PDF / Imprimir</span>
    </button>
  );
}
