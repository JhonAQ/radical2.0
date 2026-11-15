"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function updateMyData(form: FormData) {
  const client = createClient(await cookies());
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");
  const text = (name: string) => String(form.get(name) || "").trim();
  const { error } = await client.rpc("update_my_registration", {
    p_id: text("id"),
    p_first_name: text("first_name"),
    p_last_name: text("last_name"),
    p_birth_date: text("birth_date"),
    p_gender: text("gender"),
    p_phone: text("phone"),
    p_emergency_name: text("emergency_name"),
    p_emergency_relation: text("emergency_relation"),
    p_emergency_phone: text("emergency_phone"),
  });
  if (error) redirect("/mi-inscripcion/datos?error=1");
  revalidatePath("/mi-inscripcion");
  redirect("/mi-inscripcion/datos?saved=1");
}
