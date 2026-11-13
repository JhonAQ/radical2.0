import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { createClient } from "@/utils/supabase/server";
import { AdminLoginForm } from "../components/AdminLoginForm";
import { AdminNav } from "../components/AdminNav";

export const metadata = {
  title: "Administración | Radical 2.0",
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const client = createClient(await cookies());
  const {
    data: { user },
  } = await client.auth.getUser();

  const { data: membership } = user
    ? await client
        .from("admin_users")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  const authorized = Boolean(user && membership);

  if (!authorized) {
    return (
      <AdminLoginForm
        isLoggedInWithoutAccess={Boolean(user && !membership)}
      />
    );
  }

  // Fast count queries for pending badges in sidebar
  const [{ count: pendingRegs }, { count: pendingPays }] = await Promise.all([
    client
      .from("registrations")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    client
      .from("registration_payments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  return (
    <div className="min-h-screen bg-[#f4f6f2] text-[#10343d] lg:pl-[260px]">
      <AdminNav
        userEmail={user?.email || ""}
        isMaster={membership?.role === "master"}
        pendingRegistrationsCount={pendingRegs || 0}
        pendingPaymentsCount={pendingPays || 0}
      />
      <div className="mx-auto max-w-[1540px] px-4 pb-12 pt-7 sm:px-8 lg:px-10 lg:pt-9">
        {children}
      </div>
    </div>
  );
}
