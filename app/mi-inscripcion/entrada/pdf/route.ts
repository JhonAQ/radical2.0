import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { computeBalance } from "@/utils/ticket";
import { buildTicketPdf } from "@/utils/ticket-pdf";

export async function GET() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: reg } = await supabase
    .from("registrations")
    .select("id,first_name,last_name,birth_date,plan,price,amount,status,ticket_code")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!reg) return NextResponse.json({ error: "Sin inscripción" }, { status: 404 });
  if (reg.status !== "approved") {
    return NextResponse.json({ error: "Tu entrada se activa cuando validemos tu pago." }, { status: 409 });
  }

  const { data: payments } = await supabase
    .from("registration_payments")
    .select("amount,kind,status")
    .eq("registration_id", reg.id);
  const { remaining } = computeBalance(reg, payments ?? []);

  const bytes = await buildTicketPdf({ ...reg, remaining });
  const slug = reg.first_name.split(" ")[0].normalize("NFD").replace(/[^a-zA-Z]/g, "").toLowerCase() || "campista";

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="entrada-radical-${slug}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
