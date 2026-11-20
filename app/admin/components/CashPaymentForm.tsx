import { Banknote, ChevronDown } from "lucide-react";
import { registerCashPayment } from "../actions";
import { adminInputClass } from "../types";
import { PendingFieldset } from "./PendingFieldset";

/**
 * Registro de efectivo recibido en persona. Se aprueba al instante:
 * la verificación es el admin contando el dinero.
 */
export function CashPaymentForm({
  registrationId,
  approved,
  remaining,
  price,
  scannerCode,
  collapsible = false,
}: {
  registrationId: string;
  approved: boolean;
  remaining: number;
  price: number;
  /** Desde el escáner: al guardar vuelve a la ficha rápida en vez del detalle. */
  scannerCode?: string;
  /** Plegado dentro de otra tarjeta (ficha): se abre al tocar «Registrar pago en efectivo». */
  collapsible?: boolean;
}) {
  if (approved && remaining <= 0) return null;
  const min = approved ? 1 : 50;
  const max = approved ? remaining : price;
  const explanation = approved
    ? "Para dinero recibido en mano. Queda aprobado al instante y se descuenta del saldo."
    : "La inscripción aún no está aprobada: el efectivo reemplaza al comprobante inicial y la inscripción queda aprobada.";

  const form = (
    <form action={registerCashPayment} className="mt-3 grid gap-3">
      <PendingFieldset className="contents">
        <input type="hidden" name="id" value={registrationId} />
        {scannerCode && <input type="hidden" name="scanner_code" value={scannerCode} />}
        <label className="block text-sm font-semibold text-[#2c4a47]">
          Monto recibido (S/)
          <input
            className={`${adminInputClass} mt-1`}
            type="number"
            name="amount"
            inputMode="numeric"
            min={min}
            max={max}
            step={1}
            defaultValue={max}
            required
          />
          <span className="mt-1 block text-xs font-normal text-[#5f7a75]">
            Entre S/ {min} y S/ {max}.
          </span>
        </label>
        <label className="block text-sm font-semibold text-[#2c4a47]">
          Nota (opcional)
          <input className={`${adminInputClass} mt-1`} name="note" maxLength={200} placeholder="Ej.: recibido en el campamento, recibo N° 012" />
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-[#2c4a47]">
          <input type="checkbox" name="confirm" required className="size-5 shrink-0 accent-emerald-700" />
          Conté el dinero y lo recibí en mano.
        </label>
        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-base font-bold text-white shadow-sm transition hover:bg-emerald-800 sm:text-sm"
        >
          <Banknote size={17} aria-hidden />
          Registrar efectivo
        </button>
      </PendingFieldset>
    </form>
  );

  if (collapsible) {
    return (
      <details className="group mt-4 border-t border-[#eef2ef]">
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 pt-1 text-sm font-semibold text-emerald-800 [&::-webkit-details-marker]:hidden">
          <Banknote size={17} aria-hidden />
          Registrar pago en efectivo
          <ChevronDown size={16} className="ml-auto transition group-open:rotate-180" aria-hidden />
        </summary>
        <p className="text-xs text-[#5f7a75]">{explanation}</p>
        {form}
      </details>
    );
  }

  return (
    <section className="rounded-2xl border border-[#e2e8e4] bg-white p-4 sm:p-5">
      <h2 className="flex items-center gap-2 text-base font-bold text-[#082e39]">
        <Banknote size={18} className="text-emerald-700" aria-hidden />
        Registrar pago en efectivo
      </h2>
      <p className="mt-0.5 text-xs text-[#5f7a75]">{explanation}</p>
      {form}
    </section>
  );
}
