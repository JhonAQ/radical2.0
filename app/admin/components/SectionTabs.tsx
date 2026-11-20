"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type Tab = { href: string; label: string; short?: string; active: boolean };

/**
 * Pestañas de las secciones que agrupan varias pantallas (Campistas, Día del
 * campamento, Ajustes). Viven en el layout para que el menú tenga una sola
 * entrada por sección. En celular ocupan todo el ancho y usan etiquetas cortas.
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
        { href: "/admin/usuarios", label: "Todas las cuentas", short: "Todas", active: onUsers && (ver === "todos" || ver === "con") },
      ],
    };
  } else if (["/admin/escaner", "/admin/ingresos", "/admin/qr-abonos"].includes(pathname)) {
    section = {
      label: "Día del campamento",
      tabs: [
        { href: "/admin/escaner", label: "Escáner", active: pathname === "/admin/escaner" },
        { href: "/admin/ingresos", label: "Control de ingreso", short: "Ingresos", active: pathname === "/admin/ingresos" },
        { href: "/admin/qr-abonos", label: "QR para abonar", short: "QR abonos", active: pathname === "/admin/qr-abonos" },
      ],
    };
  } else if (isMaster && ["/admin/configuracion", "/admin/invitaciones", "/admin/equipo"].includes(pathname)) {
    section = {
      label: "Ajustes",
      tabs: [
        { href: "/admin/configuracion", label: "Campamento", active: pathname === "/admin/configuracion" },
        { href: "/admin/invitaciones", label: "Invitaciones", active: pathname === "/admin/invitaciones" },
        { href: "/admin/equipo", label: "Equipo", active: pathname === "/admin/equipo" },
      ],
    };
  }

  if (!section) return null;

  return (
    <nav
      aria-label={section.label}
      // El escáner es una columna angosta centrada: las pestañas se alinean con ella.
      className={`mb-5 print:hidden lg:mb-6 ${pathname === "/admin/escaner" ? "mx-auto max-w-xl" : ""}`}
    >
      <div
        className="grid gap-1 rounded-xl bg-[#e7f0ed] p-1 sm:inline-flex"
        style={{ gridTemplateColumns: `repeat(${section.tabs.length}, minmax(0, 1fr))` }}
      >
        {section.tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={t.active ? "page" : undefined}
            className={`inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-lg px-2 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008e95] sm:px-3.5 ${
              t.active ? "bg-white text-[#073b43] shadow-sm" : "text-[#46655f] hover:text-[#073b43]"
            }`}
          >
            {t.short ? (
              <>
                <span className="sm:hidden">{t.short}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </>
            ) : (
              t.label
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
