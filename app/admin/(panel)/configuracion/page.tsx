import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { updateCampSettings, updateWhatsappGroup } from "../../actions";
import { DEFAULT_PREVENTA_DEADLINE, preventaDates } from "@/utils/preventa";
import {
  adminButtonClass,
  adminInputClass,
} from "../../types";
import { FlashMessage } from "../../components/FlashMessage";
import { PendingFieldset } from "../../components/PendingFieldset";

export const metadata = { title: "Configuración | Radical 2.0" };

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const client = createClient(await cookies());
  const {
    data: { user },
  } = await client.auth.getUser();
  const { data: membership } = user
    ? await client.from("admin_users").select("role").eq("user_id", user.id).maybeSingle()
    : { data: null };
  if (membership?.role !== "master") {
    return (
      <p className="max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
        La configuración del campamento solo la puede cambiar la cuenta maestra.
      </p>
    );
  }
  const [{ data }, { data: privateSettings }] = await Promise.all([
    client.from("camp_settings").select("preventa_deadline").eq("id", true).maybeSingle(),
    client.from("camp_private_settings").select("whatsapp_group_url").eq("id", true).maybeSingle(),
  ]);
  const groupUrl = privateSettings?.whatsapp_group_url ?? "";
  const isPlaceholder = groupUrl.endsWith("/RadicalCampPlaceholder");

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0a3039] sm:text-3xl">Configuración</h1>
        <p className="mt-1 text-sm text-[#5f7a75]">Ajustes que afectan a las inscripciones.</p>
      </div>
      <FlashMessage error={params.error} success={params.success} />
      <form action={updateCampSettings} className="space-y-4 rounded-xl border border-[#e2e8e4] bg-white p-5 shadow-sm sm:p-6">
        <PendingFieldset className="contents">
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
        </PendingFieldset>
      </form>

      <form action={updateWhatsappGroup} className="space-y-4 rounded-xl border border-[#e2e8e4] bg-white p-5 shadow-sm sm:p-6">
        <PendingFieldset className="contents">
        <label className="block text-sm font-semibold text-[#082e39]">
          Grupo de WhatsApp de campistas
          <input
            type="url"
            name="whatsapp_group_url"
            defaultValue={groupUrl}
            placeholder="https://chat.whatsapp.com/…"
            inputMode="url"
            className={`${adminInputClass} mt-2 font-mono text-xs`}
          />
        </label>
        {isPlaceholder && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            Es un enlace de ejemplo: reemplázalo por la invitación real del grupo.
          </p>
        )}
        <p className="text-xs text-slate-500">
          Se muestra en «Mi inscripción» a quienes tienen su inscripción en revisión o aprobada. No aparece en la
          página pública. Déjalo vacío para ocultarlo. En WhatsApp: grupo → Invitar con enlace → Copiar enlace.
        </p>
        <button className={adminButtonClass}>Guardar enlace</button>
        </PendingFieldset>
      </form>
    </div>
  );
}
