import { statusLabels } from "../types";

const tones: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-800 ring-emerald-200/70",
  rejected: "bg-red-50 text-red-800 ring-red-200/70",
  pending: "bg-sky-50 text-sky-800 ring-sky-200/70",
};

/** Etiqueta única de estado (Pendiente / Aprobado / Observado) para todo el panel. */
export function StatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "md" }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md font-semibold ring-1 ring-inset ${tones[status] ?? tones.pending} ${
        size === "md" ? "px-2.5 py-0.5 text-xs" : "px-2 py-0.5 text-[11px]"
      }`}
    >
      {statusLabels[status] || status}
    </span>
  );
}
