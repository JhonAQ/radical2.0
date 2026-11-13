import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { HistorialTimeline } from "./components/HistorialTimeline";

export const metadata = {
  title: "Historial de Pagos | Radical 2.0",
  description: "Revisa todos los movimientos de tu inscripción en Radical 2.0.",
};

export default async function HistorialPage() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: registration } = await supabase
    .from("registrations")
    .select("id,plan,price,amount,status,created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!registration) redirect("/inscripcion");

  const { data: payments } = await supabase
    .from("registration_payments")
    .select("id,amount,status,kind,created_at,review_note")
    .eq("registration_id", registration.id)
    .order("created_at", { ascending: false });

  return (
    <HistorialTimeline
      registration={registration}
      payments={payments ?? []}
    />
  );
}
