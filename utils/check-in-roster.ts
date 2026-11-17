import type { SupabaseClient } from "@supabase/supabase-js";
import { computeBalance } from "@/utils/ticket";

/** PostgREST corta en 1000 filas: se pide por páginas para no perder campistas. */
async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null }>) {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await page(from, from + 999);
    if (!data) break;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

export type RosterRow = {
  id: string;
  first_name: string;
  last_name: string;
  document: string;
  birth_date: string;
  status: string;
  price: number;
  ticket_code: string;
  remaining: number;
  checkedInAt: string | null;
};

/** Padrón de ingreso: cada inscripción con su saldo y su primer ingreso registrado. */
export async function loadCheckInRoster(client: SupabaseClient): Promise<RosterRow[]> {
  const [registrations, payments, checkIns] = await Promise.all([
    fetchAll<{
      id: string;
      first_name: string;
      last_name: string;
      document: string;
      birth_date: string;
      status: string;
      price: number;
      amount: number;
      ticket_code: string;
    }>((from, to) =>
      client
        .from("registrations")
        .select("id,first_name,last_name,document,birth_date,status,price,amount,ticket_code")
        .order("id")
        .range(from, to),
    ),
    fetchAll<{ registration_id: string; amount: number; kind: string; status: string }>((from, to) =>
      client
        .from("registration_payments")
        .select("registration_id,amount,kind,status")
        .eq("kind", "additional")
        .order("id")
        .range(from, to),
    ),
    fetchAll<{ registration_id: string; created_at: string }>((from, to) =>
      client
        .from("registration_check_ins")
        .select("registration_id,created_at")
        .eq("kind", "ingreso")
        .order("created_at", { ascending: true })
        .range(from, to),
    ),
  ]);

  const paymentsByReg = new Map<string, typeof payments>();
  for (const p of payments) {
    const list = paymentsByReg.get(p.registration_id) ?? [];
    list.push(p);
    paymentsByReg.set(p.registration_id, list);
  }
  const firstCheckIn = new Map<string, string>();
  for (const c of checkIns) if (!firstCheckIn.has(c.registration_id)) firstCheckIn.set(c.registration_id, c.created_at);

  return registrations
    .map(({ amount, ...r }) => ({
      ...r,
      remaining: computeBalance({ amount, price: r.price }, paymentsByReg.get(r.id) ?? []).remaining,
      checkedInAt: firstCheckIn.get(r.id) ?? null,
    }))
    .sort((a, b) => a.last_name.localeCompare(b.last_name, "es") || a.first_name.localeCompare(b.first_name, "es"));
}

/** Solo los números, para el inicio del admin y el escáner. */
export async function loadCheckInCounts(client: SupabaseClient) {
  const [{ count: total }, checkIns] = await Promise.all([
    client.from("registrations").select("*", { count: "exact", head: true }),
    fetchAll<{ registration_id: string }>((from, to) =>
      client.from("registration_check_ins").select("registration_id").eq("kind", "ingreso").order("id").range(from, to),
    ),
  ]);
  return { total: total ?? 0, checkedIn: new Set(checkIns.map((c) => c.registration_id)).size };
}
