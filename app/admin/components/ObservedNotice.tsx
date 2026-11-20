import type { SupabaseClient } from "@supabase/supabase-js";
import { WhatsAppMark } from "@/components/common/WhatsAppMark";
import { observationMessage, whatsappUrl } from "@/utils/whatsapp";

/**
 * Después de observar un comprobante: ofrece avisarle al campista por WhatsApp
 * con la nota que se acaba de guardar, para que lo corrija desde su cuenta.
 */
export async function ObservedNotice({
  client,
  id,
  tipo,
  compact = false,
}: {
  client: SupabaseClient;
  id?: string;
  tipo?: string;
  /** Franja angosta bajo la cabecera de la cola de validación. */
  compact?: boolean;
}) {
  if (!id || !/^[0-9a-f-]{36}$/i.test(id) || (tipo !== "inicial" && tipo !== "abono")) return null;

  let firstName = "";
  let phone = "";
  let note = "";
  let what = "tu comprobante de inscripción";
  if (tipo === "inicial") {
    const { data } = await client.from("registrations").select("first_name,phone,review_note,status").eq("id", id).maybeSingle();
    if (!data || data.status !== "rejected") return null;
    firstName = data.first_name;
    phone = data.phone;
    note = data.review_note ?? "";
  } else {
    const { data: payment } = await client
      .from("registration_payments")
      .select("registration_id,amount,review_note,status,kind")
      .eq("id", id)
      .maybeSingle();
    if (!payment || payment.status !== "rejected") return null;
    const { data: reg } = await client.from("registrations").select("first_name,phone").eq("id", payment.registration_id).maybeSingle();
    if (!reg) return null;
    firstName = reg.first_name;
    phone = reg.phone;
    note = payment.review_note ?? "";
    what = payment.kind === "replacement" ? "tu comprobante corregido" : `tu abono de S/ ${payment.amount}`;
  }
  if (!phone || !note) return null;

  const url = whatsappUrl(phone, observationMessage(firstName, what, note));

  if (compact) {
    return (
      <div role="status" className="flex items-center gap-3 border-b border-rose-200 bg-rose-50 py-1.5 pl-4 pr-2">
        <p className="min-w-0 flex-1 truncate text-sm text-rose-900">
          Observaste a <strong>{firstName}</strong>.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-[#187a42] px-3 text-sm font-bold text-white transition hover:bg-[#136536]"
        >
          <WhatsAppMark className="size-4" />
          Avisarle
        </a>
      </div>
    );
  }

  return (
    <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 sm:flex-nowrap">
      <p className="min-w-0 flex-1 text-sm text-rose-900">
        Observaste el comprobante de <strong>{firstName}</strong>. Avísale para que lo corrija.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-[#187a42] px-4 text-sm font-bold text-white transition hover:bg-[#136536] max-sm:w-full max-sm:justify-center"
      >
        <WhatsAppMark className="size-4" />
        Avisar por WhatsApp
      </a>
    </div>
  );
}
