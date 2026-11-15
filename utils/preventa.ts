/** Fecha de corte por defecto si camp_settings no responde: fin del 15 de diciembre de 2026 (Lima). */
export const DEFAULT_PREVENTA_DEADLINE = "2026-12-16T00:00:00-05:00";

const limaDay = (date: Date, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", ...options }).format(date);

/**
 * `deadline` es el instante en que la preventa deja de aceptarse (00:00 del día siguiente, hora de Lima).
 * Devuelve textos como "15 de diciembre" para el último día de preventa y el primero de plan regular.
 */
export function preventaDates(deadline: string) {
  const end = new Date(deadline);
  if (Number.isNaN(end.getTime())) return preventaDates(DEFAULT_PREVENTA_DEADLINE);
  const last = new Date(end.getTime() - 1);
  const format = { day: "numeric", month: "long" } as const;
  return {
    lastDay: limaDay(last, format),
    firstRegularDay: limaDay(end, format),
    lastDayNumber: limaDay(last, { day: "numeric" }),
    lastMonth: limaDay(last, { month: "long" }),
    /** YYYY-MM-DD del último día de preventa en Lima, para el input de fecha del admin. */
    lastDayInput: limaDay(last, { year: "numeric", month: "2-digit", day: "2-digit" }).split("/").reverse().join("-"),
  };
}
