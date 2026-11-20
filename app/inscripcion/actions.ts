"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { INVITE_COOKIE, isInviteToken } from "@/utils/invite";

export type RedeemInput = {
  firstName: string;
  lastName: string;
  document: string;
  birthDate: string;
  gender: string;
  phone: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
};

export type RedeemResult =
  | { ok: true; id: string }
  | { ok: false; error: "invite" | "full" | "closed" | "registered" | "document" | "data" | "unknown" };

/** Inscripción por invitación: queda aprobada con el abono que el equipo ya recibió. */
export async function redeemInvite(input: RedeemInput): Promise<RedeemResult> {
  const store = await cookies();
  const token = store.get(INVITE_COOKIE)?.value;
  if (!isInviteToken(token)) return { ok: false, error: "invite" };
  const supabase = createClient(store);
  const { data, error } = await supabase.rpc("redeem_registration_invite", {
    p_token: token,
    p_first_name: String(input.firstName ?? ""),
    p_last_name: String(input.lastName ?? ""),
    p_document: String(input.document ?? ""),
    p_birth_date: String(input.birthDate ?? ""),
    p_gender: String(input.gender ?? ""),
    p_phone: String(input.phone ?? ""),
    p_emergency_name: String(input.emergencyName ?? ""),
    p_emergency_relation: String(input.emergencyRelation ?? ""),
    p_emergency_phone: String(input.emergencyPhone ?? ""),
  });
  if (error) {
    const message = error.message ?? "";
    if (error.code === "23505" && message.includes("document")) return { ok: false, error: "document" };
    if (message.includes("invite_full")) return { ok: false, error: "full" };
    if (message.includes("invite_closed")) return { ok: false, error: "closed" };
    if (message.includes("invite_not_found")) return { ok: false, error: "invite" };
    if (message.includes("already_registered")) return { ok: false, error: "registered" };
    if (message.includes("invalid_data") || error.code === "22007" || error.code === "22008") return { ok: false, error: "data" };
    return { ok: false, error: "unknown" };
  }
  store.delete(INVITE_COOKIE);
  revalidatePath("/admin", "layout");
  return { ok: true, id: String(data) };
}
