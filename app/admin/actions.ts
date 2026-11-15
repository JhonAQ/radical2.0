"use server";

import { cookies } from "next/headers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

async function adminContext(master = false) {
  const client = createClient(await cookies());
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;
  const { data: membership } = await client
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || (master && membership.role !== "master")) return null;
  return { client, user, role: membership.role as "master" | "admin" };
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function login(form: FormData) {
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  const client = createClient(await cookies());
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) redirect("/admin?error=login");
  const {
    data: { user },
  } = await client.auth.getUser();
  const { data: member } = await client
    .from("admin_users")
    .select("role")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();
  if (!member) {
    await client.auth.signOut();
    redirect("/admin?error=access");
  }
  redirect("/admin");
}

export async function logout() {
  const client = createClient(await cookies());
  await client.auth.signOut();
  redirect("/admin");
}

export async function requestPasswordReset(form: FormData) {
  const email = String(form.get("email") || "")
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect("/admin?error=reset");
  const host =
    (await headers()).get("x-forwarded-host") || (await headers()).get("host");
  if (host !== "radical2-0.vercel.app") redirect("/admin?error=reset_domain");
  const client = createClient(await cookies());
  const callback = new URL("/auth/callback", "https://radical2-0.vercel.app");
  callback.searchParams.set("next", "/admin/reset");
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: callback.toString(),
  });
  if (error) redirect("/admin?error=reset_service");
  redirect("/admin?success=reset_sent");
}

function reviewLocation(form: FormData, id: string, result: string) {
  const returnTo = form.get("return_to");
  const isPayments = form.get("view") === "payments";
  const params = new URLSearchParams();
  const query = String(form.get("filter_q") || "").slice(0, 100);
  const status = String(form.get("filter_status") || "");
  if (query) params.set("q", query);
  if (["all", "pending", "approved", "rejected"].includes(status))
    params.set("status", status);
  const [key, value] = result.split("=");
  params.set(key, value);

  if (returnTo) {
    const returnUrl = String(returnTo);
    const separator = returnUrl.includes("?") ? "&" : "?";
    return `${returnUrl}${separator}${params.toString()}`;
  }

  if (!isPayments) {
    params.set("selected", id);
  }
  const base = isPayments ? "/admin/pagos" : "/admin/inscripciones";
  return `${base}?${params.toString()}`;
}

export async function review(form: FormData) {
  const context = await adminContext();
  if (!context) redirect("/admin?error=access");
  const id = String(form.get("id") || "");
  const status = String(form.get("status") || "");
  const note = String(form.get("note") || "")
    .trim()
    .slice(0, 1000);
  if (
    !/^[0-9a-f-]{36}$/i.test(id) ||
    !["approved", "rejected", "pending"].includes(status)
  )
    redirect(`/admin/inscripciones?error=review`);
  if (status === "rejected" && !note)
    redirect(reviewLocation(form, id, "error=note"));
  const { error } = await context.client.rpc("review_initial_registration", {
    p_id: id,
    p_status: status,
    p_note: note || null,
  });
  if (error) redirect(reviewLocation(form, id, "error=review"));
  revalidatePath("/admin");
  revalidatePath("/admin/inscripciones");
  revalidatePath("/admin/pagos");
  redirect(reviewLocation(form, id, "success=review"));
}

export async function reviewPayment(form: FormData) {
  const context = await adminContext();
  if (!context) redirect("/admin?error=access");
  const paymentId = String(form.get("payment_id") || "");
  const registrationId = String(form.get("registration_id") || "");
  const status = String(form.get("status") || "");
  const note = String(form.get("note") || "")
    .trim()
    .slice(0, 1000);
  if (
    !/^[0-9a-f-]{36}$/i.test(paymentId) ||
    !/^[0-9a-f-]{36}$/i.test(registrationId) ||
    !["approved", "rejected", "pending"].includes(status)
  )
    redirect(`/admin/inscripciones?error=review`);
  if (status === "rejected" && !note)
    redirect(reviewLocation(form, registrationId, "error=note"));
  const { error } = await context.client.rpc("review_registration_payment", {
    p_id: paymentId,
    p_status: status,
    p_note: note || null,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/inscripciones");
  revalidatePath("/admin/pagos");
  redirect(
    reviewLocation(
      form,
      registrationId,
      error ? "error=payment_review" : "success=review",
    ),
  );
}

export async function setPassword(form: FormData) {
  const context = await adminContext();
  if (!context) redirect("/admin?error=access");
  const password = String(form.get("password") || "");
  if (password.length < 6 || password !== String(form.get("confirm") || ""))
    redirect("/admin/cuenta?error=password");
  const { error } = await context.client.auth.updateUser({ password });
  if (error) redirect("/admin/cuenta?error=password");
  redirect("/admin/cuenta?success=password");
}

export async function createAdmin(form: FormData) {
  const context = await adminContext(true);
  if (!context) redirect("/admin?error=access");
  const email = String(form.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(form.get("password") || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6)
    redirect("/admin/equipo?error=admin_input");
  const service = serviceClient();
  if (!service) redirect("/admin/equipo?error=configuration");
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) redirect("/admin/equipo?error=admin_create");
  const { error: membershipError } = await service
    .from("admin_users")
    .insert({ user_id: data.user.id, role: "admin" });
  if (membershipError) {
    await service.auth.admin.deleteUser(data.user.id);
    redirect("/admin/equipo?error=admin_create");
  }
  revalidatePath("/admin");
  revalidatePath("/admin/equipo");
  redirect("/admin/equipo?success=admin");
}

export async function removeAdmin(form: FormData) {
  const context = await adminContext(true);
  if (!context) redirect("/admin?error=access");
  const id = String(form.get("id") || "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || id === context.user.id)
    redirect("/admin?error=access");
  const service = serviceClient();
  if (!service) redirect("/admin/equipo?error=configuration");
  const { error } = await service
    .from("admin_users")
    .delete()
    .eq("user_id", id)
    .eq("role", "admin");
  if (error) redirect("/admin/equipo?error=admin_create");
  revalidatePath("/admin");
  revalidatePath("/admin/equipo");
  redirect("/admin/equipo?success=removed");
}

export async function resetAdminPassword(form: FormData) {
  const context = await adminContext(true);
  if (!context) redirect("/admin?error=access");
  const id = String(form.get("id") || "");
  const password = String(form.get("password") || "");
  if (
    !/^[0-9a-f-]{36}$/i.test(id) ||
    password.length < 6 ||
    password !== String(form.get("confirm") || "")
  )
    redirect("/admin/equipo?error=password");
  const service = serviceClient();
  if (!service) redirect("/admin/equipo?error=configuration");
  const { data: member, error: memberError } = await service
    .from("admin_users")
    .select("user_id")
    .eq("user_id", id)
    .maybeSingle();
  if (memberError || !member)
    redirect("/admin/equipo?error=admin_not_found");
  const { error } = await service.auth.admin.updateUserById(id, { password });
  if (error) redirect("/admin/equipo?error=password");
  revalidatePath("/admin");
  revalidatePath("/admin/equipo");
  redirect("/admin/equipo?success=admin_password");
}

export async function grantExistingAdmin(form: FormData) {
  const context = await adminContext(true);
  if (!context) redirect("/admin?error=access");
  const email = String(form.get("email") || "")
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    redirect("/admin/equipo?error=admin_input");
  const service = serviceClient();
  if (!service) redirect("/admin/equipo?error=configuration");
  let userId: string | undefined;
  let confirmed = false;
  for (let page = 1; ; page++) {
    const { data, error } = await service.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) redirect("/admin/equipo?error=admin_create");
    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email,
    );
    userId = match?.id;
    confirmed = Boolean(match?.email_confirmed_at);
    if (userId || data.users.length < 1000) break;
  }
  if (!userId) redirect("/admin/equipo?error=admin_not_found");
  if (!confirmed) redirect("/admin/equipo?error=admin_unverified");
  const { error } = await service
    .from("admin_users")
    .insert({ user_id: userId, role: "admin" });
  if (error) redirect("/admin/equipo?error=admin_create");
  revalidatePath("/admin");
  revalidatePath("/admin/equipo");
  redirect("/admin/equipo?success=admin_existing");
}

function personalFields(form: FormData) {
  const text = (name: string) => String(form.get(name) || "").trim();
  return {
    p_first_name: text("first_name"),
    p_last_name: text("last_name"),
    p_birth_date: text("birth_date"),
    p_gender: text("gender"),
    p_phone: text("phone"),
    p_emergency_name: text("emergency_name"),
    p_emergency_relation: text("emergency_relation"),
    p_emergency_phone: text("emergency_phone"),
  };
}

export async function updateRegistrationData(form: FormData) {
  const context = await adminContext();
  if (!context) redirect("/admin?error=access");
  const id = String(form.get("id") || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin/inscripciones?error=review");
  const { error } = await context.client.rpc("admin_update_registration", {
    p_id: id,
    ...personalFields(form),
    p_document: String(form.get("document") || "").replace(/\s/g, ""),
    p_email: String(form.get("email") || "").trim().toLowerCase(),
  });
  revalidatePath("/admin/inscripciones");
  revalidatePath(`/admin/inscripciones/${id}`);
  redirect(
    `/admin/inscripciones/${id}?${error ? (error.code === "23505" ? "error=document_taken" : "error=registration_data") : "success=registration_data"}`,
  );
}

export async function updateCampSettings(form: FormData) {
  const context = await adminContext();
  if (!context) redirect("/admin?error=access");
  // El admin elige el último día de preventa; vale hasta las 24:00 (hora de Lima, UTC-5 sin horario de verano),
  // es decir, el corte es las 00:00 del día siguiente.
  const raw = String(form.get("preventa_last_day") || "");
  const lastDay = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00-05:00`) : null;
  const deadline = lastDay && !Number.isNaN(lastDay.getTime())
    ? new Date(lastDay.getTime() + 24 * 60 * 60 * 1000)
    : null;
  if (!deadline || Number.isNaN(deadline.getTime()))
    redirect("/admin/configuracion?error=settings");
  const { error } = await context.client
    .from("camp_settings")
    .update({
      preventa_deadline: deadline.toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: context.user.id,
    })
    .eq("id", true);
  if (error) redirect("/admin/configuracion?error=settings");
  revalidatePath("/", "layout");
  redirect("/admin/configuracion?success=settings");
}
