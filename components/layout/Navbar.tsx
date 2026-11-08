"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { BrandLogo } from "@/components/common/BrandLogo";
import { MenuIcon, CloseIcon, ArrowRightIcon } from "@/components/common/Icons";
import { CAMP_CONFIG } from "@/config/site";

const emptySubscribe = () => () => {};

/**
 * Navbar responsivo.
 *
 * - Header fijo (z-40) con logo, navegación desktop y botón hamburguesa.
 * - Menú móvil renderizado en un portal a document.body con estado React,
 *   condicionado por `isOpen`. Sin mutación imperativa del DOM.
 */
export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const closeMenu = useCallback(() => setIsOpen(false), []);
  const toggleMenu = useCallback(() => setIsOpen((open) => !open), []);

  // Bloquear scroll del body mientras el menú está abierto.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Cerrar con Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeMenu]);

  // Si se agranda la ventana a desktop con el menú abierto, cerrarlo
  // para no dejar el scroll bloqueado ni el estilo huérfano.
  useEffect(() => {
    if (!isOpen) return;
    const onResize = () => {
      if (window.innerWidth >= 1024) closeMenu();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isOpen, closeMenu]);

  return (
    <>
      {/* ── HEADER ── */}
      <header className="fixed inset-x-0 top-0 z-40 bg-gradient-to-b from-azul-profundo/85 via-azul-profundo/30 to-transparent py-2">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          {/* Logo */}
          <Link href="#inicio" className="flex items-center">
            <BrandLogo variant="secundario" width={110} priority className="w-28 h-auto" />
          </Link>

          {/* Navegación desktop */}
          <nav aria-label="Navegación principal" className="hidden items-center gap-6 lg:flex">
            {CAMP_CONFIG.navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="text-xs font-extrabold uppercase tracking-wider text-white/85 transition-colors hover:text-amarillo"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA + hamburguesa */}
          <div className="flex items-center gap-2">
            <Link
              href={CAMP_CONFIG.registrationUrl}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amarillo px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-azul-profundo sm:px-4 sm:py-2 sm:text-xs"
            >
              <span>Inscríbete</span>
              <ArrowRightIcon className="w-3 h-3" />
            </Link>

            <button
              type="button"
              aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              onClick={toggleMenu}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20 active:bg-white/20 lg:hidden"
            >
              {isOpen ? <CloseIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── MENÚ MÓVIL (portal a body) ── */}
      {mounted &&
        isOpen &&
        createPortal(
          <>
            <div
              aria-hidden="true"
              className="fixed inset-0 z-[9998] bg-black/75 lg:hidden"
              onClick={closeMenu}
            />
            <div
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menú de navegación"
              className="fixed inset-x-0 top-0 z-[9999] max-h-[100dvh] overflow-y-auto bg-azul-profundo px-6 pb-8 pt-5 shadow-2xl lg:hidden"
            >
              {/* Barra superior del menú */}
              <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-3">
                <BrandLogo variant="secundario" width={100} priority className="w-20 h-auto" />
                <button
                  type="button"
                  onClick={closeMenu}
                  aria-label="Cerrar menú"
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/10 active:bg-white/10"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Enlaces */}
              <nav aria-label="Menú móvil" className="flex flex-col gap-1">
                {CAMP_CONFIG.navItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={closeMenu}
                    className="block rounded-xl px-3 py-3 text-sm font-extrabold uppercase tracking-wider text-white/85 transition-colors hover:bg-white/5 hover:text-amarillo"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* CTA */}
              <Link
                href={CAMP_CONFIG.registrationUrl}
                onClick={closeMenu}
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-amarillo px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-azul-profundo"
              >
                <span>Inscribirme al Campamento</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
