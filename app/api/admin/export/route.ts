import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { Registration } from "@/app/admin/types";

type ExportType = "general" | "financiero" | "contactos" | "emergencias";

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toRow(cells: unknown[]): string {
  return cells.map(escapeCSV).join(",");
}

function formatDate(isoDate: string, timeZone = "America/Lima"): string {
  return new Date(isoDate).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone,
  });
}

export async function GET(req: NextRequest) {
  // ── Auth guard ──────────────────────────────────────────────
  const client = createClient(await cookies());
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: membership } = await client
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  // ── Params ──────────────────────────────────────────────────
  const { searchParams } = req.nextUrl;
  const exportType = (searchParams.get("type") || "general") as ExportType;
  const statusFilter = searchParams.get("status") || "all";
  const planFilter = searchParams.get("plan") || "all";

  // ── Fetch registrations (paginated batch to avoid memory spikes) ──
  const rows: Registration[] = [];
  for (let offset = 0; ; offset += 1000) {
    let query = client
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: true })
      .range(offset, offset + 999);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }
    if (planFilter !== "all") {
      query = query.ilike("plan", planFilter);
    }

    const { data, error } = await query;
    if (error || !data) break;
    rows.push(...(data as Registration[]));
    if (data.length < 1000) break;
  }

  // Fetch payments for financial report
  let paymentTotals: Record<string, number> = {};
  if (exportType === "financiero") {
    const payments: { registration_id: string; amount: number; kind: string; status: string }[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await client
        .from("registration_payments")
        .select("registration_id,amount,kind,status")
        .range(offset, offset + 999);
      if (error || !data) break;
      payments.push(...data);
      if (data.length < 1000) break;
    }
    paymentTotals = payments
      .filter((p) => p.kind === "additional" && p.status === "approved")
      .reduce(
        (acc, p) => {
          acc[p.registration_id] = (acc[p.registration_id] || 0) + p.amount;
          return acc;
        },
        {} as Record<string, number>,
      );
  }

  // ── Build CSV content ───────────────────────────────────────
  let header: string;
  let bodyRows: string[];
  let filename: string;

  const statusLabel: Record<string, string> = {
    pending: "Pendiente",
    approved: "Aprobado",
    rejected: "Observado",
  };

  switch (exportType) {
    case "general":
      filename = "radical2-inscripciones-general";
      header = toRow([
        "N°",
        "Apellidos y Nombres",
        "DNI / Pasaporte",
        "Fecha de Nacimiento",
        "Género",
        "WhatsApp",
        "Correo",
        "Plan",
        "Estado",
        "Fecha de Registro",
      ]);
      bodyRows = rows.map((r, i) =>
        toRow([
          i + 1,
          `${r.last_name} ${r.first_name}`,
          r.document,
          r.birth_date,
          r.gender,
          r.phone,
          r.email,
          r.plan,
          statusLabel[r.status] || r.status,
          formatDate(r.created_at),
        ]),
      );
      break;

    case "financiero":
      filename = "radical2-reporte-financiero";
      header = toRow([
        "N°",
        "Apellidos y Nombres",
        "Plan",
        "Precio Total (S/)",
        "Abono Inicial (S/)",
        "Abonos Adicionales Aprobados (S/)",
        "Total Abonado (S/)",
        "Saldo Pendiente (S/)",
        "Estado de Inscripción",
        "Fecha de Registro",
      ]);
      bodyRows = rows.map((r, i) => {
        const additionals = paymentTotals[r.id] || 0;
        const totalPaid = r.amount + additionals;
        const balance = Math.max(0, r.price - totalPaid);
        return toRow([
          i + 1,
          `${r.last_name} ${r.first_name}`,
          r.plan,
          r.price,
          r.amount,
          additionals,
          totalPaid,
          balance,
          statusLabel[r.status] || r.status,
          formatDate(r.created_at),
        ]);
      });
      break;

    case "contactos":
      filename = "radical2-lista-contactos";
      header = toRow([
        "N°",
        "Apellidos y Nombres",
        "WhatsApp",
        "Correo",
        "Plan",
        "Estado",
      ]);
      bodyRows = rows
        .filter((r) => r.status === "approved")
        .map((r, i) =>
          toRow([
            i + 1,
            `${r.last_name} ${r.first_name}`,
            r.phone,
            r.email,
            r.plan,
            statusLabel[r.status] || r.status,
          ]),
        );
      break;

    case "emergencias":
      filename = "radical2-contactos-emergencia";
      header = toRow([
        "N°",
        "Campista",
        "WhatsApp Campista",
        "Nombre de Emergencia",
        "Relación",
        "Teléfono de Emergencia",
        "Plan",
        "Estado",
      ]);
      bodyRows = rows.map((r, i) =>
        toRow([
          i + 1,
          `${r.last_name} ${r.first_name}`,
          r.phone,
          r.emergency_name,
          r.emergency_relation,
          r.emergency_phone,
          r.plan,
          statusLabel[r.status] || r.status,
        ]),
      );
      break;

    default:
      return NextResponse.json({ error: "Tipo de reporte inválido" }, { status: 400 });
  }

  const csvContent = [header, ...bodyRows].join("\n");
  // UTF-8 BOM so Excel opens it correctly
  const bom = "\uFEFF";
  const dateStr = new Date()
    .toLocaleDateString("es-PE", { timeZone: "America/Lima" })
    .replace(/\//g, "-");

  return new NextResponse(bom + csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}-${dateStr}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
