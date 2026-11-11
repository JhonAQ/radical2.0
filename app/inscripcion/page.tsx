import type { Metadata } from "next";
import { RegistrationFlow } from "@/components/registration/RegistrationFlow";

export const metadata: Metadata = {
  title: "Inscripción",
  description: "Elige tu plan y conoce los pasos para inscribirte a Radical 2.0.",
};

export default async function RegistrationPage({ searchParams }: {
  searchParams: Promise<{ plan?: string | string[] }>;
}) {
  const { plan } = await searchParams;
  const selectedPlan = typeof plan === "string" && (plan === "preventa" || plan === "regular") ? plan : null;
  return <RegistrationFlow initialPlan={selectedPlan} />;
}
