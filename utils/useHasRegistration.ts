"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

// Una sola consulta por carga de página, compartida entre todos los botones.
let cached: Promise<boolean> | null = null;

function checkRegistration(): Promise<boolean> {
  cached ??= (async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;
    const { count } = await supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.user.id);
    return (count ?? 0) > 0;
  })().catch(() => false);
  return cached;
}

/** true si la cuenta con sesión ya envió su inscripción. */
export function useHasRegistration(): boolean {
  const [registered, setRegistered] = useState(false);
  useEffect(() => {
    let alive = true;
    void checkRegistration().then((value) => { if (alive) setRegistered(value); });
    return () => { alive = false; };
  }, []);
  return registered;
}
