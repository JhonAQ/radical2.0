import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { BrandLogo } from "@/components/common/BrandLogo";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const supabase = createClient(await cookies());
  const [{ data: { user } }, params] = await Promise.all([supabase.auth.getUser(), searchParams]);
  const next = params.next === "admin" ? "admin" : undefined;
  const avatarUrl = typeof user?.user_metadata?.avatar_url === "string"
    ? user.user_metadata.avatar_url
    : typeof user?.user_metadata?.picture === "string"
      ? user.user_metadata.picture
      : null;

  return <main className="relative flex min-h-svh flex-col overflow-hidden bg-[#faf7ed] text-[#0b2d36]">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,174,184,.15),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(255,198,41,.22),transparent_55%)]" />
    <header className="relative flex items-center justify-between gap-5 px-6 py-5 sm:px-12"><Link href="/" aria-label="Radical 2.0, inicio"><BrandLogo variant="secundario" width={145} priority /></Link><Link href="/inscripcion" className="text-sm font-bold hover:underline">Volver a inscripción</Link></header>
    <section aria-labelledby="login-title" className="relative m-auto w-full max-w-lg px-6 py-12">
      <p className="mb-5 text-sm font-bold uppercase tracking-[.2em] text-[#008e99]">Tu experiencia Radical</p>
      <h1 id="login-title" className="font-[family-name:var(--font-blowbrush)] text-5xl leading-tight sm:text-6xl">{user ? "YA ESTÁS DENTRO" : "BIENVENIDO A RADICAL"}</h1>
      <p className="mb-8 mt-5 leading-relaxed text-[#49676c]">{user ? "Tu sesión está activa. Puedes continuar con tu inscripción." : "Entra con tu cuenta de Google para continuar tu experiencia en Radical 2.0."}</p>
      {params.error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-[#b42318]">{params.error === "logout" ? "No pudimos cerrar tu sesión. Inténtalo nuevamente." : "No se completó el acceso con Google. Puedes volver a intentarlo."}</p>}
      {user ? <div className="space-y-4"><div className="flex items-center gap-4 rounded-xl bg-white/80 p-4">{avatarUrl ? <Image src={avatarUrl} alt="" width={56} height={56} unoptimized className="size-14 shrink-0 rounded-full object-cover ring-2 ring-[#ffc629]" /> : <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#0b2d36] text-xl font-bold text-white">{(user.email?.[0] ?? "R").toUpperCase()}</span>}<p className="min-w-0 break-words text-sm font-semibold">{user.email}</p></div><Link href={next === "admin" ? "/admin" : "/inscripcion"} className="flex min-h-14 items-center justify-center rounded-xl bg-[#ffc629] px-5 py-3 font-bold">{next === "admin" ? "Continuar al panel →" : "Continuar mi inscripción →"}</Link><form action={signOut}><button type="submit" className="min-h-12 w-full rounded-xl border border-[#0b2d36]/20 px-5 py-3 text-sm font-bold">Cerrar sesión</button></form></div> : <GoogleLoginButton next={next} />}
    </section>
    <footer className="relative px-6 py-6 text-center text-xs text-[#49676c]">Radical 2.0 · Viviendo Radikalmente</footer>
  </main>;
}
