#!/usr/bin/env node
/**
 * Datos de demostración para enseñar el panel de administración.
 *
 *   node scripts/demo-seed.mjs          → borra la demo anterior y la vuelve a crear (estado inicial)
 *   node scripts/demo-seed.mjs clean    → solo borra la demo
 *
 * Todo lo que crea se reconoce por el correo @demo.example.com: inscripciones,
 * abonos, comprobantes (imágenes marcadas "DEMOSTRACIÓN"), ingresos y cuentas.
 * No toca ninguna otra cuenta. Usa la clave secreta de .env.local (solo local).
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createClient } from "@supabase/supabase-js";

const DOMAIN = "@demo.example.com";
const BUCKET = "registration-receipts";

// ── Entorno ────────────────────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY en .env.local");
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// sharp viene con Next; se resuelve desde su paquete para no añadir dependencias.
const sharp = createRequire(createRequire(import.meta.url).resolve("next/package.json"))("sharp");

// ── Utilidades ─────────────────────────────────────────────────────────────
let seed = 20261230;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = (s, n) => Array.from({ length: n }, () => s[Math.floor(rand() * s.length)]).join("");
const ticketCode = () => pick("23456789ABCDEFGHJKMNPQRSTUVWXYZ", 12);
const phone = () => "9" + pick("0123456789", 8);
const dni = () => pick("1234567", 1) + pick("0123456789", 7);
const slug = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z]+/g, ".");

/** Fecha en Lima (UTC-5) a partir de "2026-11-03 18:20". */
const lima = (s) => new Date(s.replace(" ", "T") + ":00-05:00").toISOString();

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

/** Comprobante tipo billetera digital, marcado como demostración. */
async function receiptPng({ name, amount, date, op }) {
  const d = new Date(date);
  const fecha = d.toLocaleDateString("es-PE", { timeZone: "America/Lima", day: "2-digit", month: "short", year: "numeric" });
  const hora = d.toLocaleTimeString("es-PE", { timeZone: "America/Lima", hour: "2-digit", minute: "2-digit" });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">
  <rect width="720" height="1280" fill="#6c1f7d"/>
  <rect x="40" y="220" width="640" height="820" rx="36" fill="#ffffff"/>
  <text x="360" y="150" text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-size="46" font-weight="700" fill="#ffffff">¡Pago enviado!</text>
  <text x="360" y="340" text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-size="30" fill="#6b6b80">Monto</text>
  <text x="360" y="450" text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-size="110" font-weight="700" fill="#2b0a33">S/ ${amount}</text>
  <text x="360" y="540" text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-size="32" fill="#2b0a33">${esc(name)}</text>
  <line x1="90" y1="600" x2="630" y2="600" stroke="#e7e1ea" stroke-width="3"/>
  <text x="90" y="670" font-family="DejaVu Sans, sans-serif" font-size="28" fill="#6b6b80">Destino</text>
  <text x="630" y="670" text-anchor="end" font-family="DejaVu Sans, sans-serif" font-size="28" font-weight="700" fill="#2b0a33">Radical 2.0 · IELP</text>
  <text x="90" y="740" font-family="DejaVu Sans, sans-serif" font-size="28" fill="#6b6b80">Fecha</text>
  <text x="630" y="740" text-anchor="end" font-family="DejaVu Sans, sans-serif" font-size="28" font-weight="700" fill="#2b0a33">${fecha} · ${hora}</text>
  <text x="90" y="810" font-family="DejaVu Sans, sans-serif" font-size="28" fill="#6b6b80">N.º de operación</text>
  <text x="630" y="810" text-anchor="end" font-family="DejaVu Sans, sans-serif" font-size="28" font-weight="700" fill="#2b0a33">${op}</text>
  <rect x="90" y="890" width="540" height="90" rx="18" fill="#fff4cc"/>
  <text x="360" y="948" text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-size="32" font-weight="700" fill="#8a5a00">DEMOSTRACIÓN · NO VÁLIDO</text>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function upload(userId, file, data) {
  const path = `${userId}/${file}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, await receiptPng(data), { contentType: "image/png", upsert: true });
  if (error) throw error;
  return path;
}

async function listAllUsers() {
  const users = [];
  for (let page = 1; ; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return users;
}

// ── Limpieza ───────────────────────────────────────────────────────────────
async function clean() {
  const demoUsers = (await listAllUsers()).filter((u) => u.email?.endsWith(DOMAIN));
  const ids = demoUsers.map((u) => u.id);
  if (!ids.length) {
    console.log("No había datos de demostración.");
    return;
  }
  const { data: regs } = await sb.from("registrations").select("id").in("user_id", ids);
  const regIds = (regs ?? []).map((r) => r.id);
  if (regIds.length) {
    for (const table of ["registration_check_ins", "registration_review_events", "registration_payments"]) {
      const { error } = await sb.from(table).delete().in("registration_id", regIds);
      if (error) throw error;
    }
    const { error } = await sb.from("registrations").delete().in("id", regIds);
    if (error) throw error;
  }
  // Comprobantes: cada usuario demo tiene su carpeta.
  for (const id of ids) {
    const { data: files } = await sb.storage.from(BUCKET).list(id);
    if (files?.length) await sb.storage.from(BUCKET).remove(files.map((f) => `${id}/${f.name}`));
  }
  for (const id of ids) {
    const { error } = await sb.auth.admin.deleteUser(id);
    if (error) throw error;
  }
  console.log(`Demo borrada: ${ids.length} cuentas, ${regIds.length} inscripciones.`);
}

// ── Personas de la demo ────────────────────────────────────────────────────
// status: estado del pago inicial. pays: abonos posteriores.
// "replacement" = comprobante corregido tras una observación.
const P = (first, last, gender, birth, created, plan, amount, status, extra = {}) => ({
  first, last, gender, birth, created, plan, amount, status, ...extra,
});

const people = [
  // ── Pendientes de validar: forman la cola ──
  P("Valeria", "Quispe Huamán", "femenino", "2004-03-12", "2026-11-14 19:05", "preventa", 100, "pending"),
  P("Diego", "Mamani Flores", "masculino", "2009-07-21", "2026-11-15 08:40", "preventa", 200, "pending"),
  P("Camila", "Torres Apaza", "femenino", "2002-12-28", "2026-11-16 21:15", "preventa", 50, "pending"),
  P("Joaquín", "Ccama Vilca", "masculino", "2005-01-04", "2026-11-18 12:30", "regular", 150, "pending"),
  P("Lucía", "Zegarra Paredes", "femenino", "2010-05-30", "2026-11-19 17:50", "regular", 250, "pending"),

  // ── Aprobados con abono adicional por revisar ──
  P("Mateo", "Condori Ramos", "masculino", "2003-08-09", "2026-10-08 20:10", "preventa", 100, "approved", {
    pays: [{ amount: 100, status: "pending", at: "2026-11-17 09:12" }],
  }),
  P("Ximena", "Huanca Salas", "femenino", "2008-01-17", "2026-10-12 18:00", "preventa", 50, "approved", {
    pays: [
      { amount: 50, status: "approved", at: "2026-10-30 13:20" },
      { amount: 100, status: "pending", at: "2026-11-19 22:05" },
    ],
  }),

  // ── Observados ──
  P("Sebastián", "Puma Cutipa", "masculino", "2006-04-02", "2026-11-02 16:45", "preventa", 100, "rejected", {
    note: "El monto del comprobante (S/ 80) no coincide con lo declarado (S/ 100).",
  }),
  P("Renata", "Chura Pari", "femenino", "2007-11-23", "2026-10-28 10:30", "preventa", 100, "rejected", {
    note: "La foto del comprobante está cortada: no se ve el número de operación.",
    pays: [{ amount: 100, status: "pending", kind: "replacement", at: "2026-11-18 08:15" }],
  }),

  // ── Aprobados con saldo pendiente ──
  P("Andrés", "Vargas Llerena", "masculino", "2001-06-14", "2026-10-05 19:30", "preventa", 100, "approved"),
  P("Fernanda", "Ticona Mendoza", "femenino", "2009-12-31", "2026-10-06 21:00", "preventa", 50, "approved", {
    pays: [{ amount: 50, status: "approved", at: "2026-10-25 11:00" }],
  }),
  P("Gabriel", "Arce Benavides", "masculino", "2004-02-26", "2026-10-09 07:55", "preventa", 100, "approved", {
    pays: [{ amount: 50, status: "approved", method: "efectivo", at: "2026-11-09 12:40", note: "Pago en efectivo: recibido después del culto" }],
  }),
  P("Isabella", "Coaquira Luque", "femenino", "2011-01-09", "2026-10-15 20:20", "preventa", 100, "approved"),
  P("Thiago", "Medina Gutiérrez", "masculino", "2002-09-03", "2026-10-20 18:35", "preventa", 50, "approved", {
    pays: [{ amount: 50, status: "rejected", at: "2026-11-05 15:00", note: "Comprobante duplicado: ya se registró este pago." }],
  }),
  P("Antonella", "Quispe Cáceres", "femenino", "2005-10-11", "2026-11-01 13:10", "preventa", 150, "approved"),

  // ── Pagados completos ──
  P("Nicolás", "Paredes Rivera", "masculino", "2000-12-30", "2026-10-03 22:40", "preventa", 200, "approved"),
  P("Mía", "Salazar Chávez", "femenino", "2006-07-07", "2026-10-04 09:15", "preventa", 100, "approved", {
    pays: [{ amount: 100, status: "approved", at: "2026-10-22 18:30" }],
  }),
  P("Samuel", "Rojas Delgado", "masculino", "2008-01-02", "2026-10-10 16:00", "preventa", 200, "approved"),
  P("Daniela", "Calla Mamani", "femenino", "2003-04-19", "2026-10-11 19:45", "preventa", 50, "approved", {
    pays: [
      { amount: 50, status: "approved", at: "2026-10-26 12:10" },
      { amount: 100, status: "approved", method: "efectivo", at: "2026-11-10 20:00", note: "Pago en efectivo" },
    ],
  }),
  P("Emilio", "Linares Zúñiga", "masculino", "2010-03-15", "2026-10-18 17:25", "preventa", 200, "approved"),
  P("Sofía", "Begazo Núñez", "femenino", "2001-01-25", "2026-10-21 08:05", "preventa", 100, "approved", {
    pays: [{ amount: 100, status: "approved", at: "2026-11-12 19:40" }],
  }),
  P("Adrián", "Cornejo Málaga", "masculino", "2004-09-28", "2026-11-03 21:30", "regular", 250, "approved"),
];

// Entraron con su cuenta y no terminaron la inscripción.
const accountsOnly = [
  ["Rodrigo", "Ayala Pinto", "2026-11-13 18:00"],
  ["Paula", "Huamaní Soto", "2026-11-17 20:45"],
  ["Kevin", "Yucra Lazo", "2026-11-19 09:30"],
];

// ── Creación ───────────────────────────────────────────────────────────────
async function createUser(first, last, created) {
  const email = `${slug(first)}.${slug(last.split(" ")[0])}${DOMAIN}`;
  const { data, error } = await sb.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: `${first} ${last}`, demo: true },
    app_metadata: { provider: "google", providers: ["google"] },
  });
  if (error) throw new Error(`${email}: ${error.message}`);
  return { id: data.user.id, email, created };
}

async function seedAll() {
  await clean();
  let regCount = 0;
  let payCount = 0;
  let op = 40210000;

  for (const p of people) {
    const user = await createUser(p.first, p.last, p.created);
    const price = p.plan === "preventa" ? 200 : 250;
    const createdAt = lima(p.created);
    const name = `${p.first} ${p.last}`;
    const receipt = await upload(user.id, "inicial.png", { name, amount: p.amount, date: createdAt, op: String(op++) });

    const reviewed = p.status === "pending" ? null : new Date(new Date(createdAt).getTime() + 26 * 3600e3).toISOString();
    const { data: reg, error } = await sb
      .from("registrations")
      .insert({
        user_id: user.id,
        created_at: createdAt,
        updated_at: reviewed ?? createdAt,
        first_name: p.first,
        last_name: p.last,
        document: dni(),
        birth_date: p.birth,
        gender: p.gender,
        phone: phone(),
        email: user.email,
        emergency_name: p.gender === "femenino" ? `Rosa ${p.last.split(" ")[1] ?? p.last}` : `Carmen ${p.last.split(" ")[1] ?? p.last}`,
        emergency_relation: "madre",
        emergency_phone: phone(),
        plan: p.plan,
        price,
        amount: p.amount,
        payment_type: p.amount === price ? "full" : "reserve",
        payment_method: "yape",
        receipt_path: receipt,
        status: p.status,
        review_note: p.note ?? null,
        reviewed_at: reviewed,
        ticket_code: ticketCode(),
      })
      .select("id")
      .single();
    if (error) throw new Error(`${name}: ${error.message}`);
    regCount++;

    for (const [i, pay] of (p.pays ?? []).entries()) {
      const at = lima(pay.at);
      const cash = pay.method === "efectivo";
      const path = cash ? null : await upload(user.id, `abono-${i + 1}.png`, { name, amount: pay.amount, date: at, op: String(op++) });
      const { error: payError } = await sb.from("registration_payments").insert({
        registration_id: reg.id,
        user_id: user.id,
        created_at: at,
        kind: pay.kind ?? "additional",
        method: cash ? "efectivo" : "yape",
        amount: pay.amount,
        receipt_path: path,
        status: pay.status,
        review_note: pay.note ?? null,
        reviewed_at: pay.status === "pending" ? null : at,
      });
      if (payError) throw new Error(`${name} abono: ${payError.message}`);
      payCount++;
    }
  }

  for (const [first, last, created] of accountsOnly) await createUser(first, last, created);

  console.log(
    `Demo creada: ${people.length + accountsOnly.length} cuentas, ${regCount} inscripciones, ${payCount} abonos.`,
  );
}

const command = process.argv[2] ?? "seed";
if (command === "clean") await clean();
else if (command === "seed") await seedAll();
else {
  console.error("Uso: node scripts/demo-seed.mjs [seed|clean]");
  process.exit(1);
}
