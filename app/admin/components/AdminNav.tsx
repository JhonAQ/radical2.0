"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/common/BrandLogo";
import {
  LayoutDashboard,
  UsersRound,
  WalletCards,
  ShieldCheck,
  Settings,
  LogOut,
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

  const navItems = [
    {
      href: "/admin",
      label: "Resumen",
      icon: LayoutDashboard,
      active: pathname === "/admin",
      badge: 0,
    },
    {
      href: "/admin/inscripciones",
      label: "Inscripciones",
      icon: UsersRound,
      active: pathname.startsWith("/admin/inscripciones"),
      badge: 0,
    },
    {
      href: "/admin/pagos",
      label: "Validar comprobantes",
      icon: WalletCards,
      active: pathname.startsWith("/admin/pagos"),
      badge: pendingRegistrationsCount + pendingPaymentsCount,
    },
    ...(isMaster
      ? [
          {
            href: "/admin/equipo",
            label: "Equipo",
            icon: ShieldCheck,
            active: pathname.startsWith("/admin/equipo"),
            badge: 0,
          },
        ]
      : []),
    {
      href: "/admin/cuenta",
      label: "Mi cuenta",
      icon: Settings,
      active: pathname.startsWith("/admin/cuenta"),
      badge: 0,
    },
  ];

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col bg-[#082f39] text-white lg:flex">
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
          <form action={logout} className="mt-4">
            <button
              type="submit"
              className="flex items-center gap-2 text-xs font-semibold text-[#bad4cf] transition hover:text-white"
            >
              <LogOut size={14} />
              <span>Cerrar sesión</span>
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile Header ── */}
      <header className="sticky top-0 z-20 border-b border-[#e3eae5] bg-[#fbfcf8]/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-3">
          <Link href="/" aria-label="Radical 2.0, inicio">
            <BrandLogo variant="secundario" width={115} />
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg bg-[#e7f0ed] px-3 py-2 text-xs font-bold text-[#07333d]"
            >
              Salir
            </button>
          </form>
        </div>
        <nav
          aria-label="Navegación administrativa móvil"
          className="flex gap-1 overflow-x-auto px-3 pb-2"
        >
          {navItems.map(({ href, label, icon: Icon, active, badge }) => (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
                active
                  ? "bg-[#0b4248] text-white"
                  : "text-[#52716f] hover:bg-[#e7f0ed]"
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
              {badge > 0 && (
                <span className="rounded-full bg-[#ffc32b] px-1.5 text-[10px] font-black text-[#10343d]">
                  {badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
