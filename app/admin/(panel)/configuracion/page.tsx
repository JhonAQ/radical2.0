import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { updateCampSettings } from "../../actions";
import { DEFAULT_PREVENTA_DEADLINE, preventaDates } from "@/utils/preventa";
import {
  adminButtonClass,
  adminInputClass,
  errorMessages,
  successMessages,
} from "../../types";

export const metadata = { title: "Configuración | Radical 2.0" };

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const client = createClient(await cookies());
  const { data } = await client
    .from("camp_settings")
    .select("preventa_deadline")
    .eq("id", true)
    .maybeSingle();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0a3039] sm:text-3xl">Configuración</h1>
        <p className="mt-1 text-sm text-[#5f7a75]">Ajustes que afectan a las inscripciones.</p>
      </div>
      {params.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMessages[params.error] ?? "Ocurrió un error."}
        </p>
      )}
      {params.success && (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {successMessages[params.success] ?? "Guardado."}
        </p>
      )}
      <form action={updateCampSettings} className="space-y-4 rounded-xl border border-[#e2e8e4] bg-white p-5 shadow-sm sm:p-6">
        <label className="block text-sm font-semibold text-[#082e39]">
          Último día de la preventa
          <input
            type="date"
            name="preventa_last_day"
            required
            defaultValue={preventaDates(data?.preventa_deadline ?? DEFAULT_PREVENTA_DEADLINE).lastDayInput}
            className={`${adminInputClass} mt-2`}
          />
        </label>
        <p className="text-xs text-slate-500">
          La preventa vale hasta las 12 de la noche de ese día (hora de Lima). Después, nadie podrá inscribirse con el plan Preventa; quienes tengan el formulario abierto verán un aviso y pasarán al plan Regular. Los textos de fechas de la página principal, el FAQ y el formulario se actualizan solos (la landing puede tardar hasta un minuto).
        </p>
        <button className={adminButtonClass}>Guardar</button>
      </form>
    </div>
  );
}
