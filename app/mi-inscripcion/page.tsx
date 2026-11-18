import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import QRCode from "qrcode";
import { computeBalance, ticketUrl } from "@/utils/ticket";
import { MiInscripcionDashboard } from "./components/MiInscripcionDashboard";

export const metadata = {
  title: "Mi Inscripción | Radical 2.0",
  description: "Consulta el estado de tu inscripción y gestiona tus abonos.",
};

export default async function MiInscripcionPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
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
      "id,first_name,last_name,document,birth_date,email,phone,plan,price,amount,payment_type,payment_method,status,review_note,created_at,ticket_code",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (!registration) redirect("/inscripcion");

  const { data: payments } = await supabase
    .from("registration_payments")
    .select("id,amount,status,kind,method,created_at,review_note")
    .eq("registration_id", registration.id)
    .order("created_at", { ascending: false });

  const allPayments = payments ?? [];

  // Solo devuelve el enlace si la inscripción está en revisión o aprobada.
  const { data: whatsappGroupUrl } = await supabase.rpc("get_camp_whatsapp_group");

  const { totalPaid, pendingAmount, remaining } = computeBalance(registration, allPayments);

  // QR vectorial generado en el servidor; solo lleva la URL con el código.
  const qrSvg = await QRCode.toString(ticketUrl(registration.ticket_code), {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#0b2d36", light: "#00000000" },
  });

  return (
    <MiInscripcionDashboard
      registration={registration}
      payments={allPayments}
      totalPaid={totalPaid}
      pendingAmount={pendingAmount}
      remaining={remaining}
      avatarUrl={avatarUrl}
      qrSvg={qrSvg}
      whatsappGroupUrl={whatsappGroupUrl ?? null}
      initialTab={tab === "entrada" || tab === "pagos" || tab === "datos" ? tab : "inicio"}
    />
  );
}
