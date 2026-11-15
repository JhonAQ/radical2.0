import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { updateMyData } from "../actions";

export const metadata = {
  title: "Mis datos | Radical 2.0",
  description: "Corrige tus datos de contacto y de emergencia.",
};

const input =
  "mt-1 w-full rounded-xl border border-[#cfe0df] bg-white px-4 py-3 text-sm text-[#0b2d36] outline-none focus:border-[#00aeb8] focus:ring-2 focus:ring-[#00aeb8]/20";
const label = "block text-xs font-bold uppercase tracking-wide text-[#607677]";

export default async function MisDatosPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: r } = await supabase
    .from("registrations")
    .select(
      "id,first_name,last_name,document,email,birth_date,gender,phone,emergency_name,emergency_relation,emergency_phone",
    )
    .eq("user_id", user.id)
    .maybeSingle();
  if (!r) redirect("/inscripcion");

  return (
    <div className="mi-inscripcion-card space-y-5">
      <Link href="/mi-inscripcion" className="mi-inscripcion-header-link">
        <ArrowLeft size={16} />
        <span>Volver a mi inscripción</span>
      </Link>
      <h1 className="mi-inscripcion-card-title">Mis datos</h1>
      {params.saved && (
        <p role="status" className="rounded-xl bg-[#e6f6f0] px-4 py-3 text-sm font-semibold text-[#0b6b4d]">
          Tus datos se actualizaron.
        </p>
      )}
      {params.error && (
        <p role="alert" className="rounded-xl bg-[#fdecec] px-4 py-3 text-sm font-semibold text-[#b42318]">
          No pudimos guardar los cambios. Revisa los campos e inténtalo de nuevo.
        </p>
      )}
      <form action={updateMyData} className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="id" value={r.id} />
        <label className={label}>
          Nombres
          <input className={input} name="first_name" defaultValue={r.first_name} required maxLength={100} autoComplete="given-name" />
        </label>
        <label className={label}>
          Apellidos
          <input className={input} name="last_name" defaultValue={r.last_name} required maxLength={100} autoComplete="family-name" />
        </label>
        <label className={label}>
          Documento
          <input className={`${input} bg-[#f1f5f4]`} value={r.document} readOnly aria-readonly="true" />
          <span className="mt-1 block text-[11px] font-normal normal-case text-[#607677]">
            Para cambiar el documento o el correo, escríbenos por WhatsApp.
          </span>
        </label>
        <label className={label}>
          Correo de tu cuenta
          <input className={`${input} bg-[#f1f5f4]`} value={r.email} readOnly aria-readonly="true" />
        </label>
        <label className={label}>
          Fecha de nacimiento
          <input className={input} type="date" name="birth_date" defaultValue={r.birth_date} required />
        </label>
        <label className={label}>
          Género
          <select className={input} name="gender" defaultValue={r.gender} required>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
            <option value="otro">Prefiero no decirlo / Otro</option>
          </select>
        </label>
        <label className={`${label} sm:col-span-2`}>
          WhatsApp
          <input className={input} name="phone" type="tel" defaultValue={r.phone} required minLength={9} maxLength={25} autoComplete="tel" />
        </label>
        <label className={label}>
          Contacto de emergencia
          <input className={input} name="emergency_name" defaultValue={r.emergency_name} required maxLength={150} />
        </label>
        <label className={label}>
          Parentesco
          <select className={input} name="emergency_relation" defaultValue={r.emergency_relation} required>
            {["Madre", "Padre", "Familiar", "Apoderado", "Otro"].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <label className={`${label} sm:col-span-2`}>
          Celular de emergencia
          <input className={input} name="emergency_phone" type="tel" defaultValue={r.emergency_phone} required minLength={9} maxLength={25} />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" className="mi-inscripcion-btn-primary">
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
