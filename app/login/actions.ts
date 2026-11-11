"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function signOut() {
  const supabase = createClient(await cookies());
  const { error } = await supabase.auth.signOut();
  redirect(error ? "/login?error=logout" : "/login");
}
