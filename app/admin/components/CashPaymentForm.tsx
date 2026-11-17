import { Banknote } from "lucide-react";
import { registerCashPayment } from "../actions";
import { adminInputClass } from "../types";

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
}: {
  registrationId: string;
  approved: boolean;
  remaining: number;
  price: number;
  /** Desde el escáner: al guardar vuelve a la ficha rápida en vez del detalle. */
  scannerCode?: string;
}) {
  if (approved && remaining <= 0) return null;
  const min = approved ? 1 : 50;
  const max = approved ? remaining : price;

  return (
    <section className="rounded-xl border border-[#e2e8e4] bg-white p-5 shadow-sm sm:p-6">
      <h2 className="flex items-center gap-2 text-base font-bold text-[#082e39]">
        <Banknote size={18} className="text-emerald-700" />
        Registrar pago en efectivo
      </h2>
      <p className="mt-0.5 text-xs text-slate-500">
        {approved
          ? "Para dinero recibido en mano. Queda aprobado al instante y se descuenta del saldo."
          : "La inscripción aún no está aprobada: el efectivo reemplaza al comprobante inicial y la inscripción queda aprobada."}
      </p>
      <form action={registerCashPayment} className="mt-4 grid gap-3">
        <input type="hidden" name="id" value={registrationId} />
        {scannerCode && <input type="hidden" name="scanner_code" value={scannerCode} />}
        <label className="block text-xs font-semibold text-slate-700">
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
          <span className="mt-1 block font-normal text-slate-500">
            Entre S/ {min} y S/ {max}.
          </span>
        </label>
        <label className="block text-xs font-semibold text-slate-700">
          Nota (opcional)
          <input
            className={`${adminInputClass} mt-1`}
            name="note"
            maxLength={200}
            placeholder="Ej.: recibido en el campamento, recibo N° 012"
          />
        </label>
        <label className="flex items-start gap-2 text-xs font-semibold text-slate-700">
          <input type="checkbox" name="confirm" required className="mt-0.5 size-4 accent-emerald-700" />
          Conté el dinero y lo recibí en mano.
        </label>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          <Banknote size={16} />
          Registrar efectivo
        </button>
      </form>
    </section>
  );
}
