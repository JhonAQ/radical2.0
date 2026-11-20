"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type Tab = { href: string; label: string; active: boolean };

/**
 * Pestañas de las secciones que agrupan varias pantallas (Campistas, Día del
 * campamento, Ajustes). Viven en el layout para que el menú lateral pueda tener
 * una sola entrada por sección.
 */
export function SectionTabs({ isMaster }: { isMaster: boolean }) {
  const pathname = usePathname();
  const ver = useSearchParams().get("ver") ?? "todos";

  let section: { label: string; tabs: Tab[] } | null = null;

  if (pathname === "/admin/inscripciones" || pathname === "/admin/usuarios") {
    const onUsers = pathname === "/admin/usuarios";
    section = {
      label: "Campistas",
      tabs: [
        { href: "/admin/inscripciones", label: "Inscritos", active: !onUsers },
        { href: "/admin/usuarios?ver=sin", label: "Sin inscribir", active: onUsers && ver === "sin" },
        { href: "/admin/usuarios", label: "Todas las cuentas", active: onUsers && (ver === "todos" || ver === "con") },
      ],
    };
  } else if (["/admin/escaner", "/admin/ingresos", "/admin/qr-abonos"].includes(pathname)) {
    section = {
      label: "Día del campamento",
      tabs: [
        { href: "/admin/escaner", label: "Escáner", active: pathname === "/admin/escaner" },
        { href: "/admin/ingresos", label: "Control de ingreso", active: pathname === "/admin/ingresos" },
        { href: "/admin/qr-abonos", label: "QR para abonar", active: pathname === "/admin/qr-abonos" },
      ],
    };
  } else if (isMaster && ["/admin/configuracion", "/admin/invitaciones", "/admin/equipo", "/admin/cuenta"].includes(pathname)) {
    section = {
      label: "Ajustes",
      tabs: [
        { href: "/admin/configuracion", label: "Configuración", active: pathname === "/admin/configuracion" },
        { href: "/admin/invitaciones", label: "Invitaciones", active: pathname === "/admin/invitaciones" },
        { href: "/admin/equipo", label: "Equipo", active: pathname === "/admin/equipo" },
        { href: "/admin/cuenta", label: "Mi cuenta", active: pathname === "/admin/cuenta" },
      ],
    };
  }

  if (!section) return null;

  return (
    <nav
      aria-label={section.label}
      // El escáner es una columna angosta centrada: las pestañas se alinean con ella.
      className={`mb-6 print:hidden ${pathname === "/admin/escaner" ? "mx-auto max-w-xl" : ""}`}
    >
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-[#4f7a74]">{section.label}</p>
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-[#e7f0ed] p-1 sm:inline-flex">
        {section.tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={t.active ? "page" : undefined}
            className={`inline-flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-lg px-3.5 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008e95] ${
              t.active ? "bg-white text-[#073b43] shadow-sm" : "text-[#46655f] hover:text-[#073b43]"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
