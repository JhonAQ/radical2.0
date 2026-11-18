import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { computeBalance } from "@/utils/ticket";

export const metadata = { title: "Abonar | Radical 2.0", robots: { index: false, follow: false } };

/**
 * Destino del QR impreso (puertas de cabañas, afiches): lleva a cada campista
 * al paso que le toca para regularizar su pago.
 */
export default async function AbonarPage() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=abonar");

  const { data: reg } = await supabase
    .from("registrations")
    .select("id,status,price,amount")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!reg) redirect("/inscripcion");

  if (reg.status === "rejected") redirect("/mi-inscripcion/nuevo-abono?tipo=correccion");
  // Con el pago inicial en revisión todavía no se pueden enviar abonos.
  if (reg.status !== "approved") redirect("/mi-inscripcion?tab=pagos");

  const { data: payments } = await supabase
    .from("registration_payments")
    .select("amount,kind,status")
    .eq("registration_id", reg.id);
  const { remaining, pendingAmount } = computeBalance(reg, payments ?? []);

  // Lo que ya está en revisión cuenta como enviado: si cubre el saldo, no hay nada más que abonar.
  if (remaining - pendingAmount > 0) redirect("/mi-inscripcion/nuevo-abono");
  redirect(remaining > 0 ? "/mi-inscripcion?tab=pagos" : "/mi-inscripcion?tab=entrada");
}
