/**
 * Entrada virtual: el QR solo contiene una URL con el código de la inscripción,
 * nunca datos personales. Se apunta siempre al dominio de producción porque las
 * entradas se descargan e imprimen.
 */
export const TICKET_BASE_URL = "https://radical2-0.vercel.app";

/** "K7QX93FD2MHT" → "K7QX-93FD-2MHT" */
export function formatTicketCode(code: string): string {
  return code.match(/.{1,4}/g)?.join("-") ?? code;
}

/** Acepta lo que el admin escriba o lo que traiga el QR (URL completa, guiones, minúsculas). */
export function normalizeTicketCode(input: string): string | null {
  const raw = input.trim();
  const fromUrl = raw.match(/\/e\/([^/?#\s]+)/i)?.[1] ?? raw;
  const code = fromUrl.toUpperCase().replace(/[\s-]/g, "");
  return /^[2-9A-HJKMNP-Z]{12}$/.test(code) ? code : null;
}

export function ticketUrl(code: string): string {
  return `${TICKET_BASE_URL}/e/${code}`;
}

type BalanceRegistration = { amount: number; price: number };
type BalancePayment = { amount: number; kind: string; status: string };

/** Misma regla que el panel: inicial + abonos adicionales aprobados. */
export function computeBalance(registration: BalanceRegistration, payments: BalancePayment[]) {
  const totalPaid =
    registration.amount +
    payments
      .filter((p) => p.kind === "additional" && p.status === "approved")
      .reduce((n, p) => n + p.amount, 0);
  const pendingAmount = payments
    .filter((p) => p.kind === "additional" && p.status === "pending")
    .reduce((n, p) => n + p.amount, 0);
  const remaining = Math.max(0, registration.price - totalPaid);
  return { totalPaid, pendingAmount, remaining };
}

/** La entrada solo vale cuando el pago inicial está validado. */
export type TicketState = "active" | "pending" | "rejected";

export function ticketState(status: string): TicketState {
  if (status === "approved") return "active";
  if (status === "rejected") return "rejected";
  return "pending";
}
