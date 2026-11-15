import { updateRegistrationData } from "../actions";
import { adminInputClass, type Registration } from "../types";

const label = "block text-xs font-semibold text-slate-700";

export function RegistrationDataForm({ registration: r }: { registration: Registration }) {
  return (
    <details className="group rounded-xl border border-[#e2e8e4] bg-white p-5 shadow-sm sm:p-6">
      <summary className="cursor-pointer list-none text-base font-bold text-[#082e39]">
        Editar datos del participante
        <span className="ml-2 text-xs font-normal text-slate-500">
          Documento, correo y contactos. Queda registrado en el historial.
        </span>
      </summary>
      <form action={updateRegistrationData} className="mt-4 grid gap-3 sm:grid-cols-2">
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
          <button className="rounded-lg bg-[#008e87] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#007670]">
            Guardar datos
          </button>
        </div>
      </form>
    </details>
  );
}
