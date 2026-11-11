import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RegistrationFlow } from "@/components/registration/RegistrationFlow";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Inscripción",
  description: "Elige tu plan y conoce los pasos para inscribirte a Radical 2.0.",
};

export default async function RegistrationPage({ searchParams }: {
  searchParams: Promise<{ plan?: string | string[] }>;
}) {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
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

  const { plan } = await searchParams;
  const selectedPlan = typeof plan === "string" && (plan === "preventa" || plan === "regular") ? plan : null;
  return <RegistrationFlow initialPlan={selectedPlan} userId={user.id} userEmail={user.email ?? ""} avatarUrl={avatarUrl} initialFirstName={firstName} initialLastName={lastName} />;
}
