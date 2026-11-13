import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/utils/supabase/server";
import { BrandLogo } from "@/components/common/BrandLogo";
import { ArrowLeft } from "lucide-react";
import "./mi-inscripcion.css";

export default async function MiInscripcionLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: registration } = await supabase
    .from("registrations")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!registration) redirect("/inscripcion");

  return (
    <main className="mi-inscripcion-page">
      <div className="mi-inscripcion-shell">
        <header className="mi-inscripcion-header">
          <Link
            href="/"
            aria-label="Volver al inicio de Radical 2.0"
            className="mi-inscripcion-header-logo"
          >
            <BrandLogo variant="secundario" width={150} priority />
          </Link>
          <nav className="mi-inscripcion-header-nav">
            <Link href="/" className="mi-inscripcion-header-link">
              <ArrowLeft size={16} />
              <span>Volver</span>
            </Link>
          </nav>
        </header>
        <div className="mi-inscripcion-content">{children}</div>
      </div>
    </main>
  );
}
