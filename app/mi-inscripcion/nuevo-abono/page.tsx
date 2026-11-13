import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { NuevoAbonoForm } from "./components/NuevoAbonoForm";

export const metadata = {
  title: "Nuevo Abono | Radical 2.0",
  description: "Registra un nuevo abono para tu inscripción en Radical 2.0.",
};

export default async function NuevoAbonoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: registration } = await supabase
    .from("registrations")
    .select("id,plan,price,amount,status,review_note")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!registration) redirect("/inscripcion");

  const { data: payments } = await supabase
    .from("registration_payments")
    .select("amount,status,kind")
    .eq("registration_id", registration.id);

  const allPayments = payments ?? [];
  const approvedAdditional = allPayments
    .filter((p) => p.kind === "additional" && p.status === "approved")
    .reduce((n, p) => n + p.amount, 0);
  const pendingAdditional = allPayments
    .filter((p) => p.kind === "additional" && p.status === "pending")
    .reduce((n, p) => n + p.amount, 0);

  const totalPaid = registration.amount + approvedAdditional;
  const remaining = Math.max(0, registration.price - totalPaid);
  const maximumAllowed = Math.max(0, remaining - pendingAdditional);

  const params = await searchParams;
  const isCorrection = params.tipo === "correccion" && registration.status === "rejected";

  /* If nothing to pay and not a correction, go back */
  if (!isCorrection && maximumAllowed <= 0) redirect("/mi-inscripcion");

  return (
    <NuevoAbonoForm
      userId={user.id}
      registrationId={registration.id}
      registrationStatus={registration.status}
      plan={registration.plan}
      price={registration.price}
      totalPaid={totalPaid}
      remaining={remaining}
      maximumAllowed={isCorrection ? registration.price : maximumAllowed}
      isCorrection={isCorrection}
    />
  );
}
