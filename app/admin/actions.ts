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
    redirect("/admin?error=review");
  if (status === "rejected" && !note)
    redirect(`/admin?selected=${encodeURIComponent(id)}&error=note`);
  const { error } = await context.client.rpc("review_initial_registration", {
    p_id: id,
    p_status: status,
    p_note: note || null,
  });
  if (error) redirect("/admin?error=review");
  revalidatePath("/admin");
  redirect(`/admin?selected=${encodeURIComponent(id)}&success=review`);
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
    redirect("/admin?error=review");
  if (status === "rejected" && !note)
    redirect(
      `/admin?selected=${encodeURIComponent(registrationId)}&error=note`,
    );
  const { error } = await context.client.rpc("review_registration_payment", {
    p_id: paymentId,
    p_status: status,
    p_note: note || null,
  });
  revalidatePath("/admin");
  redirect(
    `/admin?selected=${encodeURIComponent(registrationId)}&${error ? "error=payment_review" : "success=review"}`,
  );
}

export async function setPassword(form: FormData) {
  const context = await adminContext();
  if (!context) redirect("/admin?error=access");
  const password = String(form.get("password") || "");
  if (password.length < 12 || password !== String(form.get("confirm") || ""))
    redirect("/admin?error=password");
  const { error } = await context.client.auth.updateUser({ password });
  if (error) redirect("/admin?error=password");
  redirect("/admin?success=password");
}

export async function createAdmin(form: FormData) {
  const context = await adminContext(true);
  if (!context) redirect("/admin?error=access");
  const email = String(form.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(form.get("password") || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12)
    redirect("/admin?error=admin_input");
  const service = serviceClient();
  if (!service) redirect("/admin?error=configuration");
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) redirect("/admin?error=admin_create");
  const { error: membershipError } = await service
    .from("admin_users")
    .insert({ user_id: data.user.id, role: "admin" });
  if (membershipError) {
    await service.auth.admin.deleteUser(data.user.id);
    redirect("/admin?error=admin_create");
  }
  revalidatePath("/admin");
  redirect("/admin?success=admin");
}

export async function removeAdmin(form: FormData) {
  const context = await adminContext(true);
  if (!context) redirect("/admin?error=access");
  const id = String(form.get("id") || "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || id === context.user.id)
    redirect("/admin?error=access");
  const service = serviceClient();
  if (!service) redirect("/admin?error=configuration");
  const { error } = await service
    .from("admin_users")
    .delete()
    .eq("user_id", id)
    .eq("role", "admin");
  if (error) redirect("/admin?error=admin_create");
  revalidatePath("/admin");
  redirect("/admin?success=removed");
}

export async function grantExistingAdmin(form: FormData) {
  const context = await adminContext(true);
  if (!context) redirect("/admin?error=access");
  const email = String(form.get("email") || "")
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    redirect("/admin?error=admin_input");
  const service = serviceClient();
  if (!service) redirect("/admin?error=configuration");
  let userId: string | undefined;
  let confirmed = false;
  for (let page = 1; ; page++) {
    const { data, error } = await service.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) redirect("/admin?error=admin_create");
    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email,
    );
    userId = match?.id;
    confirmed = Boolean(match?.email_confirmed_at);
    if (userId || data.users.length < 1000) break;
  }
  if (!userId) redirect("/admin?error=admin_not_found");
  if (!confirmed) redirect("/admin?error=admin_unverified");
  const { error } = await service
    .from("admin_users")
    .insert({ user_id: userId, role: "admin" });
  if (error) redirect("/admin?error=admin_create");
  revalidatePath("/admin");
  redirect("/admin?success=admin_existing");
}
