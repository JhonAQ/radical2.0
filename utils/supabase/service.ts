import { createClient } from "@supabase/supabase-js";

/** Cliente con la clave secreta (salta RLS). Solo servidor y solo tras validar que quien llama es admin. */
export function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Correos de cuentas (admins) para mostrar quién hizo algo. Si falla, devuelve un mapa vacío. */
export async function emailsForUsers(ids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const client = serviceClient();
  if (!client) return out;
  await Promise.all(
    [...new Set(ids)].map(async (id) => {
      const { data } = await client.auth.admin.getUserById(id);
      if (data.user?.email) out.set(id, data.user.email);
    }),
  );
  return out;
}
