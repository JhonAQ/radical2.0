import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { MiInscripcionDashboard } from "./components/MiInscripcionDashboard";

export const metadata = {
  title: "Mi Inscripción | Radical 2.0",
  description: "Consulta el estado de tu inscripción y gestiona tus abonos.",
};

export default async function MiInscripcionPage() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const avatarUrl =
    typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : typeof user.user_metadata?.picture === "string"
        ? user.user_metadata.picture
        : null;

  const { data: registration } = await supabase
    .from("registrations")
    .select(
      "id,first_name,last_name,document,email,phone,plan,price,amount,payment_type,status,review_note,created_at",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (!registration) redirect("/inscripcion");

  const { data: payments } = await supabase
    .from("registration_payments")
    .select("id,amount,status,kind,created_at,review_note")
    .eq("registration_id", registration.id)
    .order("created_at", { ascending: false });

  const allPayments = payments ?? [];

  const totalPaid =
    registration.amount +
    allPayments
      .filter((p) => p.kind === "additional" && p.status === "approved")
      .reduce((n, p) => n + p.amount, 0);

  const pendingAmount = allPayments
    .filter((p) => p.kind === "additional" && p.status === "pending")
    .reduce((n, p) => n + p.amount, 0);

  const remaining = Math.max(0, registration.price - totalPaid);

  return (
    <MiInscripcionDashboard
      registration={registration}
      payments={allPayments}
      totalPaid={totalPaid}
      pendingAmount={pendingAmount}
      remaining={remaining}
      avatarUrl={avatarUrl}
    />
  );
}
