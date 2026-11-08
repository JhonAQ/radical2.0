"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BrandLogo } from "@/components/common/BrandLogo";
import { MenuIcon, CloseIcon, ArrowRightIcon } from "@/components/common/Icons";
import { CAMP_CONFIG } from "@/config/site";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cerrar menú con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-azul-profundo/90 backdrop-blur-md shadow-md py-1.5 sm:py-2"
            : "bg-gradient-to-b from-azul-profundo/80 via-azul-profundo/30 to-transparent py-2 sm:py-2.5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            {/* Logo Compacto */}
            <Link
              href="#inicio"
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-turquesa rounded-lg"
            >
              <BrandLogo
                variant="secundario"
                width={110}
                priority
                className="w-28 sm:w-24 md:w-28 h-auto"
              />
            </Link>

            {/* Desktop Navigation Links (>= 1024px) */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
              {CAMP_CONFIG.navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setActiveSection(item.id)}
                    className={`relative py-1 text-xs xl:text-sm font-extrabold uppercase tracking-wider transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-turquesa ${
                      isActive
                        ? "text-amarillo"
                        : "text-white/85 hover:text-amarillo"
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amarillo rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action: CTA Button + Hamburger */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* CTA Inscríbete */}
              <Link
                href={CAMP_CONFIG.registrationUrl}
                className="group inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-naranja hover:bg-[#e65f00] text-white text-[11px] sm:text-xs md:text-sm font-extrabold uppercase tracking-wider transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-naranja"
              >
                <span>Inscríbete</span>
                <ArrowRightIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>

              {/* Botón Hamburguesa (< 1024px) */}
              <button
                type="button"
                onClick={() => setIsMobileOpen((prev) => !prev)}
                aria-label={isMobileOpen ? "Cerrar menú" : "Abrir menú de navegación"}
                aria-expanded={isMobileOpen}
                className="lg:hidden p-2 rounded-xl text-white hover:bg-white/10 active:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-turquesa cursor-pointer"
              >
                {isMobileOpen ? (
                  <CloseIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <MenuIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Backdrop & Drawer Menu */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col">
          {/* Dark backdrop */}
          <div
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          />

          {/* Slide-down Menu Panel */}
          <div className="relative z-10 w-full bg-azul-profundo/98 backdrop-blur-2xl border-b border-white/15 shadow-2xl px-6 pt-4 pb-8 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-200">
            {/* Top Bar with Logo & Close Button */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <BrandLogo
                variant="secundario"
                width={100}
                priority
                className="w-20 sm:w-24 h-auto"
              />
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                aria-label="Cerrar menú"
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Nav links list */}
            <nav className="flex flex-col gap-1">
              {CAMP_CONFIG.navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => {
                      setActiveSection(item.id);
                      setIsMobileOpen(false);
                    }}
                    className={`flex items-center justify-between px-3 py-3 rounded-xl text-sm font-extrabold uppercase tracking-wider transition-colors ${
                      isActive
                        ? "text-amarillo bg-white/10"
                        : "text-white/85 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-amarillo shadow-xs" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile CTA Button */}
            <div className="pt-2">
              <Link
                href={CAMP_CONFIG.registrationUrl}
                onClick={() => setIsMobileOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-naranja hover:bg-[#e65f00] text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-transform active:scale-98"
              >
                <span>Inscribirme al Campamento</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
