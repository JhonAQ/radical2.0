/**
 * Estado de cuenta de un campista en una sola etiqueta: lo que el equipo
 * necesita saber de un vistazo (por validar, observado, cuánto debe o pagado).
 */
export function AccountChip({ status, due, size = "sm" }: { status: string; due: number; size?: "sm" | "md" }) {
  const base = `inline-flex shrink-0 items-center rounded-md font-semibold ring-1 ring-inset ${
    size === "md" ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs"
  }`;
  if (status === "pending") return <span className={`${base} bg-sky-50 text-sky-800 ring-sky-200`}>Por validar</span>;
  if (status === "rejected") return <span className={`${base} bg-rose-50 text-rose-800 ring-rose-200`}>Observado</span>;
  if (due > 0) return <span className={`${base} bg-amber-50 text-amber-900 ring-amber-200 tabular-nums`}>Debe S/ {due}</span>;
  return <span className={`${base} bg-emerald-50 text-emerald-800 ring-emerald-200`}>Pagado</span>;
}
