"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "@/components/common/BrandLogo";
import {
  ArrowLeft,
  ChevronRight,
  DoorOpen,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  ScanLine,
  Settings,
  SlidersHorizontal,
  Tent,
  Ticket,
  UserRoundX,
  UsersRound,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import { logout } from "../actions";

interface AdminNavProps {
  userEmail: string;
  isMaster: boolean;
  pendingRegistrationsCount: number;
  pendingPaymentsCount: number;
}

/** Título de la cabecera en celular y, en pantallas de detalle, a dónde vuelve la flecha. */
function mobileScreen(pathname: string): { title: string; back?: string } {
  if (pathname === "/admin") return { title: "" };
  if (/^\/admin\/inscripciones\/[^/]+/.test(pathname)) return { title: "Ficha del campista", back: "/admin/inscripciones" };
  if (pathname.startsWith("/admin/inscripciones") || pathname.startsWith("/admin/usuarios")) return { title: "Campistas" };
  if (pathname.startsWith("/admin/pagos")) return { title: "Validar comprobantes" };
  if (pathname.startsWith("/admin/escaner") || pathname.startsWith("/admin/ingresos") || pathname.startsWith("/admin/qr-abonos"))
    return { title: "Día del campamento" };
  if (pathname.startsWith("/admin/reportes")) return { title: "Reportes" };
  if (pathname.startsWith("/admin/cuenta")) return { title: "Mi cuenta" };
  if (pathname.startsWith("/admin/configuracion") || pathname.startsWith("/admin/invitaciones") || pathname.startsWith("/admin/equipo"))
    return { title: "Ajustes" };
  return { title: "Panel" };
}

// Ruta anterior dentro del panel: la flecha de volver usa el historial solo si se llegó desde el panel.
let previousAdminPath: string | null = null;

type MoreItem = { href: string; label: string; icon: LucideIcon; active: boolean; hint?: string };

export function AdminNav({
  userEmail,
  isMaster,
  pendingRegistrationsCount,
  pendingPaymentsCount,
}: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [cameFromPanel, setCameFromPanel] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const pendingTotal = pendingRegistrationsCount + pendingPaymentsCount;

  const startsWithAny = (...paths: string[]) => paths.some((p) => pathname.startsWith(p));

  // Recuerda de dónde se vino (para la flecha) y cierra el menú al cambiar de pantalla.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con la navegación del cliente
    setCameFromPanel(Boolean(previousAdminPath && previousAdminPath !== pathname));
    previousAdminPath = pathname;
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    sheetRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [moreOpen]);

  // Barra lateral (computadora): una entrada por tarea; las pantallas hermanas van como pestañas.
  const navItems = [
    { href: "/admin", label: "Inicio", icon: LayoutDashboard, active: pathname === "/admin", badge: 0 },
    { href: "/admin/pagos", label: "Validar comprobantes", icon: WalletCards, active: pathname.startsWith("/admin/pagos"), badge: pendingTotal },
    {
      href: "/admin/inscripciones",
      label: "Campistas",
      icon: UsersRound,
      active: startsWithAny("/admin/inscripciones", "/admin/usuarios"),
      badge: 0,
    },
    {
      href: "/admin/escaner",
      label: "Día del campamento",
      icon: Tent,
      active: startsWithAny("/admin/escaner", "/admin/ingresos", "/admin/qr-abonos"),
      badge: 0,
    },
    { href: "/admin/reportes", label: "Reportes", icon: FileText, active: pathname.startsWith("/admin/reportes"), badge: 0 },
    ...(isMaster
      ? [
          {
            href: "/admin/configuracion",
            label: "Ajustes",
            icon: SlidersHorizontal,
            active: startsWithAny("/admin/configuracion", "/admin/invitaciones", "/admin/equipo"),
            badge: 0,
          },
        ]
      : []),
  ];

  // Celular: abajo, lo de todos los días al alcance del pulgar; el resto en «Más», agrupado por tarea.
  const bottomItems = [
    { href: "/admin", label: "Inicio", icon: LayoutDashboard, active: pathname === "/admin", badge: 0 },
    { href: "/admin/pagos", label: "Validar", icon: WalletCards, active: pathname.startsWith("/admin/pagos"), badge: pendingTotal },
    {
      href: "/admin/inscripciones",
      label: "Campistas",
      icon: UsersRound,
      active: startsWithAny("/admin/inscripciones", "/admin/usuarios"),
      badge: 0,
    },
    { href: "/admin/escaner", label: "Escáner", icon: ScanLine, active: startsWithAny("/admin/escaner"), badge: 0 },
  ];
  const moreGroups: { label: string; items: MoreItem[] }[] = [
    {
      label: "Día del campamento",
      items: [
        { href: "/admin/ingresos", label: "Control de ingreso", icon: DoorOpen, active: pathname.startsWith("/admin/ingresos"), hint: "Quién llegó y quién falta" },
        { href: "/admin/qr-abonos", label: "QR para abonar", icon: QrCode, active: pathname.startsWith("/admin/qr-abonos"), hint: "Afiche para imprimir" },
      ],
    },
    {
      label: "Campistas",
      items: [
        { href: "/admin/usuarios?ver=sin", label: "Cuentas sin inscribir", icon: UserRoundX, active: pathname.startsWith("/admin/usuarios"), hint: "Entraron y no enviaron el formulario" },
        { href: "/admin/reportes", label: "Reportes y Excel", icon: FileText, active: pathname.startsWith("/admin/reportes"), hint: "Listas, tesorería, cumpleaños" },
      ],
    },
    ...(isMaster
      ? [
          {
            label: "Ajustes",
            items: [
              { href: "/admin/configuracion", label: "Campamento", icon: SlidersHorizontal, active: pathname.startsWith("/admin/configuracion"), hint: "Preventa y grupo de WhatsApp" },
              { href: "/admin/invitaciones", label: "Invitaciones", icon: Ticket, active: pathname.startsWith("/admin/invitaciones"), hint: "Enlaces con pago ya recibido" },
              { href: "/admin/equipo", label: "Equipo", icon: UsersRound, active: pathname.startsWith("/admin/equipo"), hint: "Quién tiene acceso al panel" },
            ],
          },
        ]
      : []),
  ];
  // «Más» se marca solo si ninguna pestaña de abajo corresponde a la pantalla actual.
  const moreActive =
    !bottomItems.some((i) => i.active) &&
    (moreGroups.some((g) => g.items.some((i) => i.active)) || startsWithAny("/admin/cuenta", "/admin/ingresos", "/admin/qr-abonos"));

  const screen = mobileScreen(pathname);
  function goBack() {
    if (cameFromPanel) router.back();
    else if (screen.back) router.push(screen.back);
  }

  return (
    <>
      {/* ── Computadora: barra lateral ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col bg-[#082f39] text-white lg:flex print:!hidden">
        <div className="px-7 pb-7 pt-7">
          <Link href="/" aria-label="Radical 2.0, inicio">
            <BrandLogo variant="secundario" width={155} />
          </Link>
        </div>

        <nav aria-label="Navegación administrativa" className="flex-1 space-y-1 px-3">
          {navItems.map(({ href, label, icon: Icon, active, badge }) => (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                active ? "bg-[#e9faf5] text-[#073b43] shadow-sm" : "text-[#bed7d3] hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={19} strokeWidth={1.8} aria-hidden />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-bold tabular-nums ${
                    active ? "bg-[#c6ece3] text-[#073b43]" : "bg-[#ffc32b] text-[#10343d]"
                  }`}
                >
                  {badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="m-4 rounded-2xl bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#ffbf24] text-sm font-black text-[#07333d]">
              {(userEmail || "R")[0].toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold">{userEmail}</p>
              <p className="mt-1 text-[11px] text-[#a0c9c4]">{isMaster ? "Cuenta maestra" : "Administrador"}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <Link
              href="/admin/cuenta"
              aria-current={pathname.startsWith("/admin/cuenta") ? "page" : undefined}
              className="flex items-center gap-2 text-xs font-semibold text-[#bad4cf] transition hover:text-white"
            >
              <Settings size={14} aria-hidden />
              <span>Mi cuenta</span>
            </Link>
            <form action={logout}>
              <button type="submit" className="flex items-center gap-2 text-xs font-semibold text-[#bad4cf] transition hover:text-white">
                <LogOut size={14} aria-hidden />
                <span>Cerrar sesión</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── Celular: cabecera con el título de la pantalla ── */}
      <header className="sticky top-0 z-20 border-b border-[#e3eae5] bg-[#fbfcf8]/95 backdrop-blur lg:hidden print:hidden">
        <div className="flex min-h-14 items-center gap-2 px-2">
          {screen.back ? (
            <button
              type="button"
              onClick={goBack}
              aria-label="Volver"
              className="grid size-11 shrink-0 place-items-center rounded-xl text-[#0a3039] transition active:bg-[#e7f0ed]"
            >
              <ArrowLeft size={21} aria-hidden />
            </button>
          ) : (
            <span className="w-2 shrink-0" aria-hidden />
          )}
          {screen.title ? (
            <p className="min-w-0 flex-1 truncate text-[17px] font-bold tracking-tight text-[#0a3039]">{screen.title}</p>
          ) : (
            <Link href="/" aria-label="Radical 2.0, ir al sitio" className="flex-1">
              <BrandLogo variant="secundario" width={104} />
            </Link>
          )}
        </div>
      </header>

      {/* ── Celular: barra inferior ── */}
      <nav
        aria-label="Navegación administrativa"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dfe7e2] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden print:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {bottomItems.map(({ href, label, icon: Icon, active, badge }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={active && !moreOpen ? "page" : undefined}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold ${
                  active && !moreOpen ? "text-[#007b80]" : "text-[#52716f]"
                }`}
              >
                {active && !moreOpen && <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-[#007b80]" aria-hidden />}
                <span className="relative">
                  <Icon size={22} strokeWidth={active && !moreOpen ? 2.3 : 1.8} aria-hidden />
                  {badge > 0 && (
                    <span className="absolute -right-3 -top-1.5 min-w-[18px] rounded-full bg-[#ffc32b] px-1 text-center text-[10px] font-black leading-[18px] text-[#10343d] tabular-nums ring-2 ring-white">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </span>
                {label}
                {badge > 0 && <span className="sr-only">, {badge} por validar</span>}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-controls="admin-more-menu"
              onClick={() => setMoreOpen((v) => !v)}
              className={`relative flex min-h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-bold ${
                moreOpen || moreActive ? "text-[#007b80]" : "text-[#52716f]"
              }`}
            >
              {(moreOpen || moreActive) && <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-[#007b80]" aria-hidden />}
              {moreOpen ? <X size={22} strokeWidth={2.3} aria-hidden /> : <Menu size={22} strokeWidth={moreActive ? 2.3 : 1.8} aria-hidden />}
              Más
            </button>
          </li>
        </ul>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-30 lg:hidden print:hidden">
          <button type="button" aria-label="Cerrar menú" onClick={() => setMoreOpen(false)} className="absolute inset-0 bg-[#03232b]/50" />
          <div
            ref={sheetRef}
            id="admin-more-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Más opciones"
            className="absolute inset-x-0 bottom-0 max-h-[85svh] overflow-y-auto rounded-t-2xl bg-[#fbfcf8] px-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_40px_rgba(3,35,43,0.25)]"
          >
            <span className="mx-auto mb-2 block h-1 w-10 rounded-full bg-[#cfdcd7]" aria-hidden />
            <Link
              href="/admin/cuenta"
              className="flex items-center gap-3 rounded-xl px-3 py-3 transition active:bg-[#e7f0ed]"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#ffbf24] text-sm font-black text-[#07333d]">
                {(userEmail || "R")[0].toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-[#0a3039]">{userEmail}</span>
                <span className="block text-xs text-[#5f7a75]">{isMaster ? "Cuenta maestra" : "Administrador"} · Mi cuenta</span>
              </span>
              <ChevronRight size={16} className="shrink-0 text-[#9cb2ac]" aria-hidden />
            </Link>

            {moreGroups.map((group) => (
              <section key={group.label} className="mt-3">
                <h2 className="px-3 pb-1 text-xs font-semibold text-[#5f7a75]">{group.label}</h2>
                <ul className="overflow-hidden rounded-xl border border-[#e3eae5] bg-white">
                  {group.items.map(({ href, label, icon: Icon, active, hint }) => (
                    <li key={href} className="border-b border-[#eef2ef] last:border-0">
                      <Link
                        href={href}
                        aria-current={active ? "page" : undefined}
                        className={`flex min-h-14 items-center gap-3 px-3 transition active:bg-[#eef5f2] ${active ? "bg-[#eef8f5]" : ""}`}
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#eaf3f0] text-[#0a524a]">
                          <Icon size={18} aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-[#0a3039]">{label}</span>
                          {hint && <span className="block truncate text-xs text-[#6b8580]">{hint}</span>}
                        </span>
                        <ChevronRight size={16} className="shrink-0 text-[#9cb2ac]" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <form action={logout} className="mt-3">
              <button
                type="submit"
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#f1d5d5] bg-white text-sm font-semibold text-red-700 transition active:bg-red-50"
              >
                <LogOut size={17} aria-hidden />
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
