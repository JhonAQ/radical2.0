"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/common/BrandLogo";
import {
  LayoutDashboard,
  UsersRound,
  WalletCards,
  Settings,
  SlidersHorizontal,
  LogOut,
  Tent,
  FileText,
  ScanLine,
  DoorOpen,
  QrCode,
  Menu,
} from "lucide-react";
import { logout } from "../actions";

interface AdminNavProps {
  userEmail: string;
  isMaster: boolean;
  pendingRegistrationsCount: number;
  pendingPaymentsCount: number;
}

export function AdminNav({
  userEmail,
  isMaster,
  pendingRegistrationsCount,
  pendingPaymentsCount,
}: AdminNavProps) {
  const pathname = usePathname();

  const startsWithAny = (...paths: string[]) => paths.some((p) => pathname.startsWith(p));

  // Una entrada por tarea; las pantallas relacionadas se muestran como pestañas dentro de cada sección.
  const navItems = [
    {
      href: "/admin",
      label: "Inicio",
      icon: LayoutDashboard,
      active: pathname === "/admin",
      badge: 0,
    },
    {
      href: "/admin/inscripciones",
      label: "Campistas",
      icon: UsersRound,
      active: startsWithAny("/admin/inscripciones", "/admin/usuarios"),
      badge: 0,
    },
    {
      href: "/admin/pagos",
      label: "Validar comprobantes",
      icon: WalletCards,
      active: pathname.startsWith("/admin/pagos"),
      badge: pendingRegistrationsCount + pendingPaymentsCount,
    },
    {
      href: "/admin/escaner",
      label: "Día del campamento",
      icon: Tent,
      active: startsWithAny("/admin/escaner", "/admin/ingresos", "/admin/qr-abonos"),
      badge: 0,
    },
    {
      href: "/admin/reportes",
      label: "Reportes",
      icon: FileText,
      active: pathname.startsWith("/admin/reportes"),
      badge: 0,
    },
    // Ajustes (configuración del campamento y equipo) es solo de la cuenta maestra.
    ...(isMaster
      ? [
          {
            href: "/admin/configuracion",
            label: "Ajustes",
            icon: SlidersHorizontal,
            active: startsWithAny("/admin/configuracion", "/admin/invitaciones", "/admin/equipo", "/admin/cuenta"),
            badge: 0,
          },
        ]
      : []),
  ];

  // Celular: los 4 accesos del día a día abajo; el resto en "Más".
  const [moreOpen, setMoreOpen] = useState(false);
  const scannerItem = {
    href: "/admin/escaner",
    label: "Escáner",
    icon: ScanLine,
    active: pathname.startsWith("/admin/escaner"),
    badge: 0,
  };
  const byHref = (href: string) => navItems.find((i) => i.href === href)!;
  const bottomItems = [
    { ...byHref("/admin"), label: "Inicio" },
    scannerItem,
    byHref("/admin/inscripciones"),
    { ...byHref("/admin/pagos"), label: "Validar" },
  ];
  const moreItems = [
    {
      href: "/admin/ingresos",
      label: "Control de ingreso",
      icon: DoorOpen,
      active: pathname.startsWith("/admin/ingresos"),
    },
    {
      href: "/admin/qr-abonos",
      label: "QR para abonar",
      icon: QrCode,
      active: pathname.startsWith("/admin/qr-abonos"),
    },
    byHref("/admin/reportes"),
    ...(isMaster ? [byHref("/admin/configuracion")] : []),
    {
      href: "/admin/cuenta",
      label: "Mi cuenta",
      icon: Settings,
      active: pathname.startsWith("/admin/cuenta"),
    },
  ];
  const moreActive = moreItems.some((i) => i.active);

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col bg-[#082f39] text-white lg:flex print:!hidden">
        <div className="relative overflow-hidden px-7 pb-8 pt-7">
          <div className="absolute -right-14 -top-20 h-44 w-44 rounded-full bg-[#06b5b0]/10 blur-3xl" />
          <Link href="/" aria-label="Radical 2.0, inicio">
            <BrandLogo variant="secundario" width={155} />
          </Link>
          <p className="mt-5 text-[10px] font-black uppercase tracking-[.22em] text-[#88c4c0]">
            Centro de operaciones
          </p>
        </div>

        <div className="px-5 text-[10px] font-bold uppercase tracking-[.2em] text-[#78a5a5]">
          Campamento
        </div>

        <nav
          aria-label="Navegación administrativa"
          className="mt-3 flex-1 space-y-1 px-3"
        >
          {navItems.map(({ href, label, icon: Icon, active, badge }) => (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-[#e9faf5] text-[#073b43] shadow-sm"
                  : "text-[#bed7d3] hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                    active
                      ? "bg-[#c6ece3] text-[#073b43]"
                      : "bg-[#18535a] text-[#b9ece4]"
                  }`}
                >
                  {badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* User Card */}
        <div className="m-4 rounded-2xl bg-white/5 p-4 shadow-[0_2px_10px_rgba(0,0,0,0.15)]">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#ffbf24] text-sm font-black text-[#07333d]">
              {(userEmail || "R")[0].toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold">{userEmail}</p>
              <p className="mt-1 text-[11px] text-[#a0c9c4]">
                {isMaster ? "Cuenta maestra" : "Administrador"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <Link
              href="/admin/cuenta"
              className="flex items-center gap-2 text-xs font-semibold text-[#bad4cf] transition hover:text-white"
            >
              <Settings size={14} />
              <span>Mi cuenta</span>
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-2 text-xs font-semibold text-[#bad4cf] transition hover:text-white"
              >
                <LogOut size={14} />
                <span>Cerrar sesión</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── Celular: cabecera simple ── */}
      <header className="sticky top-0 z-20 border-b border-[#e3eae5] bg-[#fbfcf8]/95 backdrop-blur lg:hidden print:hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-2.5">
          <Link href="/" aria-label="Radical 2.0, inicio">
            <BrandLogo variant="secundario" width={110} />
          </Link>
          <span className="truncate text-xs font-semibold text-[#52716f]">{userEmail}</span>
        </div>
      </header>

      {/* ── Celular: barra inferior con lo que más se usa ── */}
      <nav
        aria-label="Navegación administrativa móvil"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dfe7e2] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden print:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {bottomItems.map(({ href, label, icon: Icon, active, badge }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => setMoreOpen(false)}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold ${
                  active && !moreOpen ? "text-[#007b80]" : "text-[#52716f]"
                }`}
              >
                <span className="relative">
                  <Icon size={22} strokeWidth={active && !moreOpen ? 2.3 : 1.8} aria-hidden />
                  {badge > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-[#ffc32b] px-1 text-center text-[10px] font-black leading-4 text-[#10343d]">
                      {badge}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-controls="admin-more-menu"
              onClick={() => setMoreOpen((v) => !v)}
              className={`flex min-h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-bold ${
                moreOpen || moreActive ? "text-[#007b80]" : "text-[#52716f]"
              }`}
            >
              <Menu size={22} strokeWidth={moreOpen || moreActive ? 2.3 : 1.8} aria-hidden />
              Más
            </button>
          </li>
        </ul>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-30 lg:hidden print:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-[#03232b]/50"
          />
          <div
            id="admin-more-menu"
            className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white px-3 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl"
          >
            <ul className="space-y-1">
              {moreItems.map(({ href, label, icon: Icon, active }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMoreOpen(false)}
                    className={`flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold ${
                      active ? "bg-[#e9faf5] text-[#073b43]" : "text-[#10343d] hover:bg-[#f1f6f4]"
                    }`}
                  >
                    <Icon size={19} aria-hidden />
                    {label}
                  </Link>
                </li>
              ))}
              <li className="border-t border-slate-100 pt-1">
                <form action={logout}>
                  <button type="submit" className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-sm font-semibold text-red-700 hover:bg-red-50">
                    <LogOut size={19} aria-hidden />
                    Cerrar sesión
                  </button>
                </form>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
