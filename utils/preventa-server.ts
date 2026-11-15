import { createClient } from "@supabase/supabase-js";
import { DEFAULT_PREVENTA_DEADLINE } from "./preventa";

/** Lee el corte de preventa sin sesión (lo usa la landing pública). Se revalida cada minuto. */
export async function getPreventaDeadline() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return DEFAULT_PREVENTA_DEADLINE;
  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 60 } }) },
    });
    const { data } = await client.from("camp_settings").select("preventa_deadline").eq("id", true).maybeSingle();
    return data?.preventa_deadline ?? DEFAULT_PREVENTA_DEADLINE;
  } catch {
    return DEFAULT_PREVENTA_DEADLINE;
  }
}
