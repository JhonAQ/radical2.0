import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RegistrationFlow } from "@/components/registration/RegistrationFlow";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { INVITE_COOKIE, isInviteToken, type InviteInfo } from "@/utils/invite";

export const metadata: Metadata = {
  title: "Inscripción",
  description: "Elige tu plan y conoce los pasos para inscribirte a Radical 2.0.",
};

export default async function RegistrationPage({ searchParams }: {
  searchParams: Promise<{ plan?: string | string[] }>;
}) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Quien ya envió su inscripción no vuelve a pasar por el formulario.
  const { data: existing } = await supabase
    .from("registrations")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) redirect("/mi-inscripcion");
  const avatarUrl = typeof user.user_metadata?.avatar_url === "string"
    ? user.user_metadata.avatar_url
    : typeof user.user_metadata?.picture === "string"
      ? user.user_metadata.picture
      : null;
  const metadata = user.user_metadata ?? {};
  const fullName = typeof metadata.full_name === "string"
    ? metadata.full_name
    : typeof metadata.name === "string"
      ? metadata.name
      : "";
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = typeof metadata.given_name === "string" ? metadata.given_name : nameParts[0] ?? "";
  const lastName = typeof metadata.family_name === "string" ? metadata.family_name : nameParts.slice(1).join(" ");

  const { data: settings } = await supabase
    .from("camp_settings")
    .select("preventa_deadline")
    .eq("id", true)
    .maybeSingle();
  const preventaDeadline = settings?.preventa_deadline ?? "2026-12-16T00:00:00-05:00";

  // Invitación con pago ya recibido (llega por /invitacion/<código>, que deja el código en una cookie).
  const inviteToken = cookieStore.get(INVITE_COOKIE)?.value;
  let invite: InviteInfo | null = null;
  if (isInviteToken(inviteToken)) {
    const { data } = await supabase.rpc("get_registration_invite", { p_token: inviteToken });
    const row = Array.isArray(data) ? data[0] : null;
    if (row && (row.plan === "preventa" || row.plan === "regular")) {
      invite = { plan: row.plan, amount: row.amount_per_person, slotsLeft: row.slots_left, state: row.state as InviteInfo["state"] };
    }
  }
  if (invite && invite.state !== "open") {
    const reason = invite.state === "full"
      ? "Ya se usaron todos los cupos de este enlace."
      : invite.state === "expired"
        ? "Este enlace ya venció."
        : "Este enlace fue desactivado.";
    return (
      <main className="grid min-h-svh place-items-center bg-[#faf7ed] px-6 text-[#0b2d36]">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-black">El enlace de invitación no está disponible</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#49676c]">{reason} Si ya pagaste, escríbele a quien te envió el enlace para que te ayude.</p>
          <Link href="/invitacion/salir" className="mt-6 flex min-h-12 items-center justify-center rounded-xl bg-[#ffc629] px-5 font-bold">Inscribirme de forma normal</Link>
        </div>
      </main>
    );
  }

  const { plan } = await searchParams;
  const selectedPlan = typeof plan === "string" && (plan === "preventa" || plan === "regular") ? plan : null;
  return <RegistrationFlow preventaDeadline={preventaDeadline} initialPlan={selectedPlan} userId={user.id} userEmail={user.email ?? ""} avatarUrl={avatarUrl} initialFirstName={firstName} initialLastName={lastName} invite={invite} />;
}
