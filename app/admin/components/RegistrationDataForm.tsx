import { ChevronDown, Pencil } from "lucide-react";
import { updateRegistrationData } from "../actions";
import { adminInputClass, type Registration } from "../types";
import { PendingFieldset } from "./PendingFieldset";

const label = "block text-sm font-semibold text-[#2c4a47]";

/** Fila plegable de «Más acciones» en la ficha. */
export function RegistrationDataForm({ registration: r }: { registration: Registration }) {
  return (
    <details className="group">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-2 sm:px-5 [&::-webkit-details-marker]:hidden">
        <Pencil size={17} className="shrink-0 text-[#0a524a]" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-[#0a3039]">Editar datos</span>
          <span className="block text-xs text-[#5f7a75]">Nombre, documento, correo y contactos. Queda en el historial.</span>
        </span>
        <ChevronDown size={16} className="shrink-0 text-[#7d948f] transition group-open:rotate-180" aria-hidden />
      </summary>
      <form action={updateRegistrationData} className="grid gap-3 px-4 pb-5 pt-1 sm:grid-cols-2 sm:px-5">
        <PendingFieldset className="contents">
        <input type="hidden" name="id" value={r.id} />
        <label className={label}>Nombres
          <input className={`${adminInputClass} mt-1`} name="first_name" defaultValue={r.first_name} required maxLength={100} />
        </label>
        <label className={label}>Apellidos
          <input className={`${adminInputClass} mt-1`} name="last_name" defaultValue={r.last_name} required maxLength={100} />
        </label>
        <label className={label}>Documento
          <input className={`${adminInputClass} mt-1`} name="document" defaultValue={r.document} required pattern="[A-Za-z0-9]{6,12}" title="6 a 12 letras o números" />
        </label>
        <label className={label}>Correo
          <input className={`${adminInputClass} mt-1`} type="email" name="email" defaultValue={r.email} required />
        </label>
        <label className={label}>Fecha de nacimiento
          <input className={`${adminInputClass} mt-1`} type="date" name="birth_date" defaultValue={r.birth_date} required />
        </label>
        <label className={label}>Género
          <select className={`${adminInputClass} mt-1`} name="gender" defaultValue={r.gender}>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
            <option value="otro">Otro</option>
          </select>
        </label>
        <label className={label}>WhatsApp
          <input className={`${adminInputClass} mt-1`} name="phone" defaultValue={r.phone} required minLength={9} maxLength={25} />
        </label>
        <label className={label}>Contacto de emergencia
          <input className={`${adminInputClass} mt-1`} name="emergency_name" defaultValue={r.emergency_name} required maxLength={150} />
        </label>
        <label className={label}>Parentesco
          <input className={`${adminInputClass} mt-1`} name="emergency_relation" defaultValue={r.emergency_relation} required maxLength={50} />
        </label>
        <label className={label}>Celular de emergencia
          <input className={`${adminInputClass} mt-1`} name="emergency_phone" defaultValue={r.emergency_phone} required minLength={9} maxLength={25} />
        </label>
        <div className="sm:col-span-2">
          <button className="min-h-12 w-full rounded-xl bg-[#00766f] px-5 text-base font-bold text-white transition hover:bg-[#00635d] sm:w-auto sm:text-sm">
            Guardar datos
          </button>
        </div>
        </PendingFieldset>
      </form>
    </details>
  );
}
